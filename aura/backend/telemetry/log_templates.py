"""
Log templates for dynamic telemetry generation.
Categorized by service and severity.
"""

LOG_TEMPLATES = {
    "frontend": {
        "INFO": [
            "User navigation to route /dashboard",
            "Component mounted successfully",
            "API cache hit for user profile",
            "WebSocket connection established",
            "Bundle loaded in 45ms"
        ],
        "WARNING": [
            "API response took longer than 500ms",
            "Image asset failed to load, retrying",
            "WebSocket connection interrupted, attempting reconnect",
            "Rate limit warning received from API gateway"
        ],
        "ERROR": [
            "State synchronization mismatch in Redux store",
            "Component hydration failed during SSR",
            "API request timeout after 5000ms",
            "Failed to load telemetry widget stream"
        ],
        "CRITICAL": [
            "Unhandled exception in React component lifecycle (Canary Build V2)",
            "Authentication token explicitly rejected by gateway",
            "Browser memory exceeded 1.5GB, crashing tab"
        ]
    },
    "api-gateway": {
        "INFO": [
            "Request routed to auth-service in 12ms",
            "Health check ping successful",
            "Request payload validated",
            "Circuit breaker closed for payment-service"
        ],
        "WARNING": [
            "Upstream latency detected from db-service",
            "Request retry triggered for payment-service",
            "Rate limit threshold reached for IP subnet",
            "Token expiration imminent"
        ],
        "ERROR": [
            "Upstream connection refused to auth-service",
            "Circuit breaker opened for payment-service",
            "API Gateway 502 Bad Gateway - Upstream connection refused",
            "SSL handshake failed from client"
        ],
        "CRITICAL": [
            "Gateway thread pool exhausted",
            "Global rate limit collapse",
            "Fatal proxy routing error - nil pointer exception"
        ]
    },
    "auth-service": {
        "INFO": [
            "JWT token generated successfully",
            "User session established",
            "Role based access control verified",
            "Password hash verification successful"
        ],
        "WARNING": [
            "Invalid login attempt detected",
            "Token signature mismatch",
            "MFA challenge issued to unknown IP"
        ],
        "ERROR": [
            "JWT validation failed",
            "LDAP directory timeout",
            "OAuth provider callback failed",
            "Authentication service out of memory (OOMKilled) - Brute force attack detected"
        ],
        "CRITICAL": [
            "Database connection lost for user registry",
            "Brute force protection activated - subnet locked out",
            "Master signing key rotated unexpectedly"
        ]
    },
    "db-service": {
        "INFO": [
            "Connection pool initialized",
            "Query executed successfully in 4ms",
            "Vacuum process completed",
            "Replication lag under 5ms"
        ],
        "WARNING": [
            "Query execution exceeded threshold (500ms)",
            "Connection pool at 80% capacity",
            "Index scan fallback detected",
            "Memory usage high for aggregation query"
        ],
        "ERROR": [
            "Connection timeout after 5000ms",
            "Deadlock detected during transaction commit",
            "MongoDB connection timeout during aggregation query",
            "Disk I/O saturation"
        ],
        "CRITICAL": [
            "Master node failure, promoting replica",
            "Write-ahead log corruption detected",
            "Out of memory error - OOM killer invoked on pgsql process"
        ]
    },
    "payment-service": {
        "INFO": [
            "Transaction initialized",
            "Stripe API token verified",
            "Payment processed successfully",
            "Ledger entry committed"
        ],
        "WARNING": [
            "Transaction delayed by fraud engine",
            "Stripe API latency spike",
            "Idempotency key collision"
        ],
        "ERROR": [
            "Transaction rollback due to timeout",
            "Payment provider unreachable (503 Service Unavailable)",
            "Invalid card signature"
        ],
        "CRITICAL": [
            "PCI compliance heartbeat failed",
            "Fraud engine cluster crashed",
            "Multiple transaction commits dropped"
        ]
    },
    "cache-service": {
        "INFO": [
            "Cache hit",
            "Key expiration triggered",
            "Memory defragmentation completed"
        ],
        "WARNING": [
            "Cache miss rate spike",
            "Eviction policy triggered due to memory pressure"
        ],
        "ERROR": [
            "Redis cluster slot resharding failed",
            "Connection refused from cache node"
        ],
        "CRITICAL": [
            "Split brain detected in Redis cluster",
            "Cache flush all triggered unexpectedly"
        ]
    }
}
