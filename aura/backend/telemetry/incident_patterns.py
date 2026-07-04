"""
Incident patterns mapping active chaos events to specific cascading failure chains.
"""

INCIDENT_PATTERNS = {
    "db-timeout": {
        "primary_service": "db-service",
        "primary_error": "Connection timeout after 5000ms",
        "cascading_effects": {
            "api-gateway": {
                "delay_seconds": 2,
                "error": "Upstream latency detected from db-service",
                "severity_override": "WARNING",
                "probability": 0.8
            },
            "auth-service": {
                "delay_seconds": 4,
                "error": "Database connection lost for user registry",
                "severity_override": "ERROR",
                "probability": 0.9
            },
            "frontend": {
                "delay_seconds": 6,
                "error": "API request timeout after 5000ms",
                "severity_override": "ERROR",
                "probability": 0.5
            }
        }
    },
    "api-crash": {
        "primary_service": "api-gateway",
        "primary_error": "Fatal proxy routing error - nil pointer exception",
        "cascading_effects": {
            "frontend": {
                "delay_seconds": 1,
                "error": "API response took longer than 500ms",
                "severity_override": "WARNING",
                "probability": 0.9
            }
        }
    },
    "auth-failure": {
        "primary_service": "auth-service",
        "primary_error": "Authentication service out of memory (OOMKilled) - Brute force attack detected",
        "cascading_effects": {
            "api-gateway": {
                "delay_seconds": 1,
                "error": "Upstream connection refused to auth-service",
                "severity_override": "ERROR",
                "probability": 1.0
            },
            "frontend": {
                "delay_seconds": 2,
                "error": "Authentication token explicitly rejected by gateway",
                "severity_override": "CRITICAL",
                "probability": 0.7
            }
        }
    },
    "canary-failure": {
        "primary_service": "frontend",
        "primary_error": "Unhandled exception in React component lifecycle (Canary Build V2)",
        "environment_constraint": "canary",
        "cascading_effects": {}
    },
    "latency-spike": {
        "primary_service": "api-gateway",
        "primary_error": "Upstream latency detected from db-service",
        "cascading_effects": {
            "payment-service": {
                "delay_seconds": 2,
                "error": "Stripe API latency spike",
                "severity_override": "WARNING",
                "probability": 0.5
            }
        }
    },
    "traffic-surge": {
        "primary_service": "api-gateway",
        "primary_error": "Global rate limit collapse",
        "cascading_effects": {
            "cache-service": {
                "delay_seconds": 3,
                "error": "Eviction policy triggered due to memory pressure",
                "severity_override": "WARNING",
                "probability": 0.6
            },
            "db-service": {
                "delay_seconds": 5,
                "error": "Connection pool at 80% capacity",
                "severity_override": "WARNING",
                "probability": 0.8
            }
        }
    }
}
