"""
LangGraph State Schema.
This module defines the TypedDict that gets passed between all Agent Nodes.
Every node in LangGraph receives this state dictionary, mutates it, and returns the changes.
"""

from typing import TypedDict, List, Optional, Any

class IncidentState(TypedDict):
    """
    The shared state object for the Incident Resolution Pipeline.
    It carries all context from the initial log aggregation through to safety validation.
    """
    # 1. Inputs (From Aggregation Engine)
    raw_logs: List[dict]           # Array of raw anomaly log dicts
    
    # 2. Correlation Outputs (From CorrelationAgent)
    initial_hypothesis: str        # Summary of the failure
    affected_services: List[str]   # List of services involved
    severity: str                  # High or Critical
    
    # 3. Memory Outputs (From MemoryAgent)
    historical_context: str        # Context fetched from Pinecone RAG
    
    # 4. Reasoning Outputs (From ReasoningAgent / LLM)
    root_cause: Optional[str]      # Determined cause
    recommended_action: Optional[str] # Action to execute
    action_reason: Optional[str]   # LLM explanation
    confidence: Optional[float]    # LLM confidence score
    
    # 5. Safety Outputs (From SafetyAgent)
    is_approved: Optional[bool]    # True if action is safe to execute automatically (AUTO_HEAL)
    requires_human_approval: Optional[bool] # True if HUMAN_APPROVAL is needed
    is_escalated: Optional[bool]   # True if AUTO_ESCALATED
    decision_path: Optional[str]   # AUTO_HEAL | HUMAN_APPROVAL | AUTO_ESCALATED
    decision_reason: Optional[str] # Detailed reason for decision path
    block_reason: Optional[str]    # Why it was blocked/escalated (legacy compatibility)
    risk_level: Optional[str]      # LOW, MEDIUM, HIGH, CRITICAL
    validation_reason: Optional[str] # Explicit reason for validation failure/success
    
    # 6. Recovery Audit Trail (Populated by UI and Recovery Engine)
    approval_user: Optional[str]
    approval_timestamp: Optional[str]
    recovery_started_at: Optional[str]
    validation_started_at: Optional[str]
    resolved_at: Optional[str]
