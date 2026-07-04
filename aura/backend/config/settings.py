"""
Configuration Module for Aura (Autonomous Incident Intelligence System).
This module centrally manages all environment variables, preventing the need
to call os.getenv() repeatedly across the application.
It uses python-dotenv to load variables from the local .env file.
"""

import os
from dotenv import load_dotenv

# Load environment variables once at startup
load_dotenv()

class Settings:
    """
    Centralized settings class mapping environment variables to application properties.
    """
    # MongoDB Persistence Connection
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    
    # Pinecone Vector Database Config (for RAG / Semantic Memory)
    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
    PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
    
    # Groq LLM Inference API Key (Llama-3 model)
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    
    # LangSmith Tracing Configuration for deep AI observability
    # This enables tracing execution graphs in the cloud
    LANGCHAIN_TRACING_V2 = os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true"
    LANGCHAIN_ENDPOINT = os.getenv("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com")
    LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY")
    LANGCHAIN_PROJECT = os.getenv("LANGCHAIN_PROJECT", "aura-agentic-platform")

# Instantiate the settings globally to be imported by other modules
settings = Settings()
