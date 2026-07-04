import random
import uuid
from datetime import datetime
from telemetry.log_templates import LOG_TEMPLATES
from telemetry.service_profiles import SERVICE_PROFILES
from telemetry.incident_patterns import INCIDENT_PATTERNS

class TelemetryGenerator:
    def __init__(self):
        pass

    def generate_log(self, active_failure=None, severity="CRITICAL", time_in_failure=0):
        # Determine environment (80% stable, 20% canary)
        environment = "stable" if random.random() < 0.8 else "canary"
        
        # Pick a service, weighted by natural traffic
        service = random.choices(
            list(SERVICE_PROFILES.keys()), 
            weights=[0.3, 0.3, 0.15, 0.15, 0.05, 0.05], 
            k=1
        )[0]
        
        profile = SERVICE_PROFILES[service]
        
        # Determine if this log is an error based on natural probability + canary multiplier
        base_err_prob = profile["error_probability"]
        if environment == "canary":
            base_err_prob *= profile["canary_instability_multiplier"]
            
        is_error = random.random() < base_err_prob
        
        # Override with active failure logic
        log_level = "INFO"
        message = ""
        is_incident_log = False
        
        if active_failure and active_failure in INCIDENT_PATTERNS:
            pattern = INCIDENT_PATTERNS[active_failure]
            # Primary service failure
            if service == pattern["primary_service"]:
                if "environment_constraint" in pattern and pattern["environment_constraint"] != environment:
                    pass # Skip constraint mismatch
                else:
                    if random.random() < 0.6: # High chance to emit the failure log
                        log_level = severity
                        message = pattern["primary_error"]
                        is_incident_log = True
            
            # Check cascading effects
            if not is_incident_log and service in pattern["cascading_effects"]:
                cascade = pattern["cascading_effects"][service]
                if time_in_failure >= cascade["delay_seconds"]:
                    if random.random() < cascade["probability"]:
                        log_level = cascade["severity_override"]
                        message = cascade["error"]
                        is_incident_log = True

        # If not an incident log, use normal templating
        if not is_incident_log:
            if is_error:
                log_level = random.choices(["WARNING", "ERROR", "CRITICAL"], weights=[0.6, 0.3, 0.1])[0]
                message = random.choice(LOG_TEMPLATES[service][log_level])
            else:
                log_level = "INFO"
                message = random.choice(LOG_TEMPLATES[service]["INFO"])

        # Generate metrics
        latency_range = profile["failure_latency"] if log_level in ["ERROR", "CRITICAL"] else profile["normal_latency"]
        cpu_range = profile["critical_cpu"] if log_level in ["ERROR", "CRITICAL"] else profile["normal_cpu"]
        memory_range = profile["critical_memory"] if log_level in ["ERROR", "CRITICAL"] else profile["normal_memory"]
        
        latency = random.randint(latency_range[0], latency_range[1])
        cpu = random.randint(cpu_range[0], cpu_range[1])
        memory = random.randint(memory_range[0], memory_range[1])

        # Construct log
        return {
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "service": service,
            "environment": environment,
            "level": log_level,
            "message": message,
            "trace_id": f"trace-{uuid.uuid4().hex[:8]}",
            "request_id": f"req-{uuid.uuid4().hex[:12]}",
            "latency_ms": latency,
            "cpu_usage": cpu,
            "memory_usage": memory
        }

telemetry_engine = TelemetryGenerator()
