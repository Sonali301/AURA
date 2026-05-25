import datetime

# 1. Approved Action Allowlist
APPROVED_ACTIONS = [
    "ROLLBACK_CANARY",
    "RESTART_SERVICE",
    "REROUTE_TRAFFIC",
    "MONITOR_ONLY"
]

# 2. Recovery Cooldown Protection
# Tracks how many times a service has been restarted recently
service_restart_counts = {
    "api-gateway": 0,
    "auth-service": 0,
    "db-service": 0,
    "frontend": 0
}
MAX_RECOVERIES = 3

def validate_decision(severity: str, action: str, confidence: float, affected_services: list):
    """
    Validates an AI recommendation against hardcoded safety rules.
    Returns (is_approved: bool, reason: str)
    """
    
    # Check 1: Is the action in the safety allowlist?
    if action not in APPROVED_ACTIONS:
        return False, f"Action '{action}' is not in the APPROVED_ACTIONS allowlist."
        
    # Check 2: Confidence Threshold
    if confidence < 0.85:
        return False, f"AI Confidence ({confidence}) is below the required 0.85 threshold."
        
    # Check 3: Severity Gate (Only auto-recover Critical or Major incidents)
    if severity not in ["Critical", "Major"]:
        return False, f"Automated recovery requires Critical/Major severity, got {severity}."
        
    # Check 4: Recovery Cooldown Protection (Prevent Infinite Restart Loops)
    if action == "RESTART_SERVICE":
        for svc in affected_services:
            if service_restart_counts.get(svc, 0) >= MAX_RECOVERIES:
                return False, f"Cooldown triggered: {svc} has exceeded {MAX_RECOVERIES} automated restarts."
                
    return True, "Approved by Decision Engine."

def log_recovery_execution(services: list):
    """Called when a recovery actually executes to update cooldown counters."""
    for svc in services:
        if svc in service_restart_counts:
            service_restart_counts[svc] += 1
