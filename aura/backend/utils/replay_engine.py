import asyncio
import datetime
from bson import ObjectId

active_replays = {}

async def start_replay(incident_id: str, speed: float, db, sio):
    """
    Fetches an incident and replays its timeline events over the /replay namespace.
    """
    if incident_id in active_replays:
        active_replays[incident_id]["stop"] = True
        await asyncio.sleep(1) # wait for old one to die
        
    active_replays[incident_id] = {"stop": False, "speed": speed}
    
    incident = await db.incidents.find_one({"incident_id": incident_id})
    if not incident:
        await sio.emit("replay_error", {"message": "Incident not found"}, namespace="/replay")
        return
        
    timeline = incident.get("timeline_events", [])
    if not timeline:
        await sio.emit("replay_error", {"message": "No timeline events to replay"}, namespace="/replay")
        return
        
    # Fix Serialization Issues before emitting
    incident.pop("_id", None)
    for date_field in ["created_at", "recovery_started_at", "recovery_completed_at"]:
        if date_field in incident and isinstance(incident[date_field], datetime.datetime):
            incident[date_field] = incident[date_field].isoformat()
            
    await sio.emit("replay_started", {"incident": incident}, namespace="/replay")
    
    # Replay Loop
    for i in range(len(timeline)):
        if active_replays[incident_id]["stop"]:
            break
            
        event = timeline[i]
        await sio.emit("replay_event", event, namespace="/replay")
        
        if i < len(timeline) - 1:
            # Calculate time difference between this event and next
            try:
                curr_time = datetime.datetime.strptime(event["time"], "%I:%M %p")
                next_time = datetime.datetime.strptime(timeline[i+1]["time"], "%I:%M %p")
                
                # Handle midnight crossover (basic)
                if next_time < curr_time:
                    next_time += datetime.timedelta(days=1)
                    
                diff_seconds = (next_time - curr_time).total_seconds()
                # To prevent insanely long waits in demo, cap at 30 seconds
                diff_seconds = min(diff_seconds, 30.0)
                
                # Apply speed multiplier
                sleep_time = diff_seconds / speed
                # Force minimum sleep for UX
                sleep_time = max(2.0, sleep_time)
                
                await asyncio.sleep(sleep_time)
            except Exception as e:
                # Fallback if time parsing fails
                await asyncio.sleep(3.0 / speed)
                
    if not active_replays[incident_id]["stop"]:
        await sio.emit("replay_completed", {"incident_id": incident_id}, namespace="/replay")
    
    active_replays.pop(incident_id, None)

async def stop_replay(incident_id: str):
    if incident_id in active_replays:
        active_replays[incident_id]["stop"] = True
