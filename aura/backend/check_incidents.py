import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def check():
    uri = os.getenv("MONGO_URI")
    print(f"Connecting to: {uri}")
    client = AsyncIOMotorClient(uri)
    db = client.aura_db
    
    print("Fetching last 3 incidents...")
    cursor = db.incidents.find().sort("created_at", -1).limit(3)
    async for inc in cursor:
        print(f"ID: {inc.get('incident_id')}")
        print(f"Path: {inc.get('decision_path')}")
        print(f"Status: {inc.get('status')}")
        print(f"Reason: {inc.get('validation_reason')}")
        print(f"Confidence: {inc.get('confidence_score')}")
        print(f"Action: {inc.get('recommended_action')}")
        print(f"Services: {inc.get('affected_services')}")
        print("-" * 40)

if __name__ == "__main__":
    asyncio.run(check())
