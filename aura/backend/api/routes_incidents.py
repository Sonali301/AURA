"""
Incidents API Router.
This module handles endpoints that serve Incident metadata and overall system status
to the frontend dashboard.
"""

from fastapi import APIRouter
from database.mongodb import db_manager
from datetime import datetime
from recovery import canary_engine as engine_canary
from agents.recovery_agent import RecoveryAgent

router = APIRouter()
SERVER_START_TIME = datetime.utcnow()

@router.get("/api/incidents")
async def get_incidents():
    """
    Fetches all incidents for the Active Incidents Dashboard.
    It returns a mix of historical incidents and incidents created in the current session.
    """
    db = db_manager.get_db()
    if db is not None:
        session_incidents = await db.incidents.count_documents({"created_at": {"$gte": SERVER_START_TIME}})
        fetch_limit = min(100, 10 + session_incidents)
        
        cursor = db.incidents.find().sort("created_at", -1).limit(fetch_limit)
        incidents = await cursor.to_list(length=fetch_limit)
            
        for i in incidents:
            if "_id" in i:
                i["_id"] = str(i["_id"])
            for key, val in i.items():
                if isinstance(val, datetime):
                    i[key] = val.isoformat()
        return incidents
    return []

@router.get("/api/system/status")
async def get_system_status():
    """
    Calculates and fetches the holistic system health score and operational mode.
    Used to drive the header status indicators in the UI.
    """
    db = db_manager.get_db()
    if db is not None:
        active_incidents = await db.incidents.count_documents({"status": "Active"})
        active_recoveries = await db.incidents.count_documents({"status": {"$in": ["Recovering", "Validating"]}})
        
        # Calculate error rates from the Canary Engine
        stable_count = engine_canary.canary_metrics["stable_count"]
        canary_count = engine_canary.canary_metrics["canary_count"]
        stable_err = engine_canary.canary_metrics["stable_errors"]
        canary_err = engine_canary.canary_metrics["canary_errors"]
        
        stable_err_rate = (stable_err / stable_count * 100) if stable_count > 0 else 0
        canary_err_rate = (canary_err / canary_count * 100) if canary_count > 0 else 0
        
        stable_health = max(0, 100 - stable_err_rate)
        canary_health = max(0, 100 - canary_err_rate)
        
        # Determine top-level operational mode
        mode = "NORMAL"
        if active_incidents > 0:
            mode = "DEGRADED"
        if active_recoveries > 0:
            mode = "RECOVERING"
            
        return {
            "stable_health": round(stable_health, 1),
            "canary_health": round(canary_health, 1),
            "stable_error_rate": round(stable_err_rate, 1),
            "canary_error_rate": round(canary_err_rate, 1),
            "traffic_distribution": RecoveryAgent.infrastructure_state["traffic_distribution"],
            "active_incidents": active_incidents,
            "system_mode": mode
        }
    return {}
