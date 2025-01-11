# backend/app/services/search_service.py

import logging
from openai import OpenAI
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
import numpy as np
from functools import lru_cache

from app.models.portfolio import PortfolioChunk
from app.schemas.portfolio import RelevantChunk
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class SearchService:
    def __init__(self, db: Session):
        self.db = db
        self.client = OpenAI()
        self.embedding_model = "text-embedding-3-small"
        self.vector_dim = 1536  # Dimensions for text-embedding-3-small

    async def generate_embedding(self, text: str) -> List[float]:
        """Generate normalized embedding for the search query."""
        try:
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=text
            )

            # Convert to numpy array for normalization
            embedding = np.array(response.data[0].embedding, dtype=np.float32)

            # Validate dimensions
            if len(embedding) != self.vector_dim:
                raise ValueError(f"Expected {self.vector_dim} dimensions, got {len(embedding)}")

            # Normalize the embedding
            normalized = embedding / np.linalg.norm(embedding)
            return normalized.tolist()

        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise

    @lru_cache(maxsize=1000)
    def get_cached_embedding(self, text: str) -> List[float]:
        """Cache frequently requested embeddings."""
        return self.generate_embedding(text)

    async def search_similar_chunks(
            self,
            query: str,
            limit: int = 3,
            similarity_threshold: float = 0.5,
            use_cache: bool = True
    ) -> List[RelevantChunk]:
        """
        Search for chunks similar to the query using vector similarity.
        """
        try:
            # Generate or get cached embedding for the query
            query_embedding = (
                await self.get_cached_embedding(query)
                if use_cache
                else await self.generate_embedding(query)
            )

            # Use SQLAlchemy with pgvector operations
            stmt = (
                select(
                    PortfolioChunk,
                    # Calculate cosine similarity
                    (1 - PortfolioChunk.embedding.cosine_distance(query_embedding)).label('similarity')
                )
                .order_by(PortfolioChunk.embedding.cosine_distance(query_embedding))
                .limit(limit)
            )

            # Execute the search
            results = self.db.execute(stmt).all()

            # Filter and convert to RelevantChunk objects
            relevant_chunks = []
            for row in results:
                chunk, similarity = row

                if similarity >= similarity_threshold:
                    relevant_chunks.append(
                        RelevantChunk(
                            content=chunk.content,
                            similarity=float(similarity),
                            chunk_metadata=chunk.chunk_metadata
                        )
                    )

            logger.info(
                f"Found {len(relevant_chunks)} relevant chunks above threshold {similarity_threshold}"
            )
            return relevant_chunks

        except Exception as e:
            logger.error(f"Error in similarity search: {str(e)}", exc_info=True)
            raise

    def format_context(
            self,
            chunks: List[RelevantChunk],
            max_context_length: Optional[int] = 2000
    ) -> str:
        """
        Format retrieved chunks into a context string, respecting max length.
        """
        if not chunks:
            return ""

        context_parts = []
        current_length = 0

        for chunk in chunks:
            # Add section information if available
            section = (
                chunk.chunk_metadata.get('section', 'General')
                if chunk.chunk_metadata
                else 'General'
            )

            # Format chunk with metadata
            chunk_text = f"[Section: {section} | Relevance: {chunk.similarity:.2f}]\n{chunk.content}\n"

            # Check if adding this chunk would exceed max length
            if max_context_length and (current_length + len(chunk_text)) > max_context_length:
                break

            context_parts.append(chunk_text)
            current_length += len(chunk_text)

        return "\n".join(context_parts)