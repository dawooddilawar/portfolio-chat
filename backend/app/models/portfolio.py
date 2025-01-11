# backend/app/models/portfolio.py

from uuid import uuid4
from sqlalchemy import Column, Text, TIMESTAMP, text, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector

from app.db.base import Base

class PortfolioChunk(Base):
    __tablename__ = 'portfolio_chunks'

    id = Column(UUID, primary_key=True, default=uuid4)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536))  # Ada embeddings are 1536 dimensions
    chunk_metadata = Column(JSONB)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('now()'))

    # Add the vector similarity index
    __table_args__ = (
        Index(
            'portfolio_chunks_embedding_idx',
            embedding,
            postgresql_using='ivfflat',
            postgresql_with={'lists': 100},  # This parameter can be tuned based on your data size
            postgresql_ops={'embedding': 'vector_cosine_ops'}
        ),
    )

    def __repr__(self):
        return f"<PortfolioChunk(id={self.id}, content_preview={self.content[:50]}...)>"