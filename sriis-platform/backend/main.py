import os
import asyncio
import uuid
import uvicorn
from datetime import datetime, timedelta
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import socketio
from dotenv import load_dotenv
from pinecone import Pinecone
from motor.motor_asyncio import AsyncIOMotorClient
import pandas as pd
from sklearn.ensemble import IsolationForest
import numpy as np
from collections import deque
from sentence_transformers import SentenceTransformer
from groq import AsyncGroq

# Import Phase 5 Autonomous Engines
import engine_decision
import engine_recovery
import engine_canary
import engine_simulator
import engine_correlation
import engine_replay

# Load environment variables
load_dotenv()

# Global Boot Time to track session length for smart frontend hydration
SERVER_START_TIME = datetime.utcnow()

# Initialize FastAPI
app = FastAPI(title="SRIIS Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

# Global clients
pc = None
index = None
db = None
client = None
embedder = None
groq_client = None

log_window = deque(maxlen=200) 

global_req_count = 0
global_err_count = 0

async def metrics_tracking_loop():
    global global_req_count, global_err_count
    print("🔄 Starting Background Metrics Tracking Loop...")
    while True:
        await asyncio.sleep(1)
        if db is not None:
            req_per_sec = global_req_count
            err_rate = (global_err_count / req_per_sec * 100) if req_per_sec > 0 else 0
            
            time_str = datetime.now().strftime("%H:%M:%S")
            point = {"time": time_str, "value": req_per_sec, "error_rate": round(err_rate, 1)}
            
            # Atomic update to keep exactly 60 items without slow count/delete queries
            await db.system_state.update_one(
                {"_id": "metrics_history"},
                {"$push": {
                    "history": {
                        "$each": [point],
                        "$slice": -60
                    }
                }},
                upsert=True
            )
            
            global_req_count = 0
            global_err_count = 0

@app.on_event("startup")
async def startup_event():
    global pc, index, db, client, embedder, groq_client
    
    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
    PINECONE_INDEX = os.getenv("PINECONE_INDEX_NAME")
    if PINECONE_API_KEY and PINECONE_INDEX:
        try:
            pc = Pinecone(api_key=PINECONE_API_KEY)
            index = pc.Index(PINECONE_INDEX)
            print(f"✅ Connected to Pinecone: {PINECONE_INDEX} (Dimension: {index.describe_index_stats()['dimension']})")
        except Exception as e:
            print(f"❌ Pinecone Error: {e}")
            
    MONGO_URI = os.getenv("MONGO_URI")
    if MONGO_URI:
        try:
            client = AsyncIOMotorClient(MONGO_URI)
            db = client.get_database("sriis_db")
            print("✅ Connected to MongoDB")
            
            # Initialize persistent operational state & recovery jobs
            await engine_recovery.initialize_state(db)
            await engine_recovery.recover_pending_validations(db, sio)
            
        except Exception as e:
            print(f"❌ MongoDB Error: {e}")
            
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if GROQ_API_KEY:
        groq_client = AsyncGroq(api_key=GROQ_API_KEY)
        print("✅ Connected to Groq")
        
    print("⏳ Loading Sentence-Transformers model (this takes a few seconds)...")
    embedder = SentenceTransformer('all-MiniLM-L6-v2')
    print("✅ Embedder Loaded")
    
    # Start background aggregation tasks
    asyncio.create_task(incident_aggregation_loop())
    asyncio.create_task(engine_canary.canary_monitoring_loop(sio))
    asyncio.create_task(engine_simulator.simulator_loop())
    asyncio.create_task(metrics_tracking_loop())


class LogEntry(BaseModel):
    timestamp: str
    service: str
    environment: str
    level: str
    message: str

async def detect_anomaly(log: LogEntry):
    level_mapping = {"INFO": 1, "WARNING": 2, "ERROR": 3, "CRITICAL": 4}
    log_window.append({
        "level_score": level_mapping.get(log.level, 1),
        "message_length": len(log.message)
    })
    
    if len(log_window) < 10:
        return False
        
    df = pd.DataFrame(list(log_window))
    loop = asyncio.get_event_loop()
    
    def run_isolation_forest():
        model = IsolationForest(contamination=0.1, random_state=42)
        return model.fit_predict(df[["level_score", "message_length"]])

    predictions = await loop.run_in_executor(None, run_isolation_forest)
    return bool(predictions[-1] == -1)

@app.post("/api/logs/ingest")
async def ingest_log(log: LogEntry):
    global global_req_count, global_err_count
    
    is_anomaly = await detect_anomaly(log)
    is_err = log.level in ["ERROR", "CRITICAL"] or is_anomaly
    
    global_req_count += 1
    if is_err:
        global_err_count += 1
    
    # Record for Canary/Stable tracking
    engine_canary.record_log(log.environment, is_error=is_err)
    
    log_payload = log.dict()
    log_payload["is_anomaly"] = is_anomaly
    log_payload["ingested_at"] = datetime.utcnow()
    
    if db is not None:
        async def insert_bg(payload):
            await db.logs.insert_one(payload)
        asyncio.create_task(insert_bg(log_payload.copy()))
    
    if "_id" in log_payload:
        del log_payload["_id"]
    log_payload["ingested_at"] = log_payload["ingested_at"].isoformat()
    
    await sio.emit('new_log', log_payload)
    return {"status": "success", "is_anomaly": is_anomaly}

# ----------------- PHASE 3: AI INCIDENT RAG ENGINE -----------------

async def process_new_incident(anomalies):
    """Generates an RCA via Groq RAG and upserts memory to Pinecone"""
    incident_id = str(uuid.uuid4())
    services = list(set([a["service"] for a in anomalies]))
    
    # Analyze severity based on log levels
    has_critical = any(a["level"] == "CRITICAL" for a in anomalies)
    severity = "Critical" if has_critical else "Major"
    
    # Form incident summary
    anomaly_msgs = " | ".join([a["message"] for a in anomalies[:5]])
    current_summary = f"{len(anomalies)} anomalies detected across {services}. Samples: {anomaly_msgs}"
    
    print(f"🚨 [INCIDENT ENGINE] Formed Incident {incident_id}. Querying Pinecone...")
    
    # 1. Embed current context to search Pinecone
    query_vector = embedder.encode(current_summary).tolist()
    
    historical_context = ""
    try:
        results = index.query(vector=query_vector, top_k=3, include_metadata=True)
        if results.matches:
            for match in results.matches:
                historical_context += f"- Past Incident ({match.score:.2f} match): {match.metadata.get('action', 'No action recorded')}\n"
    except Exception as e:
        print(f"Pinecone query error: {e}")

    # 2. Ask Groq for Root Cause Analysis
    prompt = f"""
    You are an AI DevOps Engineer. A new incident has occurred:
    Severity: {severity}
    Affected Services: {services}
    Summary: {current_summary}
    
    Here is how we solved similar incidents in the past:
    {historical_context if historical_context else "No historical context available."}
    
    Provide a Root Cause Analysis (max 2 sentences) and a specific Recovery Action.
    The action MUST be exactly one of these strings: ["ROLLBACK_CANARY", "RESTART_SERVICE", "REROUTE_TRAFFIC", "MONITOR_ONLY"].
    You must also provide a confidence score between 0.0 and 1.0.
    
    Respond STRICTLY in the following JSON format:
    {{
        "root_cause": "your analysis here",
        "recommended_action": "RESTART_SERVICE",
        "confidence": 0.95
    }}
    """
    
    rca = "Unknown"
    action = "MONITOR_ONLY"
    confidence = 0.0
    if groq_client:
        try:
            completion = await groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "system", "content": prompt}],
                response_format={"type": "json_object"}
            )
            import json
            response_json = json.loads(completion.choices[0].message.content)
            rca = response_json.get("root_cause", "Unknown")
            action = response_json.get("recommended_action", "MONITOR_ONLY")
            llm_json = response_json
            confidence = llm_json.get("confidence", 0.0)
        except Exception as e:
            print(f"Groq API Error: {e}")
            
    # 3. Decision Engine Validation
    is_approved, reason = engine_decision.validate_decision(severity, action, confidence, list(services))
    
    # Run distributed correlation analysis
    correlation_data = await engine_correlation.infer_cascading_failures(anomalies)

    incident_doc = {
        "incident_id": incident_id,
        "created_at": datetime.utcnow(),
        "severity": severity,
        "affected_services": list(services),
        "root_cause": rca,
        "recommended_action": action,
        "executed_action": action if is_approved else None,
        "confidence_score": confidence,
        "status": "Active",
        "action_status": "Approved (Automated)" if is_approved else "Rejected by Safety Engine",
        "validation_reason": reason,
        "root_dependency": correlation_data.get("root_dependency", "unknown"),
        "cascading_chain": correlation_data.get("cascading_chain", []),
        "correlation_confidence": correlation_data.get("correlation_confidence", 0.0),
        "trigger_logs": [str(a["_id"]) for a in anomalies],
        "timeline_events": [
            {"time": datetime.now().strftime("%I:%M %p"), "event": f"Critical incident created"}
        ]
    }
    if is_approved:
        incident_doc["timeline_events"].append({"time": datetime.now().strftime("%I:%M %p"), "event": f"Decision Engine Approved: {action}"})
    else:
        incident_doc["timeline_events"].append({"time": datetime.now().strftime("%I:%M %p"), "event": f"Decision Engine Rejected: {reason}"})
        
    await db.incidents.insert_one(incident_doc.copy())
    
    # 4. Upsert to Pinecone for future memory
    combined_text = f"{severity} incident: {current_summary} Affected services: {', '.join(services)}. Recovery action: {action}"
    upsert_vector = embedder.encode(combined_text).tolist()
    
    metadata = {
        "severity": severity,
        "services": services,
        "action": action
    }
    
    try:
        index.upsert(vectors=[(incident_id, upsert_vector, metadata)])
        print(f"🧠 [MEMORY] Upserted Incident {incident_id} to Pinecone with metadata!")
    except Exception as e:
        print(f"Pinecone upsert error: {e}")

    # 5. Alert UI
    incident_doc.pop("_id", None)
    incident_doc["created_at"] = incident_doc["created_at"].isoformat()
    await sio.emit('new_incident', incident_doc)
    
    # 6. Execute Recovery if Approved (Autonomous Execution!)
    if is_approved:
        engine_decision.log_recovery_execution(services)
        asyncio.create_task(engine_recovery.execute_recovery_workflow(incident_doc, db, sio))

