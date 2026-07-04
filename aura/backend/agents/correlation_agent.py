"""
Correlation Agent Node.
This is the FIRST node in the LangGraph Incident Resolution Pipeline.
Its job is to ingest raw anomalous log data and structure it into a coherent
Initial Incident Hypothesis, extracting which microservices are failing
and assigning a severity level.
"""

from graph.workflow_state import IncidentState
from langchain_core.runnables import RunnableConfig

class CorrelationAgent:
    
    @staticmethod
    def run(state: IncidentState, config: RunnableConfig) -> IncidentState:
        """
        Executes the Correlation logic.
        Looks at the raw log traces and extracts structured metadata.
        """
        logs = state["raw_logs"]
        services = set([log.get("service", "unknown") for log in logs])
        
        # Simple heuristic to determine initial severity
        severity = "high"
        if any("CRITICAL" in log.get("message", "").upper() for log in logs):
            severity = "critical"
            
        summary = f"Detected {len(logs)} anomalous events across {len(services)} services: {', '.join(services)}."
        
        # Update the state dictionary and pass it to the next node
        return {
            "initial_hypothesis": summary,
            "affected_services": list(services),
            "severity": severity,
            "raw_logs": logs # Pass through
        }
