import asyncio
import time
import random
import httpx
from telemetry.telemetry_generator import telemetry_engine

import os
PORT = os.getenv("PORT", "8000")
API_URL = f"http://127.0.0.1:{PORT}/api/logs/ingest"

simulation_state = {
    "is_running": False,
    "active_failure": None,
    "severity": "CRITICAL",
    "end_time": 0,
    "start_time": 0,
    "suppress_errors_until": 0
}

async def trigger_failure(failure_type: str, severity: str = "critical", duration: int = 20):
    simulation_state["active_failure"] = failure_type
    simulation_state["severity"] = severity.upper()
    simulation_state["start_time"] = time.time()
    simulation_state["end_time"] = time.time() + duration
    return {"status": "success", "message": f"Simulating {failure_type} for {duration}s at {severity} severity"}

def clear_active_failure():
    """Called by recovery engine to instantly stop simulated disasters and suppress native errors"""
    # 30% chance the recovery fails to actually fix the issue to demonstrate Validation Escalation
    if random.random() < 0.3:
        print("⚠ [SIMULATOR] Simulated recovery action applied, but issue persists! (Validation will fail)")
        return
        
    simulation_state["active_failure"] = None
    simulation_state["suppress_errors_until"] = time.time() + 20

async def simulator_loop():
    simulation_state["is_running"] = True
    print("🚀 Dynamic Synthetic Telemetry Engine started...")
    
    async with httpx.AsyncClient() as client:
        while simulation_state["is_running"]:
            
            # Check if active failure period ended
            if simulation_state["active_failure"]:
                if time.time() > simulation_state["end_time"]:
                    simulation_state["active_failure"] = None
                    print("✅ Simulation period ended. Returning to normal traffic.")
            
            time_in_failure = 0
            if simulation_state["active_failure"]:
                time_in_failure = time.time() - simulation_state["start_time"]
            
            # Generate log
            payload = telemetry_engine.generate_log(
                active_failure=simulation_state["active_failure"],
                severity=simulation_state["severity"],
                time_in_failure=time_in_failure
            )
            
            # If a recovery just happened, force the system to be perfectly healthy for 20s
            if time.time() < simulation_state["suppress_errors_until"]:
                if payload["level"] in ["ERROR", "CRITICAL", "WARNING"]:
                    payload["level"] = "INFO"
                    payload["message"] = "Service recovered and operating normally"
                    payload["latency_ms"] = max(10, payload["latency_ms"] // 10)
                    payload["cpu_usage"] = max(10, payload["cpu_usage"] // 2)

            try:
                from api.routes_logs import LogEntry, ingest_log
                log_entry = LogEntry(**payload)
                await ingest_log(log_entry)
            except Exception as e:
                print(f"Simulator error: {e}")
            
            # Traffic surge simulation
            sleep_time = 0.01 if simulation_state["active_failure"] == "traffic-surge" else random.uniform(0.02, 0.08)
            await asyncio.sleep(sleep_time)
