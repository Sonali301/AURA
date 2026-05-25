import asyncio
import datetime

# In-memory tracking for a rolling 60-second window
canary_metrics = {
    "stable_count": 0,
    "stable_errors": 0,
    "canary_count": 0,
    "canary_errors": 0
}

def record_log(environment: str, is_error: bool):
    """Tracks incoming logs by environment to compute split metrics."""
    if environment == "canary":
        canary_metrics["canary_count"] += 1
        if is_error:
            canary_metrics["canary_errors"] += 1
    else:
        canary_metrics["stable_count"] += 1
        if is_error:
            canary_metrics["stable_errors"] += 1

async def canary_monitoring_loop(sio):
    """Background task to emit comparative health scores to the UI every 2 seconds."""
    while True:
        await asyncio.sleep(2)
        
        stable_count = canary_metrics["stable_count"]
        canary_count = canary_metrics["canary_count"]
        
        stable_err_rate = (canary_metrics["stable_errors"] / stable_count * 100) if stable_count > 0 else 0
        canary_err_rate = (canary_metrics["canary_errors"] / canary_count * 100) if canary_count > 0 else 0
        
        # Calculate health score (100 = 0% errors, 0 = 100% errors)
        stable_health = max(0, 100 - stable_err_rate)
        canary_health = max(0, 100 - canary_err_rate)
        
        payload = {
            "time": datetime.datetime.now().strftime("%H:%M:%S"),
            "stable_health": round(stable_health, 1),
            "canary_health": round(canary_health, 1),
            "stable_error_rate": round(stable_err_rate, 1),
            "canary_error_rate": round(canary_err_rate, 1)
        }
        
        await sio.emit("canary_metrics", payload)
        
        # Reset counters slightly to create a rolling average effect
        # We don't wipe them to 0, we decay them by 50%
        canary_metrics["stable_count"] = int(canary_metrics["stable_count"] * 0.5)
        canary_metrics["stable_errors"] = int(canary_metrics["stable_errors"] * 0.5)
        canary_metrics["canary_count"] = int(canary_metrics["canary_count"] * 0.5)
        canary_metrics["canary_errors"] = int(canary_metrics["canary_errors"] * 0.5)
