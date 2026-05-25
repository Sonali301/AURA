import asyncio
import datetime

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
            
        await asyncio.sleep(4) # Simulate downtime
        
        for svc in services:
            infrastructure_state["service_health"][svc] = "HEALTHY"
            
    elif action == "ROLLBACK_CANARY":
        await sio.emit("recovery_event", {"incident_id": incident_id, "event": "Rerouting 100% traffic to stable environment...", "time": datetime.datetime.now().strftime("%I:%M %p")})
        infrastructure_state["traffic_distribution"]["stable"] = 100
        infrastructure_state["traffic_distribution"]["canary"] = 0
        await asyncio.sleep(2)
        
    elif action == "REROUTE_TRAFFIC":
        await asyncio.sleep(2)
        
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
    await asyncio.sleep(15)
    
    # Check anomalies in the last 15 seconds
    time_threshold = datetime.datetime.utcnow() - datetime.timedelta(seconds=15)
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
