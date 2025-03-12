# backend/app/services/rag_service.py

import logging
from typing import List, Dict, Any, Tuple
from langchain_core.documents import Document
from langchain_community.vectorstores.pgvector import PGVector
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.runnables import RunnableParallel
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import DocumentCompressorPipeline
from langchain.retrievers.document_compressors import LLMChainExtractor
from app.core.config import get_settings
from app.config import CONTACT_DETAILS, PERSONALITY_SETTINGS
import json
import datetime

settings = get_settings()
logger = logging.getLogger(__name__)

class RAGService:
    def __init__(
            self,
            collection_name: str = "portfolio_chunks",
            model_name: str = "gemini-2.0-flash",
            temperature: float = 0.7,
            max_tokens: int = 1000
    ):
        self.connection_string = settings.get_database_url()
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            max_tokens=max_tokens
        )

        # Initialize vector store
        self.vector_store = PGVector(
            collection_name=collection_name,
            connection_string=self.connection_string,
            embedding_function=self.embeddings,
        )

        # Set up document compressor for better retrieval
        compressor_pipeline = DocumentCompressorPipeline(
            transformers=[
                LLMChainExtractor.from_llm(llm=self.llm)
            ]
        )

        # Set up retriever with compression
        base_retriever = self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )

        self.retriever = ContextualCompressionRetriever(
            base_compressor=compressor_pipeline,
            base_retriever=base_retriever
        )
        
        self.personality = self.get_current_personality()
        self._initialize_rag_chain()

    def get_current_personality(self) -> str:
        """Determine the current personality based on time and day."""
        now = datetime.datetime.now()
        if now.weekday() >= 5:  # Saturday and Sunday
            return "weekend"
        hour = now.hour
        if 6 <= hour < 12:
            return "morning"
        elif 22 <= hour or hour < 6:
            return "late_night"
        else:
            return "base"

    def _initialize_rag_chain(self) -> None:
        """Initialize the RAG chain with custom prompting."""
        # Move templates to separate constants or config file
        CONTEXT_TEMPLATE = (
            "Here is information about me from my resume and portfolio:\n"
            "You are acting as me, the portfolio owner. Try to keep a profesional yet casual tone, keep the response short and concise."
            "You have access to my resume and portfolio, use this information to provide a detailed and accurate response. It includes my projects, experience, and background."
            "{context}\n\n"
            "Use this information to provide a detailed and accurate response. "
            "If the information provided doesn't contain enough details to fully "
            "answer the question, acknowledge what you do know from the context "
            "and indicate what details are not available."
            "Do not end include extra information in the response, exclude things like \"If you have any more questions or need further details, feel free to ask!\" stay true to the question."
            "I have also provided my contact details below, when prompted for contact details, use these. I want to be reachable by mobile phone as well, so when prompted for phone number, use this."
            "If the contact details are links, e.g. github, twitter, resume, etc. provide the link as an <a href='link'>link</a>, with the text being the name of the link."
            f"My contact details are: Mobile Phone: {CONTACT_DETAILS['phone_number']}, "
            f"GitHub: {CONTACT_DETAILS['github']}, "
            f"Twitter: {CONTACT_DETAILS['twitter']}, "
            f"Resume: {CONTACT_DETAILS['resume']}"
        )

        QUESTION_TEMPLATE = (
            "You are acting as me, the portfolio owner. Answer the following question "
            "based on the provided context about my experience, projects, and background. "
            "Be natural and conversational while maintaining professionalism.\n\n"
            "Question: {question}\n\n"
            "{formatted_context}\n\n"
            "Remember:\n"
            "1. Only use information from the provided context\n"
            "2. Be specific about projects, technologies, and experiences mentioned\n" 
            "3. If certain details aren't in the context, be honest about not having that information\n"
            "4. Maintain a professional but conversational tone\n\n"
            "Answer:"
        )

        # Retrieve the personality system prompt from config based on current personality.
        personality_config = PERSONALITY_SETTINGS.get(self.personality, PERSONALITY_SETTINGS["base"])
        system_prompt = personality_config.get("system_prompt", "")

        # Concatenate the personality system prompt with the base context template.
        full_context_template = f"{system_prompt}\n{CONTEXT_TEMPLATE}"

        # Create the prompt templates (we use the same question template regardless of personality).
        context_formatter = ChatPromptTemplate.from_template(full_context_template)
        question_prompt = ChatPromptTemplate.from_template(QUESTION_TEMPLATE)

        # Create the chain
        self.rag_chain = (
            {
                "context": self.retriever | format_docs,
                "question": RunnablePassthrough()
            }
            | RunnableParallel(
                formatted_context=lambda x: context_formatter.format(context=x["context"]),
                question=lambda x: x["question"]
            )
            | question_prompt
            | self.llm
            | StrOutputParser()
        )

    async def query(self, question: str) -> str:
        """Process a question through the RAG pipeline."""
        try:
            logger.info(f"Processing question: {question}")
            
            # Generate response using the RAG chain
            response = await self.rag_chain.ainvoke(question)
            
            logger.info(f"Generated response for question: {question}")
            
            # Return the response
            return response
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}", exc_info=True)
            raise

    async def search_similar(
            self,
            query: str,
            top_k: int = 5
    ) -> List[Document]:
        """Search for similar documents."""
        try:
            docs = await self.retriever.get_relevant_documents(query)
            return docs[:top_k]
        except Exception as e:
            logger.error(f"Error in similarity search: {str(e)}", exc_info=True)
            raise

def format_docs(docs: List[Document]) -> str:
    """Format documents into a single string."""
    formatted_docs = []
    for doc in docs:
        # Extract section and other metadata
        section = doc.metadata.get("section", "General")
        category = doc.metadata.get("category", "Content")

        # Format the document with its metadata
        formatted_doc = f"[Section: {section} | Type: {category}]\n{doc.page_content}\n"
        formatted_docs.append(formatted_doc)

    return "\n\n".join(formatted_docs)