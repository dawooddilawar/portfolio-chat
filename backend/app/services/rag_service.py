# backend/app/services/rag_service.py

import logging
from typing import List, Dict, Any, Tuple
from langchain_core.documents import Document
from langchain_community.vectorstores.pgvector import PGVector
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.runnables import RunnableParallel
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import DocumentCompressorPipeline
from langchain.retrievers.document_compressors import LLMChainExtractor
from app.core.config import get_settings
from app.config import CONTACT_DETAILS, PERSONALITY_SETTINGS
import json
import datetime

settings = get_settings()
logger = logging.getLogger(__name__)

class RAGService:
    def __init__(
            self,
            collection_name: str = "portfolio_chunks",
            model_name: str = "gpt-4o",
            temperature: float = 0.7,
            max_tokens: int = 1000
    ):
        self.connection_string = settings.get_database_url()
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.llm = ChatOpenAI(
            model=model_name,
            temperature=temperature,
            max_tokens=max_tokens
        )

        # Initialize vector store
        self.vector_store = PGVector(
            collection_name=collection_name,
            connection_string=self.connection_string,
            embedding_function=self.embeddings,
        )

        # Set up document compressor for better retrieval
        compressor_pipeline = DocumentCompressorPipeline(
            transformers=[
                LLMChainExtractor.from_llm(llm=self.llm)
            ]
        )

        # Set up retriever with compression
        base_retriever = self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )

        self.retriever = ContextualCompressionRetriever(
            base_compressor=compressor_pipeline,
            base_retriever=base_retriever
        )

        # Add a verification LLM (cheaper model)
        self.verification_llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.2,
            max_tokens=500
        )
        
        self.personality = self.get_current_personality()
        self._initialize_rag_chain()
        self._initialize_verification_chain()

    def get_current_personality(self) -> str:
        """Determine the current personality based on time and day."""
        now = datetime.datetime.now()
        if now.weekday() >= 5:  # Saturday and Sunday
            return "weekend"
        hour = now.hour
        if 6 <= hour < 12:
            return "morning"
        elif 22 <= hour or hour < 6:
            return "late_night"
        else:
            return "base"

    def _initialize_rag_chain(self) -> None:
        """Initialize the RAG chain with custom prompting."""
        # Move templates to separate constants or config file
        CONTEXT_TEMPLATE = (
            "Here is information about me from my resume and portfolio:\n"
            "You are acting as me, the portfolio owner. Try to keep a profesional yet casual tone, keep the response short and concise."
            "You have access to my resume and portfolio, use this information to provide a detailed and accurate response. It includes my projects, experience, and background."
            "{context}\n\n"
            "Use this information to provide a detailed and accurate response. "
            "If the information provided doesn't contain enough details to fully "
            "answer the question, acknowledge what you do know from the context "
            "and indicate what details are not available."
            "Do not end include extra information in the response, exclude things like \"If you have any more questions or need further details, feel free to ask!\" stay true to the question."
            "I have also provided my contact details below, when prompted for contact details, use these. I want to be reachable by mobile phone as well, so when prompted for phone number, use this."
            "If the contact details are links, e.g. github, twitter, resume, etc. provide the link as an <a href='link'>link</a>, with the text being the name of the link."
            f"My contact details are: Mobile Phone: {CONTACT_DETAILS['phone_number']}, "
            f"GitHub: {CONTACT_DETAILS['github']}, "
            f"Twitter: {CONTACT_DETAILS['twitter']}, "
            f"Resume: {CONTACT_DETAILS['resume']}"
        )

        QUESTION_TEMPLATE = (
            "You are acting as me, the portfolio owner. Answer the following question "
            "based on the provided context about my experience, projects, and background. "
            "Be natural and conversational while maintaining professionalism.\n\n"
            "Question: {question}\n\n"
            "{formatted_context}\n\n"
            "Remember:\n"
            "1. Only use information from the provided context\n"
            "2. Be specific about projects, technologies, and experiences mentioned\n" 
            "3. If certain details aren't in the context, be honest about not having that information\n"
            "4. Maintain a professional but conversational tone\n\n"
            "Answer:"
        )

        # Retrieve the personality system prompt from config based on current personality.
        personality_config = PERSONALITY_SETTINGS.get(self.personality, PERSONALITY_SETTINGS["base"])
        system_prompt = personality_config.get("system_prompt", "")

        # Create the prompt templates (we use the same question template regardless of personality).
        context_formatter = ChatPromptTemplate.from_template([
            ("system", system_prompt),
            ("user", CONTEXT_TEMPLATE)
        ])
        question_prompt = ChatPromptTemplate.from_template(QUESTION_TEMPLATE)

        # Create the chain
        self.rag_chain = (
            {
                "context": self.retriever | format_docs,
                "question": RunnablePassthrough()
            }
            | RunnableParallel(
                formatted_context=lambda x: context_formatter.format(context=x["context"]),
                question=lambda x: x["question"]
            )
            | question_prompt
            | self.llm
            | StrOutputParser()
        )

    def _initialize_verification_chain(self) -> None:
        """Initialize the verification chain."""
        VERIFICATION_TEMPLATE = """You are a fact-checking assistant. Your job is to verify if the given response 
        strictly adheres to the provided context and doesn't include any hallucinations or additional information.

        Question Asked: {question}

        Context: {context}
        
        Generated Response: {response}
        
        Verify the following:
        1. Does the response contain ONLY information present in the context, be very strict, vague information is not allowed?
        2. Are there any statements that go beyond the provided context?
        3. Is the response accurate according to the context?
        4. We need to be very strict, vague information is not allowed.
        5. If the response is asking about some information like "projects" or "experience", make sure to only include information from the context that is relevant to the question, and include the actual project name, etc and not vague information.

        Return a JSON-like string in the format:
        {{
            "verified": true/false,
            "issues": ["issue1", "issue2"] or [],
            "corrected_response": "corrected version" or null
        }}
        
        If the response is accurate, return verified=true and empty issues list.
        If there are issues, provide a corrected version that strictly adheres to the context.
        """

        self.verification_prompt = ChatPromptTemplate.from_template(VERIFICATION_TEMPLATE)
        
        # Create verification chain
        self.verification_chain = (
            self.verification_prompt 
            | self.verification_llm 
            | StrOutputParser()
        )

    async def verify_response(self, context: str, response: str, question: str) -> dict:
        """Verify the generated response against the context."""
        try:
            verification_result = await self.verification_chain.ainvoke({
                "context": context,
                "response": response,
                "question": question
            })
            
            
            return json.loads(verification_result)
        except Exception as e:
            logger.error(f"Error in response verification: {str(e)}", exc_info=True)
            # Return a safe default
            return {"verified": True, "issues": [], "corrected_response": None}

    async def query(self, question: str) -> str:
        """Process a question through the RAG pipeline with verification."""
        try:
            logger.info(f"Processing question: {question}")
            
            # Use invoke instead of get_relevant_documents
            context = self.retriever.invoke(question)
            formatted_context = format_docs(context)
            
            # Generate initial response
            response = await self.rag_chain.ainvoke(question)
            
            # Verify the response
            verification_result = await self.verify_response(formatted_context, response, question)
            
            # If verification failed and we have a corrected version, use that instead
            final_response = (verification_result.get("corrected_response") 
                            if not verification_result["verified"] and verification_result.get("corrected_response")
                            else response)
            
            # Log the verification result for monitoring but don't return it
            logger.info(f"Generated and verified response for question: {question}")
            logger.debug(f"Verification result: {verification_result}")
            
            # Return only the string response
            return final_response
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}", exc_info=True)
            raise

    async def search_similar(
            self,
            query: str,
            top_k: int = 5
    ) -> List[Document]:
        """Search for similar documents."""
        try:
            docs = await self.retriever.get_relevant_documents(query)
            return docs[:top_k]
        except Exception as e:
            logger.error(f"Error in similarity search: {str(e)}", exc_info=True)
            raise

def format_docs(docs: List[Document]) -> str:
    """Format documents into a single string."""
    formatted_docs = []
    for doc in docs:
        # Extract section and other metadata
        section = doc.metadata.get("section", "General")
        category = doc.metadata.get("category", "Content")

        # Format the document with its metadata
        formatted_doc = f"[Section: {section} | Type: {category}]\n{doc.page_content}\n"
        formatted_docs.append(formatted_doc)

    return "\n\n".join(formatted_docs)