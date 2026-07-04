import asyncio
import httpx
from motor.motor_asyncio import AsyncIOMotorClient

async def run_test():
    print("1. Triggering DB Timeout simulation...")
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post("http://localhost:8000/api/simulate/db-timeout", json={"severity": "critical", "duration": 5})
            print("Trigger response:", res.json())
        except Exception as e:
            print("Error triggering simulation:", e)
            return

    print("2. Waiting for incident aggregation to process...")
    await asyncio.sleep(10)
    
    print("3. Checking MongoDB incidents...")
    db = AsyncIOMotorClient('mongodb://localhost:27017').aura_db
    incidents = await db.incidents.find().to_list(length=10)
    print(f"Found {len(incidents)} incidents.")
    for i in incidents:
        print(f"ID: {i.get('incident_id')}")
        print(f"  Status: {i.get('status')}")
        print(f"  Action Status: {i.get('action_status')}")
        print(f"  Executed Action: {i.get('executed_action')}")
        print(f"  Timeline Events: {len(i.get('timeline_events', []))}")

asyncio.run(run_test())
