"""
Recovery & Simulation API Router.
This module handles endpoints related to injecting chaos (Simulation) and 
overriding the AI's autonomous decisions (Manual Healing).
"""

from fastapi import APIRouter
import asyncio
from datetime import datetime
from database.mongodb import db_manager
from api.websocket_manager import manager
import engine_simulator
from agents.recovery_agent import RecoveryAgent

router = APIRouter()

@router.post("/api/simulate/{scenario}")
async def trigger_simulation(scenario: str, payload: dict = None):
    """
    Triggers a deterministic infrastructure failure scenario.
    This injects chaotic telemetry that will be picked up by the aggregation engine,
    effectively starting an Incident lifecycle.
    """
    severity = payload.get("severity", "critical") if payload else "critical"
    duration = payload.get("duration", 20) if payload else 20
    
    valid_scenarios = ["db-timeout", "api-crash", "canary-failure", "latency-spike", "auth-failure", "traffic-surge"]
    if scenario not in valid_scenarios:
        return {"error": "Invalid simulation scenario", "valid_options": valid_scenarios}
        
    result = await engine_simulator.trigger_failure(scenario, severity, duration)
    return result

@router.post("/api/incidents/{incident_id}/heal")
async def manual_heal_incident(incident_id: str, payload: dict = None):
    """
    Fallback endpoint. If an AI action requires Human Approval (e.g. it was blocked 
    by the SafetyAgent), the user can click "Approve" in the UI, which hits this route.
    It overrides the safety check and dispatches the RecoveryAgent.
    """
    db = db_manager.get_db()
    if db is None:
        return {"error": "DB not connected"}
        
    incident = await db.incidents.find_one({"incident_id": incident_id})
    if not incident:
        return {"error": "Incident not found"}
        
    approval_user = payload.get("approval_user", "Admin") if payload else "Admin"
    event_time = datetime.now().strftime("%I:%M %p")
    event_text = f"Manual Execution Approved by {approval_user}"
    
    # Log manual intervention
    await db.incidents.update_one(
        {"incident_id": incident_id},
        {
            "$set": {
                "action_status": "Approved (Manual)", 
                "executed_action": incident.get("recommended_action", "RESTART_SERVICE"),
                "approval_user": approval_user,
                "approval_timestamp": datetime.utcnow().isoformat()
            },
            "$push": {"timeline_events": {"time": event_time, "event": event_text}}
        }
    )
    incident["executed_action"] = incident.get("recommended_action", "RESTART_SERVICE")
    
    # Broadcast to UI
    await manager.broadcast_recovery_event(incident_id, event_text, event_time)
    
    # Execute workflow in background by handing off to the RecoveryAgent
    asyncio.create_task(RecoveryAgent.execute_recovery_workflow(incident, db))
    return {"status": "success", "message": "Recovery workflow initiated"}
