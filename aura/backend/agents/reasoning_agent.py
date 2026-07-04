"""
Reasoning Agent Node.
This is the THIRD node in the LangGraph Incident Resolution Pipeline.
It takes the structured incident state and historical memory context, and feeds
them into the Groq Llama-3 model. The LLM acts as the central intelligence engine,
determining the Root Cause and the exact Automated Recovery Action to take.
"""

from graph.workflow_state import IncidentState
from langchain_core.runnables import RunnableConfig
from langchain_groq import ChatGroq
from config.settings import settings
from rag.prompt_templates import RCA_REASONING_PROMPT
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

class RCAOutput(BaseModel):
    """Schema for the LLM output parser, guaranteeing structured JSON responses."""
    root_cause: str = Field(description="1-2 sentence explanation of the failure")
    recommended_action: str = Field(description="The action to take")
    action_reason: str = Field(description="Why this action was chosen based on historical context")
    confidence: float = Field(description="Confidence score 0.0 to 1.0")
    risk_level: str = Field(description="LOW, MEDIUM, HIGH, or CRITICAL")

class ReasoningAgent:
    
    @classmethod
    def run(cls, state: IncidentState, config: RunnableConfig) -> IncidentState:
        """
        Executes the LLM Inference chain.
        Formats the prompt template, invokes Groq, and parses the JSON output.
        """
        try:
            # Initialize the Groq inference client, pointing to a fast Llama-3.1 model
            llm = ChatGroq(temperature=0.2, model_name="llama-3.1-8b-instant", groq_api_key=settings.GROQ_API_KEY)
            
            # Enforce output formatting via Langchain's JsonOutputParser
            parser = JsonOutputParser(pydantic_object=RCAOutput)
            
            # Compose the Chain (Prompt -> LLM -> JSON Parser)
            chain = RCA_REASONING_PROMPT | llm | parser
            
            # Execute the Chain by injecting variables from the graph state
            res = chain.invoke({
                "severity": state.get("severity", "Unknown"),
                "services": ", ".join(state.get("affected_services", [])),
                "summary": state.get("initial_hypothesis", "Unknown issue"),
                "historical_context": state.get("historical_context", "No history found.")
            })
            
            print(f"[ReasoningAgent] Proposed Action: {res.get('recommended_action')} (Confidence: {res.get('confidence')}) (Risk: {res.get('risk_level', 'UNKNOWN')})")
            
            return {
                "root_cause": res.get("root_cause", "Unknown Root Cause"),
                "recommended_action": res.get("recommended_action", "MONITOR_ONLY"),
                "action_reason": res.get("action_reason", "No reason provided"),
                "confidence": res.get("confidence", 0.5),
                "risk_level": res.get("risk_level", "HIGH")
            }
        except Exception as e:
            print(f"[ReasoningAgent] LLM Failure: {e}")
            # Fallback failsafe response in case the LLM API is down
            return {
                "root_cause": f"System overloaded. AI diagnosis failed. {str(e)}",
                "recommended_action": "MONITOR_ONLY",
                "action_reason": "Defaulting to monitor due to LLM error.",
                "confidence": 0.0,
                "risk_level": "CRITICAL"
            }
