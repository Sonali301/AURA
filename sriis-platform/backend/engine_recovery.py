import asyncio
import datetime
import engine_simulator

# Simulated Global Infrastructure State
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

async def initialize_state(db):
    """Loads infrastructure state from MongoDB on startup."""
    global infrastructure_state
    state_doc = await db.system_state.find_one({"_id": "infrastructure"})
    if state_doc:
        infrastructure_state = state_doc.get("state", infrastructure_state)
    else:
        await persist_state(db)

async def persist_state(db):
    """Saves infrastructure state to MongoDB."""
    if db is not None:
        await db.system_state.update_one(
            {"_id": "infrastructure"},
            {"$set": {"state": infrastructure_state}},
            upsert=True
        )

async def execute_recovery_workflow(incident, db, sio):
    """
    Simulates the execution of an automated recovery action and then kicks off validation.
    """
    action = incident["executed_action"]
    services = incident["affected_services"]
    incident_id = incident["incident_id"]
    
    # 1. Announce execution started
    event_text = f"Execution started: {action}"
    event_time = datetime.datetime.now().strftime("%I:%M %p")
    await sio.emit("recovery_event", {
        "incident_id": incident_id,
        "event": event_text,
        "time": event_time
    })
    
    # Update status to Recovering and save timeline
    await db.incidents.update_one(
        {"incident_id": incident_id},
        {
            "$set": {"status": "Recovering", "recovery_started_at": datetime.datetime.utcnow()},
            "$push": {"timeline_events": {"time": event_time, "event": event_text}}
        }
    )
    await sio.emit("incident_status_update", {"incident_id": incident_id, "status": "Recovering"})
    
    # 2. Simulate the action
    if action == "RESTART_SERVICE":
        for svc in services:
            infrastructure_state["service_health"][svc] = "RESTARTING"
            await sio.emit("recovery_event", {"incident_id": incident_id, "event": f"Simulating restart of {svc}...", "time": datetime.datetime.now().strftime("%I:%M %p")})
            
        await persist_state(db)
        await asyncio.sleep(4) # Simulate downtime
        engine_simulator.clear_active_failure() # ACTUALLY FIX THE ERRORS
        
        for svc in services:
            infrastructure_state["service_health"][svc] = "HEALTHY"
            
        await persist_state(db)
            
    elif action == "ROLLBACK_CANARY":
        await sio.emit("recovery_event", {"incident_id": incident_id, "event": "Rerouting 100% traffic to stable environment...", "time": datetime.datetime.now().strftime("%I:%M %p")})
        infrastructure_state["traffic_distribution"]["stable"] = 100
        infrastructure_state["traffic_distribution"]["canary"] = 0
        await persist_state(db)
        await asyncio.sleep(2)
        engine_simulator.clear_active_failure() # ACTUALLY FIX THE ERRORS
        
    elif action == "REROUTE_TRAFFIC":
        await asyncio.sleep(2)
        engine_simulator.clear_active_failure() # ACTUALLY FIX THE ERRORS
        
    # 3. Transition to Validating phase
    val_event = "Action executed. Entering 15s validation phase..."
    val_time = datetime.datetime.now().strftime("%I:%M %p")
    await sio.emit("recovery_event", {"incident_id": incident_id, "event": val_event, "time": val_time})
    
    await db.incidents.update_one(
        {"incident_id": incident_id},
        {
            "$set": {"status": "Validating"},
            "$push": {"timeline_events": {"time": val_time, "event": val_event}}
        }
    )
    await sio.emit("incident_status_update", {"incident_id": incident_id, "status": "Validating"})
    
    # Run the validation task in the background
    asyncio.create_task(validate_recovery(incident_id, db, sio))


async def validate_recovery(incident_id, db, sio):
    """
    Waits 15 seconds, then checks if the error rate dropped.
    Simulates validation by simply checking recent anomalies.
    """
    # Wait 15 seconds, but only check anomalies from the LAST 10 seconds to avoid injection overlap
    await asyncio.sleep(15)
    
    # Check anomalies in the last 10 seconds (after recovery finished)
    time_threshold = datetime.datetime.utcnow() - datetime.timedelta(seconds=10)
    recent_anomalies = await db.logs.count_documents({"is_anomaly": True, "ingested_at": {"$gte": time_threshold}})
    
    if recent_anomalies < 2:
        # Success!
        final_status = "Resolved"
        final_event = "Validation successful! Anomalies ceased."
    else:
        # Failure!
        final_status = "Escalated"
        final_event = f"Validation failed! {recent_anomalies} anomalies still detecting. Escalating to human."
        
    final_time = datetime.datetime.now().strftime("%I:%M %p")
    await sio.emit("recovery_event", {"incident_id": incident_id, "event": final_event, "time": final_time})

    await db.incidents.update_one(
        {"incident_id": incident_id},
        {
            "$set": {
                "status": final_status, 
                "recovery_completed_at": datetime.datetime.utcnow(),
                "validation_results": {"post_recovery_anomalies": recent_anomalies}
            },
            "$push": {"timeline_events": {"time": final_time, "event": final_event}}
        }
    )
    await sio.emit("incident_status_update", {"incident_id": incident_id, "status": final_status})
    
    # Trigger Pinecone Memory Update (Handled back in main.py ideally, but can emit an event)
    await sio.emit("trigger_memory_update", {"incident_id": incident_id, "final_status": final_status})

async def recover_pending_validations(db, sio):
    """
    Called on FastAPI startup. Finds any incidents that were stuck in "Validating"
    because the backend restarted, and immediately finishes their validation.
    """
    cursor = db.incidents.find({"status": "Validating"})
    pending = await cursor.to_list(length=100)
    for incident in pending:
        incident_id = incident["incident_id"]
        print(f"🔄 Recovering interrupted validation task for incident: {incident_id}")
        asyncio.create_task(validate_recovery(incident_id, db, sio))
