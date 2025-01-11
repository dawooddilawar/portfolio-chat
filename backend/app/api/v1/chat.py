from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.schemas.chat import ChatMessage, ChatResponse
from app.services.chat import ChatService
from app.core.logger import setup_logger
from app.core.exceptions import ChatProcessingError, LLMError
from app.db.deps import get_db

router = APIRouter()
logger = setup_logger(__name__)

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(
        request: Request,
        message: ChatMessage,
        db: Session = Depends(get_db)
) -> ChatResponse:
    """
    Process a chat message and return a response.
    """
    logger.info(f"Received chat request with message: {message.message}")
    logger.info(f"Request headers: {request.headers}")

    try:
        logger.info("Initializing ChatService")
        chat_service = ChatService(db)

        logger.info("Processing message")
        response = await chat_service.process_message(message.message)

        logger.info(f"Generated response: {response}")
        return ChatResponse(response=response)

    except (ChatProcessingError, LLMError) as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        error_response = ChatResponse(
            response="I apologize, but I encountered an error processing your message. Please try again.",
            error=str(e)
        )
        logger.info(f"Sending error response: {error_response}")
        return error_response

    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {str(e)}", exc_info=True)
        error_response = ChatResponse(
            response="An unexpected error occurred. Please try again later.",
            error=str(e)
        )
        logger.info(f"Sending error response: {error_response}")
        return error_response