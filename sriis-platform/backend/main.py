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

# Load environment variables
load_dotenv()

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
    is_anomaly = await detect_anomaly(log)
    
    # Record for Canary/Stable tracking
    engine_canary.record_log(log.environment, is_error=(log.level in ["ERROR", "CRITICAL"] or is_anomaly))
    
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
            confidence = float(response_json.get("confidence", 0.0))
        except Exception as e:
            print(f"Groq API Error: {e}")
            
    # 3. Decision Engine Validation
    is_approved, reason = engine_decision.validate_decision(severity, action, confidence, services)
    action_status = "Approved" if is_approved else "Rejected"
    
    # 4. Save to MongoDB (Extended Phase 5 Schema)
    incident_doc = {
        "incident_id": incident_id,
        "created_at": datetime.utcnow(),
        "status": "Active",
        "severity": severity,
        "affected_services": services,
        "root_cause": rca,
        "recommended_action": action,
        "executed_action": action if is_approved else None,
        "confidence_score": confidence,
        "action_status": action_status,
        "validation_reason": reason,
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
    
    # 4. Upsert to Pinecone for future memory (Applying User's Recommended Metadata & Combined Context!)
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
    """Fetch the latest 10 incidents for the dashboard on load"""
    if db is not None:
        cursor = db.incidents.find().sort("created_at", -1).limit(10)
        incidents = await cursor.to_list(length=10)
        for i in incidents:
            if "_id" in i:
                i["_id"] = str(i["_id"])
            if isinstance(i.get("created_at"), datetime):
                i["created_at"] = i["created_at"].isoformat()
        return incidents
    return []

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

@sio.on('disconnect')
async def disconnect(sid):
    pass

if __name__ == "__main__":
    uvicorn.run("main:socket_app", host="0.0.0.0", port=8000, reload=True)
