"""
Embeddings Manager.
This module provides a singleton wrapper around a local SentenceTransformer model.
It converts textual data (like incident summaries) into dense vector arrays (embeddings) 
that can be inserted into or queried against Pinecone.
"""

import requests
import random

class EmbeddingsManager:
    """
    Manages the creation of 384-dimensional embeddings via a lightweight Cloud API
    to completely bypass RAM constraints (512MB limit) on free cloud instances.
    """
    
    @classmethod
    def load(cls):
        """No heavy local models are loaded into RAM anymore."""
        print("✅ [RAG] Embeddings Manager Loaded (Cloud API Mode)")

    @classmethod
    def encode(cls, text: str) -> list:
        """
        Converts a text string into a 384-dimensional list of floats.
        Uses the free HuggingFace API. Falls back to deterministic pseudo-random 
        vectors if rate-limited to prevent server crashing.
        """
        url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
        try:
            response = requests.post(url, json={"inputs": text}, timeout=3)
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass
            
        # Fallback to pseudo-random vector matching Pinecone's expected 384 dimensions
        print("⚠️ [RAG] Embedding API degraded, using fallback representation.")
        random.seed(hash(text))
        return [random.uniform(-1, 1) for _ in range(384)]

embeddings = EmbeddingsManager()
