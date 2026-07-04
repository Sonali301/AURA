"""
WebSocket Manager.
This module sets up the global Asyncio Socket.IO server and provides a utility 
class to standardize emitting events across the application. It guarantees consistent
date formatting and payload structure for the React UI.
"""

import socketio

# Global Socket.IO Server Instance wrapped for ASGI
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

class ConnectionManager:
    """
    Helper class that manages broadcasting logic, ensuring payloads 
    are properly sanitized before sending them over the websocket to clients.
    """
    @staticmethod
    async def broadcast_incident(incident_doc):
        """Sends a full newly-created incident document to the frontend UI."""
        # Remove mongo ObjectId if it exists before sending (non-serializable)
        if "_id" in incident_doc:
            incident_doc = incident_doc.copy()
            incident_doc.pop("_id", None)
            
        # Ensure ISO string for created_at
        if hasattr(incident_doc.get("created_at"), "isoformat"):
            incident_doc["created_at"] = incident_doc["created_at"].isoformat()
            
        await sio.emit('new_incident', incident_doc)

    @staticmethod
    async def broadcast_log(log_payload):
        """Sends a live telemetry log to the frontend Log Stream."""
        if "_id" in log_payload:
            log_payload = log_payload.copy()
            del log_payload["_id"]
            
        if hasattr(log_payload.get("ingested_at"), "isoformat"):
            log_payload["ingested_at"] = log_payload["ingested_at"].isoformat()
            
        await sio.emit('new_log', log_payload)

    @staticmethod
    async def broadcast_recovery_event(incident_id: str, event_text: str, time_str: str):
        """Sends a timeline update string during the recovery/validation loops."""
        await sio.emit("recovery_event", {"incident_id": incident_id, "event": event_text, "time": time_str})

# Singleton to be imported by routes
manager = ConnectionManager()

# --- NAMESPACE HANDLERS ---
@sio.on('connect')
async def connect(sid, environ):
    pass

@sio.on("disconnect")
async def handle_disconnect(sid):
    print(f"[WS] Client disconnected: {sid}")

# --- REPLAY NAMESPACE --- 
# Used specifically for the Replay Center to stream historical states
@sio.on("connect", namespace="/replay")
async def handle_replay_connect(sid, environ):
    print(f"[WS-REPLAY] Replay client connected: {sid}")

@sio.on("disconnect", namespace="/replay")
async def handle_replay_disconnect(sid):
    print(f"[WS-REPLAY] Replay client disconnected: {sid}")

import asyncio
from utils import replay_engine
from database.mongodb import db_manager

@sio.on("start_replay", namespace="/replay")
async def handle_start_replay(sid, data):
    incident_id = data.get("incident_id")
    speed = data.get("speed", 1.0)
    db = db_manager.get_db()
    asyncio.create_task(replay_engine.start_replay(incident_id, speed, db, sio))

@sio.on("stop_replay", namespace="/replay")
async def handle_stop_replay(sid, data):
    incident_id = data.get("incident_id")
    asyncio.create_task(replay_engine.stop_replay(incident_id))
