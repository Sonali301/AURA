"""
Vector Store Connection Manager.
This module handles the connection to Pinecone, which serves as the Semantic Memory 
layer for the agentic architecture. Past incident reports and recovery actions are stored 
here so the ReasoningAgent can retrieve them (RAG) during future incidents.
"""

from pinecone import Pinecone
from config.settings import settings

class VectorStore:
    """
    Singleton wrapper around the Pinecone Index connection.
    """
    pc = None
    index = None

    @classmethod
    def connect(cls):
        """Initializes the Pinecone connection using credentials from settings."""
        if settings.PINECONE_API_KEY and settings.PINECONE_INDEX_NAME:
            try:
                cls.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
                cls.index = cls.pc.Index(settings.PINECONE_INDEX_NAME)
                
                # Fetch stats to verify we connected to the correct dimensional index
                stats = cls.index.describe_index_stats()
                print(f"[RAG] Connected to Pinecone: {settings.PINECONE_INDEX_NAME} (Dim: {stats['dimension']})")
            except Exception as e:
                print(f"[RAG] Pinecone Error: {e}")
        else:
            print("[RAG] Missing Pinecone Configuration")

    @classmethod
    def get_index(cls):
        """Returns the Pinecone index for executing similarity queries and upserts."""
        return cls.index

vector_store = VectorStore()
