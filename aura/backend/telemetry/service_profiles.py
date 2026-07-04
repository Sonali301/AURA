"""
Service profiles defining baseline metrics, boundaries, dependencies, and failure characteristics.
"""

SERVICE_PROFILES = {
    "frontend": {
        "normal_latency": [15, 60],
        "failure_latency": [1000, 3000],
        "normal_cpu": [10, 40],
        "critical_cpu": [80, 99],
        "normal_memory": [40, 60],
        "critical_memory": [80, 95],
        "dependencies": ["api-gateway"],
        "error_probability": 0.01,
        "canary_instability_multiplier": 1.5
    },
    "api-gateway": {
        "normal_latency": [5, 20],
        "failure_latency": [500, 5000],
        "normal_cpu": [20, 50],
        "critical_cpu": [85, 99],
        "normal_memory": [30, 50],
        "critical_memory": [75, 90],
        "dependencies": ["auth-service", "db-service", "payment-service"],
        "error_probability": 0.005,
        "canary_instability_multiplier": 1.2
    },
    "auth-service": {
        "normal_latency": [10, 45],
        "failure_latency": [800, 4000],
        "normal_cpu": [15, 35],
        "critical_cpu": [90, 100],
        "normal_memory": [20, 40],
        "critical_memory": [90, 100], # Auth OOMs during brute force
        "dependencies": ["db-service"],
        "error_probability": 0.005,
        "canary_instability_multiplier": 1.1
    },
    "db-service": {
        "normal_latency": [2, 15],
        "failure_latency": [2000, 8000],
        "normal_cpu": [30, 65],
        "critical_cpu": [95, 100],
        "normal_memory": [60, 85],
        "critical_memory": [95, 100],
        "dependencies": [],
        "error_probability": 0.002,
        "canary_instability_multiplier": 1.05
    },
    "payment-service": {
        "normal_latency": [100, 300], # 3rd party API calls take time
        "failure_latency": [3000, 10000],
        "normal_cpu": [10, 30],
        "critical_cpu": [60, 85],
        "normal_memory": [20, 40],
        "critical_memory": [60, 80],
        "dependencies": ["db-service"],
        "error_probability": 0.02, # Higher natural failure rate due to 3rd party
        "canary_instability_multiplier": 1.3
    },
    "cache-service": {
        "normal_latency": [1, 5],
        "failure_latency": [50, 500],
        "normal_cpu": [5, 20],
        "critical_cpu": [70, 95],
        "normal_memory": [40, 80],
        "critical_memory": [95, 100],
        "dependencies": [],
        "error_probability": 0.001,
        "canary_instability_multiplier": 1.0
    }
}
