import asyncio
import time
import random
import os
import httpx
from datetime import datetime

LOG_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "system_logs.txt"))
API_URL = "http://127.0.0.1:8000/api/logs/ingest"
SERVICES = ["api-gateway", "auth-service", "db-service", "frontend"]

simulation_state = {
    "is_running": False,
    "active_failure": None,
    "severity": "CRITICAL",
    "end_time": 0,
    "suppress_errors_until": 0
}

async def trigger_failure(failure_type: str, severity: str = "critical", duration: int = 20):
    simulation_state["active_failure"] = failure_type
    simulation_state["severity"] = severity.upper()
    simulation_state["end_time"] = time.time() + duration
    return {"status": "success", "message": f"Simulating {failure_type} for {duration}s at {severity} severity"}

def clear_active_failure():
    """Called by recovery engine to instantly stop simulated disasters and suppress native errors"""
    simulation_state["active_failure"] = None
    simulation_state["suppress_errors_until"] = time.time() + 20

async def simulator_loop():
    if not os.path.exists(LOG_FILE):
        print(f"❌ Simulator could not find {LOG_FILE}.")
        return

    simulation_state["is_running"] = True
    print(f"🚀 Internal Simulator started in background using {LOG_FILE}...")
    
    async with httpx.AsyncClient() as client:
        while simulation_state["is_running"]:
            with open(LOG_FILE, "r", encoding="utf-8") as f:
                lines = f.readlines()
                
            for line in lines:
                if not simulation_state["is_running"]:
                    return
                    
                parts = line.strip().split(" ", 3)
                if len(parts) < 4:
                    continue
                    
                # Use current local time for realistic dashboard
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                level = parts[2]
                message = parts[3]
                
                msg_lower = message.lower()
                if "database" in msg_lower or "db" in msg_lower:
                    service = "db-service"
                elif "auth" in msg_lower or "unauthorized" in msg_lower or "brute force" in msg_lower:
                    service = "auth-service"
                elif "gateway" in msg_lower or "ip" in msg_lower:
                    service = "api-gateway"
                else:
                    service = random.choice(SERVICES)
                
                environment = "stable" if random.random() < 0.8 else "canary"
                
                # Check active failure
                if simulation_state["active_failure"]:
                    if time.time() > simulation_state["end_time"]:
                        simulation_state["active_failure"] = None
                        print("✅ Simulation period ended. Returning to normal traffic.")
                    else:
                        fail = simulation_state["active_failure"]
                        sev = simulation_state["severity"]
                        
                        # Apply failure logic overrides
                        if fail == "db-timeout" and service == "db-service":
                            level = sev
                            message = "MongoDB connection timeout during aggregation query"
                        elif fail == "api-crash" and service == "api-gateway":
                            level = sev
                            message = "API Gateway 502 Bad Gateway - Upstream connection refused"
                        elif fail == "latency-spike":
                            if random.random() < 0.3:
                                level = "WARNING"
                                message = f"High latency detected in {service}: Response time > 2000ms"
                        elif fail == "canary-failure" and environment == "canary" and service == "frontend":
                            level = sev
                            message = "Unhandled exception in React component lifecycle (Canary Build V2)"
                        elif fail == "auth-failure" and service == "auth-service":
                            level = sev
                            message = "Authentication service out of memory (OOMKilled) - Brute force attack detected"
                            
                # If a recovery just happened, force the system to be perfectly healthy for 20s
                if time.time() < simulation_state["suppress_errors_until"]:
                    if level in ["ERROR", "CRITICAL", "WARNING"]:
                        level = "INFO"
                        message = "Service recovered and operating normally"
                
                payload = {
                    "timestamp": timestamp,
                    "service": service,
                    "environment": environment,
                    "level": level,
                    "message": message
                }
                
                try:
                    await client.post(API_URL, json=payload, timeout=2.0)
                except Exception:
                    pass
                
                # Traffic surge simulation
                sleep_time = 0.01 if simulation_state["active_failure"] == "traffic-surge" else random.uniform(0.02, 0.08)
                await asyncio.sleep(sleep_time)
