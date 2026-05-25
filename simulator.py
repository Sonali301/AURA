import requests
import time
import random
import os
import sys

LOG_FILE = "system_logs.txt"
API_URL = "http://127.0.0.1:8000/api/logs/ingest"
SERVICES = ["api-gateway", "auth-service", "db-service", "frontend"]

def parse_and_send():
    if not os.path.exists(LOG_FILE):
        print(f"❌ Could not find {LOG_FILE}.")
        return

    print("🚀 Starting SRIIS Traffic Simulator...")
    print(f"Sending logs one-by-one to {API_URL} (Press Ctrl+C to stop)\n")
    
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()

    count = 0
    
    # Variables for tracking live metrics in the terminal
    interval_start_time = time.time()
    interval_req_count = 0
    interval_err_count = 0

    try:
        for line in lines:
            parts = line.strip().split(" ", 3)
            if len(parts) < 4:
                continue
                
            timestamp = f"{parts[0]} {parts[1]}"
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
            
            # 1. Environment Tagging (80% stable, 20% canary)
            environment = "stable" if random.random() < 0.8 else "canary"
            
            # 2. Failure Injection Simulation
            # Simulate a Canary Instability (Canary frontend crashing)
            if environment == "canary" and service == "frontend" and random.random() < 0.05:
                level = "CRITICAL"
                message = "Unhandled exception in React component lifecycle (Canary Build V2)"
                
            # Simulate a DB Timeout Burst
            if service == "db-service" and count > 300 and count < 350:
                level = "ERROR"
                message = "MongoDB connection timeout during aggregation query"
                
            # Simulate an Auth Service Brute Force Crash
            if service == "auth-service" and count > 600 and count < 650:
                level = "CRITICAL"
                message = "Authentication service out of memory (OOMKilled) - Brute force attack detected"
            
            payload = {
                "timestamp": timestamp,
                "service": service,
                "environment": environment,
                "level": level,
                "message": message
            }
            
            is_error = (level in ["ERROR", "CRITICAL"])
            
            try:
                response = requests.post(API_URL, json=payload, timeout=5)
                if response.status_code == 200:
                    is_anomaly = response.json().get("is_anomaly", False)
                    if is_anomaly:
                        is_error = True
                        
                    anomaly_tag = "🚨 ANOMALY" if is_anomaly else "✅ NORMAL"
                    print(f"Sent: [{level}] {service} -> {anomaly_tag}")
            except Exception:
                pass
                
            count += 1
            interval_req_count += 1
            if is_error:
                interval_err_count += 1
            
            # Every 1 second, print the live terminal metrics so the user can verify!
            current_time = time.time()
            if current_time - interval_start_time >= 1.0:
                err_rate = (interval_err_count / interval_req_count) * 100 if interval_req_count > 0 else 0
                print(f"📊 [TERMINAL METRICS] Requests/sec: {interval_req_count} | Error Rate: {err_rate:.1f}%")
                
                # Reset stopwatch for the next second
                interval_start_time = current_time
                interval_req_count = 0
                interval_err_count = 0

            # Sleep slightly to send sequentially
            time.sleep(random.uniform(0.01, 0.05))

        print(f"\n✅ Finished sending all {count} logs! Simulator stopping naturally.")
        
    except KeyboardInterrupt:
        print("\n\n🛑 Simulator stopped by user. Shutting down immediately...")
        sys.exit(0)

if __name__ == "__main__":
    print("Press ENTER to start the simulator...")
    input()
    parse_and_send()
