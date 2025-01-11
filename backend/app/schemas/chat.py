# backend/app/schemas/chat.py

from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    """Schema for chat message request"""
    message: str = Field(..., min_length=1, max_length=500)

class ChatResponse(BaseModel):
    """Schema for chat response"""
    response: str
    error: str | None = None