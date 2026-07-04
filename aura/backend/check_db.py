import asyncio
import motor.motor_asyncio
from config.settings import settings
import json

async def main():
    db = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URI).aura_db
    incs = await db.incidents.find().sort('_id', -1).limit(5).to_list(5)
    output = []
    for i in incs:
        output.append({
            'id': i.get('incident_id'),
            'path': i.get('decision_path'),
            'reason': i.get('decision_reason'),
            'action': i.get('recommended_action'),
            'conf': i.get('confidence'),
            'risk': i.get('risk_level')
        })
    print(json.dumps(output, indent=2))

if __name__ == '__main__':
    asyncio.run(main())