async def incident_aggregation_loop():
    """Runs continuously in the background to group recent anomalies."""
    print("🔄 Starting Background Incident Aggregation Loop...")
    while True:
        await asyncio.sleep(15) # Check every 15 seconds
        if db is not None:
            time_threshold = datetime.utcnow() - timedelta(seconds=15)
            # Find all anomalies in the last 15 seconds
            cursor = db.logs.find({"is_anomaly": True, "ingested_at": {"$gte": time_threshold}})
            recent_anomalies = await cursor.to_list(length=100)
            
            # If we see 3 or more anomalies clustered together, it's a confirmed incident!
            if len(recent_anomalies) >= 3:
                await process_new_incident(recent_anomalies)


@app.get("/api/incidents")
async def get_incidents():
    """Fetch incidents for the dashboard: 10 historical + all session incidents"""
    if db is not None:
        # 1. Count how many incidents were created during this session
        session_incidents = await db.incidents.count_documents({"created_at": {"$gte": SERVER_START_TIME}})
        
        # 2. Limit is the 10 historical ones + all the new ones (capped at 100)
        fetch_limit = min(100, 10 + session_incidents)
        
        cursor = db.incidents.find().sort("created_at", -1).limit(fetch_limit)
        incidents = await cursor.to_list(length=fetch_limit)
            
        for i in incidents:
            if "_id" in i:
                i["_id"] = str(i["_id"])
            if isinstance(i.get("created_at"), datetime):
                i["created_at"] = i["created_at"].isoformat()
        return incidents
    return []
        
