from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel

class PortfolioChunkBase(BaseModel):
    content: str
    chunk_metadata: Optional[Dict[str, Any]] = None

class PortfolioChunkCreate(PortfolioChunkBase):
    embedding: List[float]

class PortfolioChunkInDB(PortfolioChunkBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class RelevantChunk(BaseModel):
    content: str
    similarity: float
    chunk_metadata: Optional[Dict[str, Any]] = None