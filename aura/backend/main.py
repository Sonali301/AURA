"""
Main Application Entrypoint (FastAPI).
This module wires all the disparate architectural components together:
- Initializes Databases and Observability
- Mounts REST API Routers
- Starts the background Incident Aggregation Loop
- Acts as the ASGI server target (main:socket_app)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import datetime
import uuid
import socketio

# Import Core Services
from database.mongodb import db_manager
from database.pinecone import vector_store
from rag.embeddings import embeddings
from observability.langsmith_monitoring import init_tracing

# Import Routers
from api.routes_logs import router as logs_router
from api.routes_incidents import router as incidents_router
from api.routes_recovery import router as recovery_router
from api.websocket_manager import sio, manager

# Import LangGraph Orchestrator
from graph.workflow_graph import app_graph

# Import Legacy/Execution Engines (to be refactored into pure agents later)
from recovery import canary_engine as engine_canary
import engine_simulator
from utils import replay_engine as engine_replay
from agents.recovery_agent import RecoveryAgent

# 1. Initialize Observability (LangSmith)
init_tracing()

# 2. Initialize FastAPI
app = FastAPI(title="Aura Agentic Core", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount REST Routers
app.include_router(logs_router)
app.include_router(incidents_router)
app.include_router(recovery_router)

# 4. Wrap FastAPI with Socket.IO ASGI App
# Uvicorn MUST run `uvicorn main:socket_app` to enable websockets
socket_app = socketio.ASGIApp(sio, app)

async def trigger_agentic_workflow(logs):
    """
    Entrypoint for the LangGraph Agent pipeline.
    This is called by the aggregation loop when enough anomalous logs are collected.
    """
    print(f"🚀 [ORCHESTRATOR] Triggering LangGraph Pipeline for {len(logs)} logs.")
    
    # Run the graph (Correlation -> Memory -> Reasoning -> Safety)
    final_state = await app_graph.ainvoke({"raw_logs": logs})
    
    # Extract results from the graph's final state
    services = final_state.get("affected_services", [])
    action = final_state.get("recommended_action", "MONITOR_ONLY")
    reason = final_state.get("action_reason", "No reason provided")
    rca = final_state.get("root_cause", "Unknown Root Cause")
    
    # Ensure ID formatting
    incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
    created_at_time = datetime.datetime.utcnow()
    created_at_str = created_at_time.isoformat()
    
    # Determine the execution status based on the SafetyAgent's decision
    decision_path = final_state.get("decision_path", "AUTO_ESCALATED")
    requires_human_approval = final_state.get("requires_human_approval", False)
    block_reason = final_state.get("block_reason", "No reason provided")
    
    if decision_path == "AUTO_HEAL":
        action_status = "Approved (Auto)"
        status = "Active" # Will instantly transition to "Recovering" in RecoveryAgent
    elif decision_path == "HUMAN_APPROVAL":
        action_status = f"Requires Approval ({block_reason})"
        status = "Active" # Waiting for manual human approval in UI
    else: # AUTO_ESCALATED
        action_status = f"Escalated ({block_reason})"
        status = "Escalated"
        
    incident_doc = {
        "incident_id": incident_id,
        "created_at": created_at_time,
        "status": status,
        "severity": final_state.get("severity", "high"),
        "affected_services": services,
        "anomaly_summary": final_state.get("initial_hypothesis"),
        "root_cause": rca,
        "recommended_action": action,
        "action_reason": reason,
        "action_status": action_status,
        "confidence_score": final_state.get("confidence", 0.5),
        "requires_human_approval": requires_human_approval,
        "decision_path": decision_path,
        "decision_reason": final_state.get("decision_reason", block_reason),
        "risk_level": final_state.get("risk_level", "UNKNOWN"),
        "validation_reason": block_reason,
        "timeline_events": [
            {"time": datetime.datetime.now().strftime("%I:%M %p"), "event": f"Incident generated: {rca}"}
        ]
    }
    
    # Create the incident in MongoDB
    db = db_manager.get_db()
    if db is not None:
        await db.incidents.insert_one(incident_doc.copy())
        
    # Broadcast to frontend UI
    await manager.broadcast_incident(incident_doc)
    
    # Trigger autonomous recovery if SafetyAgent approved it
    if decision_path == "AUTO_HEAL" and db is not None:
        from agents.safety_agent import SafetyAgent
        SafetyAgent.log_execution(services, action)
        
        # We explicitly store the intended action under 'executed_action'
        incident_doc["executed_action"] = action 
        asyncio.create_task(RecoveryAgent.execute_recovery_workflow(incident_doc, db))

async def incident_aggregation_loop():
    """
    Runs continuously in the background. Grouping anomalies over a 3-second window
    and dispatching them to the LangGraph Orchestrator.
    """
    while True:
        await asyncio.sleep(3)
        db = db_manager.get_db()
        if db is not None:
            # Look for recent anomalies that haven't been grouped into an incident yet
            time_threshold = datetime.datetime.utcnow() - datetime.timedelta(seconds=5)
            cursor = db.logs.find({
                "is_anomaly": True, 
                "ingested_at": {"$gte": time_threshold},
                "incident_id": {"$exists": False}
            })
            recent_anomalies = await cursor.to_list(length=100)
            
            if len(recent_anomalies) >= 3: # Threshold: 3 anomalies triggers a new incident
                anomaly_ids = [doc["_id"] for doc in recent_anomalies]
                # Mark as processed so we don't trigger again
                await db.logs.update_many({"_id": {"$in": anomaly_ids}}, {"$set": {"incident_id": "processing"}})
                
                # Kick off LangGraph Agent Pipeline
                asyncio.create_task(trigger_agentic_workflow(recent_anomalies))



@app.on_event("startup")
async def startup_event():
    """
    Lifecycle hook executed before the HTTP server starts accepting traffic.
    """
    print("🚀 [SYSTEM] Booting Aura Agentic Platform...")
    
    # Initialize Core Services (DB, Pinecone, ML Models)
    await db_manager.connect()
    vector_store.connect()
    embeddings.load()
    
    # Initialize persistent legacy operational state
    db = db_manager.get_db()
    if db is not None:
        await RecoveryAgent.initialize_state(db)
        await RecoveryAgent.recover_pending_validations(db)
    
    # Start background aggregation task and telemetry simulator
    asyncio.create_task(incident_aggregation_loop())
    # asyncio.create_task(human_approval_timeout_loop()) # Disabled per user request
    asyncio.create_task(engine_simulator.simulator_loop())
    print("✅ [SYSTEM] Boot Complete. Aggregation Loop & Telemetry Simulator Started.")

@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 [SYSTEM] Shutting down...")