@app.get("/api/logs/recent")
async def get_recent_logs():
    """Fetch logs for UI hydration: 10 historical + all session logs"""
    if db is not None:
        # 1. Count how many logs were created during this session
        session_logs = await db.logs.count_documents({"ingested_at": {"$gte": SERVER_START_TIME}})
        
        # 2. Limit is 10 historical + all new ones (capped at 100)
        fetch_limit = min(100, 10 + session_logs)
        
        cursor = db.logs.find({}, {"_id": 0}).sort("ingested_at", -1).limit(fetch_limit)
        logs = await cursor.to_list(length=fetch_limit)
            
        return logs[::-1]
    return []

@app.get("/api/system/status")
async def get_system_status():
    """Fetch persistent system health and metrics"""
    if db is not None:
        active_incidents = await db.incidents.count_documents({"status": "Active"})
        active_recoveries = await db.incidents.count_documents({"status": {"$in": ["Recovering", "Validating"]}})
        
        stable_count = engine_canary.canary_metrics["stable_count"]
        canary_count = engine_canary.canary_metrics["canary_count"]
        stable_err = engine_canary.canary_metrics["stable_errors"]
        canary_err = engine_canary.canary_metrics["canary_errors"]
        
        stable_err_rate = (stable_err / stable_count * 100) if stable_count > 0 else 0
        canary_err_rate = (canary_err / canary_count * 100) if canary_count > 0 else 0
        
        stable_health = max(0, 100 - stable_err_rate)
        canary_health = max(0, 100 - canary_err_rate)
        
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
            "traffic_distribution": engine_recovery.infrastructure_state["traffic_distribution"],
            "active_incidents": active_incidents,
            "system_mode": mode
        }
    return {}

