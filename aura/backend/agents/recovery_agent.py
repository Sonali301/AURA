"""
Recovery Execution Agent.
This module is responsible for carrying out the physical recovery actions 
decided by the AI (or manually approved by the human).
It executes the workflows (like RESTART_SERVICE or ROLLBACK_CANARY),
manages the "Recovering" and "Validating" incident states, and ultimately
evaluates if the recovery succeeded or failed.
"""

import asyncio
import datetime
import random
import engine_simulator
from api.websocket_manager import manager, sio

class RecoveryAgent:
    """
    Stateful execution engine for resolving incidents.
    """
    # Simulated Global Infrastructure State tracking what is currently running
    infrastructure_state = {
        "traffic_distribution": {
            "stable": 80,
            "canary": 20
        },
        "service_health": {
            "api-gateway": "HEALTHY",
            "auth-service": "HEALTHY",
            "db-service": "HEALTHY",
            "frontend": "HEALTHY"
        }
    }

    @classmethod
    async def initialize_state(cls, db):
        """Loads persistent infrastructure state from MongoDB on startup."""
        state_doc = await db.system_state.find_one({"_id": "infrastructure"})
        if state_doc:
            cls.infrastructure_state = state_doc.get("state", cls.infrastructure_state)
        else:
            await cls.persist_state(db)

    @classmethod
    async def persist_state(cls, db):
        """Saves current infrastructure state to MongoDB."""
        if db is not None:
            await db.system_state.update_one(
                {"_id": "infrastructure"},
                {"$set": {"state": cls.infrastructure_state}},
                upsert=True
            )

    @classmethod
    async def execute_recovery_workflow(cls, incident, db):
        """
        Simulates the execution of an automated recovery action.
        Then kicks off validation loop asynchronously.
        """
        action = incident["executed_action"]
        services = incident["affected_services"]
        incident_id = incident["incident_id"]
        
        # 1. Announce execution started to Dashboard
        event_text = f"Execution started: {action}"
        event_time = datetime.datetime.now().strftime("%I:%M %p")
        await manager.broadcast_recovery_event(incident_id, event_text, event_time)
        
        # Update Database status to Recovering
        await db.incidents.update_one(
            {"incident_id": incident_id},
            {
                "$set": {"status": "Recovering", "recovery_started_at": datetime.datetime.utcnow()},
                "$push": {"timeline_events": {"time": event_time, "event": event_text}}
            }
        )
        await sio.emit("incident_status_update", {"incident_id": incident_id, "status": "Recovering"})
        
        # 2. Simulate the action's effect on infrastructure
        if action == "RESTART_SERVICE":
            for svc in services:
                cls.infrastructure_state["service_health"][svc] = "RESTARTING"
                await manager.broadcast_recovery_event(incident_id, f"Simulating restart of {svc}...", datetime.datetime.now().strftime("%I:%M %p"))
                
            await cls.persist_state(db)
            await asyncio.sleep(4) # Simulate time taken for downtime/reboot
            engine_simulator.clear_active_failure() # Actually clear the errors in simulation
            
            for svc in services:
                cls.infrastructure_state["service_health"][svc] = "HEALTHY"
                
            await cls.persist_state(db)
                
        elif action == "ROLLBACK_CANARY":
            await manager.broadcast_recovery_event(incident_id, "Rerouting 100% traffic to stable environment...", datetime.datetime.now().strftime("%I:%M %p"))
            # Shift traffic off the broken canary
            cls.infrastructure_state["traffic_distribution"]["stable"] = 100
            cls.infrastructure_state["traffic_distribution"]["canary"] = 0
            await cls.persist_state(db)
            await asyncio.sleep(2)
            engine_simulator.clear_active_failure()
            
        elif action == "REROUTE_TRAFFIC":
            await asyncio.sleep(2)
            engine_simulator.clear_active_failure()
            
        # 3. Transition to Validating phase
        val_event = "Action executed. Entering 15s validation phase..."
        val_time = datetime.datetime.now().strftime("%I:%M %p")
        await manager.broadcast_recovery_event(incident_id, val_event, val_time)
        
        await db.incidents.update_one(
            {"incident_id": incident_id},
            {
                "$set": {"status": "Validating", "validation_started_at": datetime.datetime.utcnow().isoformat()},
                "$push": {"timeline_events": {"time": val_time, "event": val_event}}
            }
        )
        await sio.emit("incident_status_update", {"incident_id": incident_id, "status": "Validating"})
        
        # Run the validation task in the background (fire and forget)
        asyncio.create_task(cls.validate_recovery(incident_id, db))

    @classmethod
    async def validate_recovery(cls, incident_id, db):
        """
        Waits 15 seconds, then checks if the anomaly rate has dropped in MongoDB.
        If it has, the incident is RESOLVED. If anomalies persist, it ESCALATES.
        """
        await asyncio.sleep(15)
        
        # Check logs strictly ingested in the last 10 seconds
        time_threshold = datetime.datetime.utcnow() - datetime.timedelta(seconds=10)
        recent_anomalies = await db.logs.count_documents({"is_anomaly": True, "ingested_at": {"$gte": time_threshold}})
        
        # Decide resolution state
        validation_reason = ""
        if recent_anomalies < 2:
            final_status = "Resolved"
            validation_reason = "Error rate has returned to normal levels."
            final_event = f"Validation successful! {validation_reason}"
        else:
            final_status = "Escalated"
            validation_reason = "Error rate still elevated after recovery action."
            final_event = f"Validation failed! {validation_reason} {recent_anomalies} anomalies still detecting."
            
        final_time = datetime.datetime.now().strftime("%I:%M %p")
        await manager.broadcast_recovery_event(incident_id, final_event, final_time)

        # Finalize incident DB record
        update_doc = {
            "status": final_status, 
            "recovery_completed_at": datetime.datetime.utcnow().isoformat(),
            "validation_results": {"post_recovery_anomalies": recent_anomalies},
            "validation_reason": validation_reason
        }
        if final_status == "Resolved":
            update_doc["resolved_at"] = datetime.datetime.utcnow().isoformat()
            
        await db.incidents.update_one(
            {"incident_id": incident_id},
            {
                "$set": update_doc,
                "$push": {"timeline_events": {"time": final_time, "event": final_event}}
            }
        )
        await sio.emit("incident_status_update", {"incident_id": incident_id, "status": final_status})
        
        # Tell the orchestrator in main.py to save this incident to semantic memory
        await sio.emit("trigger_memory_update", {"incident_id": incident_id, "final_status": final_status})

    @classmethod
    async def recover_pending_validations(cls, db):
        """
        Resilience feature. Called on FastAPI startup. 
        Finds any incidents that were stuck in "Validating" if the server crashed,
        and finishes their validation.
        """
        cursor = db.incidents.find({"status": "Validating"})
        pending = await cursor.to_list(length=100)
        for incident in pending:
            incident_id = incident["incident_id"]
            print(f"🔄 Recovering interrupted validation task for incident: {incident_id}")
            asyncio.create_task(cls.validate_recovery(incident_id, db))
