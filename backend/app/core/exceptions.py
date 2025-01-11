# backend/app/core/exceptions.py

from fastapi import HTTPException

class ChatProcessingError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=500, detail=detail)

class LLMError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=503, detail=detail)

class ValidationError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=422, detail=detail)