@app.get("/api/metrics/history")
async def get_metrics_history():
    """Fetch rolling metrics for traffic chart rendering"""
    if db is not None:
        doc = await db.system_state.find_one({"_id": "metrics_history"})
        if doc and "history" in doc:
            return doc["history"]
    return []
    return []

@app.post("/api/simulate/{scenario}")
async def trigger_simulation(scenario: str, payload: dict = None):
    """
    Manually inject deterministic failures.
    Scenarios: db-timeout, api-crash, canary-failure, latency-spike, auth-failure, traffic-surge
    """
    severity = payload.get("severity", "critical") if payload else "critical"
    duration = payload.get("duration", 20) if payload else 20
    
    valid_scenarios = ["db-timeout", "api-crash", "canary-failure", "latency-spike", "auth-failure", "traffic-surge"]
    if scenario not in valid_scenarios:
        return {"error": "Invalid simulation scenario", "valid_options": valid_scenarios}
        
    result = await engine_simulator.trigger_failure(scenario, severity, duration)
    return result

@app.post("/api/incidents/{incident_id}/heal")
async def manual_heal_incident(incident_id: str):
    """Fallback manual approval endpoint for the UI"""
    if db is None:
        return {"error": "DB not connected"}
        
    incident = await db.incidents.find_one({"incident_id": incident_id})
    if not incident:
        return {"error": "Incident not found"}
        
    # Mark as approved and execute
    event_time = datetime.now().strftime("%I:%M %p")
    event_text = "Manual Execution Triggered by Human"
    await db.incidents.update_one(
        {"incident_id": incident_id},
        {
            "$set": {"action_status": "Approved (Manual)", "executed_action": incident.get("recommended_action", "RESTART_SERVICE")},
            "$push": {"timeline_events": {"time": event_time, "event": event_text}}
        }
    )
    incident["executed_action"] = incident.get("recommended_action", "RESTART_SERVICE")
    await sio.emit("recovery_event", {"incident_id": incident_id, "event": event_text, "time": event_time})
    
    # Execute workflow in background
    asyncio.create_task(engine_recovery.execute_recovery_workflow(incident, db, sio))
    return {"status": "success", "message": "Recovery workflow initiated"}

@sio.on('connect')
async def connect(sid, environ):
    pass

@sio.on("disconnect")
async def handle_disconnect(sid):
    print(f"Client disconnected: {sid}")

# --- REPLAY NAMESPACE EVENTS ---
@sio.on("connect", namespace="/replay")
async def handle_replay_connect(sid, environ):
    print(f"Replay client connected: {sid}")

@sio.on("start_replay", namespace="/replay")
async def handle_start_replay(sid, data):
    incident_id = data.get("incident_id")
    speed = float(data.get("speed", 1.0))
    if incident_id:
        asyncio.create_task(engine_replay.start_replay(incident_id, speed, db, sio))

@sio.on("stop_replay", namespace="/replay")
async def handle_stop_replay(sid, data):
    incident_id = data.get("incident_id")
    if incident_id:
        await engine_replay.stop_replay(incident_id)

@sio.on("disconnect", namespace="/replay")
async def handle_replay_disconnect(sid):
    print(f"Replay client disconnected: {sid}")

if __name__ == "__main__":
    uvicorn.run("main:socket_app", host="0.0.0.0", port=8000, reload=True)
