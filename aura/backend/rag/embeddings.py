"""
Embeddings Manager.
This module provides a singleton wrapper around a local SentenceTransformer model.
It converts textual data (like incident summaries) into dense vector arrays (embeddings) 
that can be inserted into or queried against Pinecone.
"""

from sentence_transformers import SentenceTransformer

class EmbeddingsManager:
    """
    Manages the lifecycle and execution of the SentenceTransformer model.
    Loads locally to avoid external API latency for simple embeddings.
    """
    embedder = None

    @classmethod
    def load(cls):
        """Loads the compact 'all-MiniLM-L6-v2' transformer model into memory."""
        print("⏳ [RAG] Loading Sentence-Transformers model...")
        # A lightweight model providing 384-dimensional embeddings
        cls.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ [RAG] Embedder Loaded")

    @classmethod
    def encode(cls, text: str) -> list:
        """
        Converts a text string into a list of floats (a vector).
        Used by the MemoryAgent (for querying) and the Orchestrator (for storing).
        """
        if not cls.embedder:
            raise Exception("Embedder not loaded")
        # Returns a standard python list suitable for Pinecone API
        return cls.embedder.encode(text).tolist()

embeddings = EmbeddingsManager()
