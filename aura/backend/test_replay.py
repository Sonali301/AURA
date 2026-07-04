import asyncio
from database.mongodb import db_manager
from utils import replay_engine
import socketio

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

async def main():
    await db_manager.connect_to_mongo()
    db = db_manager.get_db()
    
    # We mock sio.emit
    async def mock_emit(event, data, namespace=None):
        print(f"EMIT {event}: {data}")
    sio.emit = mock_emit
    
    # Get a real incident ID
    incidents = await db.incidents.find().to_list(length=1)
    if not incidents:
        print("No incidents found!")
        return
        
    incident_id = incidents[0]["incident_id"]
    print(f"Testing replay for {incident_id}")
    
    await replay_engine.start_replay(incident_id, 1.0, db, sio)
    
asyncio.run(main())
