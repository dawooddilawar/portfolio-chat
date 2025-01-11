# backend/app/api/v1/api.py

from fastapi import APIRouter
from app.api.v1 import chat

api_router = APIRouter()
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])