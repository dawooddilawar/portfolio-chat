# backend/app/api/v1/api.py

from fastapi import APIRouter
from app.api.v1 import chat, knowledge

api_router = APIRouter()
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])