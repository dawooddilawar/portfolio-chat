# backend/app/services/document_processor.py

from typing import List, Optional
import logging
from pathlib import Path

from langchain_core.documents import Document
from langchain_community.document_loaders import UnstructuredFileLoader, TextLoader
from langchain_community.document_loaders.pdf import PyMuPDFLoader
from langchain_core.embeddings import Embeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores.pgvector import PGVector
from langchain_openai import OpenAIEmbeddings
from unstructured.partition.api import partition_via_api
from unstructured.partition.auto import partition
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(
            self,
            collection_name: str = "portfolio_chunks",
            chunk_size: int = 1000,
            chunk_overlap: int = 200
    ):

        self.connection_string = settings.get_database_url()
        self.collection_name = collection_name
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

        # Configure text splitter for semantic chunking
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
            is_separator_regex=False,
        )

    async def process_documents(self, file_paths: List[str], clear_existing: bool = False) -> None:
        """Process multiple documents and store them in the vector database."""
        try:
            logger.info(f"Processing {len(file_paths)} documents")

            # Clear existing vectors if requested
            if clear_existing:
                await self._clear_vectors()

            all_documents = []
            for file_path in file_paths:
                docs = await self._load_and_process_file(file_path)
                all_documents.extend(docs)

            # Store documents in vector database
            await self._store_documents(all_documents)

            logger.info(f"Successfully processed {len(all_documents)} chunks")

        except Exception as e:
            logger.error(f"Error processing documents: {str(e)}", exc_info=True)
            raise

    async def _load_and_process_file(self, file_path: str) -> List[Document]:
        """Load and process a single file."""
        path = Path(file_path)
        logger.info(f"Processing file: {path}")

        try:
            # Load document based on file type
            if path.suffix.lower() == '.pdf':
                docs = await self._load_pdf(path)
            elif path.suffix.lower() in ['.tex', '.md']:
                docs = await self._load_with_unstructured(path)
            else:
                raise ValueError(f"Unsupported file type: {path.suffix}. Supported types: .pdf, .tex, .md")

            # Clean and preprocess documents
            cleaned_docs = self._clean_documents(docs)

            # Split documents into chunks
            chunks = await self._split_documents(cleaned_docs)

            logger.info(f"Generated {len(chunks)} chunks from {path}")
            return chunks

        except Exception as e:
            logger.error(f"Error processing file {path}: {str(e)}", exc_info=True)
            raise

    async def _load_pdf(self, path: Path) -> List[Document]:
        """Load PDF using PyMuPDF."""
        loader = PyMuPDFLoader(str(path))
        return loader.load()

    async def _load_with_unstructured(self, path: Path) -> List[Document]:
        """Load documents using Unstructured's partition capability."""
        # Use Unstructured to partition the document
        elements = partition(str(path))

        # Convert elements to LangChain documents with metadata
        docs = []
        current_section = ""

        for element in elements:
            # Update current section if this is a heading
            if element.category == "HeaderText":
                current_section = element.text
                continue

            # Create document with metadata
            doc = Document(
                page_content=element.text,
                metadata={
                    "source": str(path),
                    "section": current_section,
                    "category": element.category,
                    "coordinates": element.coordinates if hasattr(element, "coordinates") else None,
                }
            )
            docs.append(doc)

        return docs

    def _clean_documents(self, docs: List[Document]) -> List[Document]:
        """Clean and preprocess documents using Unstructured's partition capabilities."""
        cleaned_docs = []
        for doc in docs:
            try:
                # Use partition to clean and structure the text
                elements = partition(text=doc.page_content)
                # Combine the cleaned text from elements
                cleaned_text = " ".join(element.text for element in elements)
                
                # Create new document with cleaned text
                cleaned_doc = Document(
                    page_content=cleaned_text,
                    metadata=doc.metadata
                )
                cleaned_docs.append(cleaned_doc)
                
            except Exception as e:
                logger.warning(f"Error cleaning document, falling back to basic cleaning: {str(e)}")
                # Fallback to basic cleaning if partition fails
                cleaned_text = doc.page_content
                cleaned_text = cleaned_text.replace('\n\n', ' ').replace('\n', ' ')
                cleaned_text = ' '.join(cleaned_text.split())
                cleaned_doc = Document(
                    page_content=cleaned_text,
                    metadata=doc.metadata
                )
                cleaned_docs.append(cleaned_doc)

        return cleaned_docs

    async def _split_documents(self, docs: List[Document]) -> List[Document]:
        """Split documents into chunks."""
        chunks = []
        for doc in docs:
            # Split the document while preserving metadata
            doc_chunks = self.text_splitter.split_documents([doc])
            chunks.extend(doc_chunks)
        return chunks

    async def _store_documents(self, documents: List[Document]) -> None:
        """Store documents in the vector database."""
        try:
            # Create vector store
            vector_store = PGVector.from_documents(
                embedding=self.embeddings,
                documents=documents,
                collection_name=self.collection_name,
                connection_string=self.connection_string,
            )

            logger.info(f"Successfully stored {len(documents)} documents in vector store")

        except Exception as e:
            logger.error(f"Error storing documents in vector store: {str(e)}", exc_info=True)
            raise

    async def _clear_vectors(self) -> None:
        """Clear existing vectors from the database."""
        try:
            PGVector.from_existing_index(
                embedding=self.embeddings,
                collection_name=self.collection_name,
                connection_string=self.connection_string,
            ).delete_collection()

            logger.info("Cleared existing vectors")

        except Exception as e:
            logger.error(f"Error clearing vectors: {str(e)}", exc_info=True)
            raise