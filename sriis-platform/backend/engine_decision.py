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
        return "REQUIRES_APPROVAL", f"Action '{action}' is not in the APPROVED_ACTIONS allowlist."
        
    # Check 2: Confidence Threshold
    # 1. Low confidence -> Escalated (AI cannot confidently solve it)
    if confidence < 0.85:
        return "ESCALATED", f"LLM Confidence ({confidence}) too low. Human intervention required."
        
    # 2. Safety Rule -> Requires Approval (AI can solve it, but needs permission)
    if "db-service" in affected_services and severity == "Critical":
        if "RESTART" in action or "FAILOVER" in action:
            return "REQUIRES_APPROVAL", "Requires manual approval for Critical Database operations."

    # Check 4: Recovery Cooldown Protection (Prevent Infinite Restart Loops)
    if action == "RESTART_SERVICE":
        for svc in affected_services:
            if service_restart_counts.get(svc, 0) >= MAX_RECOVERIES:
                return "REQUIRES_APPROVAL", f"Cooldown triggered: {svc} has exceeded {MAX_RECOVERIES} automated restarts."
            
    # 3. Otherwise -> Approved (AI solves automatically)
    return "APPROVED", "Action approved by Safety Rules."

def log_recovery_execution(services: list):
    """Called when a recovery actually executes to update cooldown counters."""
    for svc in services:
        if svc in service_restart_counts:
            service_restart_counts[svc] += 1
