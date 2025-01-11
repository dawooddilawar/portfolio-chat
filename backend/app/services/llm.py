from openai import OpenAI
from app.core.config import get_settings
from app.core.logger import setup_logger
from app.core.exceptions import LLMError
from dotenv import load_dotenv

logger = setup_logger(__name__)
settings = get_settings()
load_dotenv()

class LLMService:
    def __init__(self):
        logger.info("Initializing LLMService")
        self.client = OpenAI()
        self.model = settings.OPENAI_MODEL
        logger.info(f"LLMService initialized with model: {self.model}")

    async def generate_response(self, prompt: str) -> str:
        """Generate a response using the OpenAI API."""
        try:
            logger.info(f"Generating response with prompt length: {len(prompt)}")
            logger.info(f"Prompt preview: {prompt[:200]}...")  # Log first 200 chars

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{
                    "role": "system",
                    "content": "You are an AI assistant representing the portfolio owner. "
                               "Provide concise and relevant responses about the owner's "
                               "experience, projects, and skills."
                }, {
                    "role": "user",
                    "content": prompt
                }],
                temperature=0.7,
                max_tokens=500
            )

            result = response.choices[0].message.content
            logger.info(f"Generated response: {result}")
            return result

        except Exception as e:
            logger.error(f"Error generating LLM response: {str(e)}", exc_info=True)
            raise LLMError(f"Failed to generate response: {str(e)}")