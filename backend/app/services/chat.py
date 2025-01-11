from typing import Optional
import logging
from sqlalchemy.orm import Session

from app.core.logger import setup_logger
from app.services.llm import LLMService
from app.services.search_service import SearchService
from app.core.exceptions import ChatProcessingError
from app.services.rag_service import RAGService

logger = setup_logger(__name__)

class ChatService:
    def __init__(self, db: Session):
        logger.info("Initializing ChatService")
        self.db = db
        self.rag_service = RAGService()
        logger.info("ChatService initialized with RAG service")

    async def process_message(self, message: str) -> str:
        """Process a chat message and return a response."""
        logger.info(f"Processing message: {message}")
        try:
            if message.startswith('/'):
                logger.info("Processing as command")
                return await self.handle_command(message)

            # Keep await and use async query
            response = await self.rag_service.query(message)
            logger.info(f"Generated response using RAG: {response}")
            return response

        except Exception as e:
            logger.error(f"Error processing chat message: {str(e)}", exc_info=True)
            raise ChatProcessingError(str(e))

    async def generate_response(self, query: str, context: Optional[str] = None) -> str:
        """Generate a response using the LLM."""
        logger.info(f"Generating response for query with context? {bool(context)}")

        if context:
            prompt = f"""Based on the following context about me:

{context}

Please answer the following question:
{query}

If the context doesn't contain relevant information to answer the question, 
please say so instead of making assumptions."""
        else:
            prompt = f"""Please answer the following question about you:
{query}

If you don't have enough information to answer accurately, 
please let the user know that."""

        logger.info(f"Generated prompt: {prompt[:200]}...")  # Log first 200 chars
        response = await self.llm_service.generate_response(prompt)
        logger.info(f"LLM response: {response}")
        return response

    async def handle_command(self, message: str) -> str:
        """Handle special commands."""
        command = message[1:].lower().split()[0]
        logger.info(f"Handling command: {command}")

        commands = {
            'help': self._help_command,
            'about': self._about_command,
            'clear': self._clear_command,
            'projects': self._projects_command
        }

        if command in commands:
            response = await commands[command]()
            logger.info(f"Command response: {response}")
            return response

        logger.warning(f"Unknown command: {command}")
        return f"Unknown command: {command}. Type /help for available commands."

    async def _help_command(self) -> str:
        return """Available commands:
/help - Show this help message
/about - Learn about me
/projects - View my projects
/clear - Clear chat history"""

    async def _about_command(self) -> str:
        return await self.process_message("Tell me about yourself")

    async def _projects_command(self) -> str:
        return await self.process_message("What projects have you worked on?")

    async def _clear_command(self) -> str:
        return "Chat history cleared"