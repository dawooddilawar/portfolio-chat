# backend/scripts/init_vectors.py

import os
import sys
from pathlib import Path
from openai import OpenAI
import logging
from sqlalchemy.orm import Session
from sqlalchemy import select
from dotenv import load_dotenv
import numpy as np
from pgvector.sqlalchemy import Vector
import asyncio
from typing import List, Tuple
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores.pgvector import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter


# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.db.session import SessionLocal
from app.services.document_processor import DocumentProcessor
from app.models.portfolio import PortfolioChunk
from app.services.rag_service import RAGService
from app.core.config import get_settings
BATCH_SIZE = 10  # Number of embeddings to generate/store at once
EMBEDDING_MODEL = "text-embedding-3-small"
VECTOR_DIMENSIONS = 1536  # Dimensions for text-embedding-3-small

# Initialize settings
settings = get_settings()

class VectorInitializer:
    def __init__(self):
        self.processor = DocumentProcessor()
        self.rag_service = RAGService()

    async def process_resume(self, pdf_path: str, db: Session):
        """Process resume and store chunks with embeddings."""
        try:
            # First process and store the documents
            await self.processor.process_documents([pdf_path], clear_existing=True)
            
            # Give the database a moment to complete the transaction
            await asyncio.sleep(1)
            
            # Now verify vector storage
            if not await self.verify_vectors(db):
                logger.error("Vector storage verification failed")
                raise Exception("Vector storage verification failed")

            logger.info("Resume processing completed successfully")

        except Exception as e:
            logger.error(f"Error processing resume: {str(e)}", exc_info=True)
            raise

    async def verify_vectors(self, db: Session):
        """Verify that vectors are properly stored and indexed."""
        try:
            # Use PGVector's methods to verify instead of direct database access
            vector_store = PGVector(
                collection_name=self.processor.collection_name,
                connection_string=self.processor.connection_string,
                embedding_function=self.processor.embeddings
            )
            
            # Try to perform a simple similarity search
            results = vector_store.similarity_search("test", k=1)
            
            if not results:
                logger.warning("No vectors found in database")
                return False

            logger.info("Vector storage verification successful")
            return True

        except Exception as e:
            logger.error(f"Vector verification failed: {str(e)}", exc_info=True)
            return False

async def main():
    logger.info("Starting initialization script")

    if len(sys.argv) != 2:
        logger.error("No PDF path provided")
        print("Usage: python init_vectors.py <path_to_resume.pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        logger.error(f"File not found: {pdf_path}")
        sys.exit(1)

    initializer = VectorInitializer()
    db = SessionLocal()

    try:
        await initializer.process_resume(pdf_path, db)
    finally:
        db.close()
        logger.info("Database session closed")

if __name__ == "__main__":
    asyncio.run(main())