"""
Logs API Router.
This module handles all endpoints related to log ingestion and fetching.
It encapsulates the logic for raw log ingestion, immediate fast-path anomaly scoring,
and broadcasting logs to connected Socket.IO clients for real-time dashboard rendering.
"""

from fastapi import APIRouter
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
import asyncio
import random
from recovery import canary_engine as engine_canary
from database.mongodb import db_manager
from api.websocket_manager import manager

router = APIRouter()
SERVER_START_TIME = datetime.utcnow()

global_req_count = 0
global_err_count = 0

class LogEntry(BaseModel):
    """Data schema representing a single telemetry log from a microservice."""
    timestamp: str
    service: str
    environment: str
    level: str
    message: str
    trace_id: Optional[str] = None
    request_id: Optional[str] = None
    latency_ms: Optional[int] = None
    cpu_usage: Optional[int] = None
    memory_usage: Optional[int] = None

async def detect_anomaly(log: LogEntry):
    """
    Fast-path evaluation to flag obvious anomalies.
    Returns True if the log is highly suspicious or critical.
    """
    level_mapping = {"INFO": 1, "WARNING": 2, "ERROR": 3, "CRITICAL": 4}
    score = level_mapping.get(log.level, 1)
    
    if score >= 3:
        return True
    if score == 2:
        return random.random() < 0.2
    return False

@router.post("/api/logs/ingest")
async def ingest_log(log: LogEntry):
    """
    Ingests a log entry. Evaluates it, updates global metrics, 
    records it in MongoDB, and streams it to the React UI via WebSockets.
    """
    global global_req_count, global_err_count
    
    is_anomaly = await detect_anomaly(log)
    is_err = log.level in ["ERROR", "CRITICAL"] or is_anomaly
    
    global_req_count += 1
    if is_err:
        global_err_count += 1
    
    # Send metric to canary engine to calculate deployment health
    engine_canary.record_log(log.environment, is_error=is_err)
    
    log_payload = log.dict()
    log_payload["is_anomaly"] = is_anomaly
    log_payload["ingested_at"] = datetime.utcnow()
    
    db = db_manager.get_db()
    if db is not None:
        async def insert_bg(payload):
            await db.logs.insert_one(payload)
        # Background task to prevent blocking the HTTP response
        asyncio.create_task(insert_bg(log_payload.copy()))
    
    # Broadcast to connected clients for Live Log Stream
    await manager.broadcast_log(log_payload)
    return {"status": "success", "is_anomaly": is_anomaly}

@router.get("/api/logs/recent")
async def get_recent_logs():
    """
    Fetches the most recent logs from the DB. 
    Called by the React Frontend when a user refreshes the page to hydrate the Live Log view.
    """
    db = db_manager.get_db()
    if db is not None:
        session_logs = await db.logs.count_documents({"ingested_at": {"$gte": SERVER_START_TIME}})
        fetch_limit = min(100, 10 + session_logs)
        
        cursor = db.logs.find({}, {"_id": 0}).sort("ingested_at", -1).limit(fetch_limit)
        logs = await cursor.to_list(length=fetch_limit)
        # Return in ascending chronological order for frontend rendering
        return logs[::-1]
    return []

@router.get("/api/metrics/history")
async def get_metrics_history():
    """
    Fetches the rolling 60-second metrics history array.
    Used by the frontend to render the 'Global Traffic Health' line chart.
    """
    db = db_manager.get_db()
    if db is not None:
        doc = await db.system_state.find_one({"_id": "metrics_history"})
        if doc and "history" in doc:
            return doc["history"]
    return []
