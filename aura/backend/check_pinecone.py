from config.settings import settings
from pinecone import Pinecone
import json

def check_pinecone():
    print("Connecting to Pinecone...")
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    index = pc.Index(settings.PINECONE_INDEX_NAME)
    
    stats = index.describe_index_stats()
    print("\n--- Index Statistics ---")
    print(f"Total Vectors: {stats.total_vector_count}")
    print(f"Dimension: {stats.dimension}")
    print(f"Namespaces: {stats.namespaces}")
    
    print("\n--- Fetching Sample Historical Incidents ---")
    # We query with a zero-vector just to fetch the nearest neighbors and see what's in there
    res = index.query(vector=[0.0]*stats.dimension, top_k=5, include_metadata=True)
    
    for i, match in enumerate(res.matches):
        print(f"\n--- Incident {i+1} [ID: {match.id}] ---")
        print(json.dumps(match.metadata, indent=2))

if __name__ == "__main__":
    check_pinecone()
