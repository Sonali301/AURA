"""
LangGraph Workflow Orchestrator.
This module defines the directed acyclic graph (DAG) for incident resolution.
It wires the specialized Agents together in a specific sequence.
"""

from langgraph.graph import StateGraph, END
from graph.workflow_state import IncidentState
from agents.correlation_agent import CorrelationAgent
from agents.memory_agent import MemoryAgent
from agents.reasoning_agent import ReasoningAgent
from agents.safety_agent import SafetyAgent

def build_graph():
    """
    Constructs the LangGraph State Machine.
    The flow is strictly sequential for now:
    Correlation -> Memory -> Reasoning -> Safety -> END
    """
    # Initialize the Graph with our specific State schema
    workflow = StateGraph(IncidentState)

    # 1. Add Agent Nodes
    workflow.add_node("correlation", CorrelationAgent.run)
    workflow.add_node("memory", MemoryAgent.run)
    workflow.add_node("reasoning", ReasoningAgent.run)
    workflow.add_node("safety", SafetyAgent.run)

    # 2. Define Edges (The flow of execution)
    workflow.set_entry_point("correlation")
    workflow.add_edge("correlation", "memory")
    workflow.add_edge("memory", "reasoning")
    workflow.add_edge("reasoning", "safety")
    workflow.add_edge("safety", END)

    # Compile the graph into a runnable LangChain executable
    return workflow.compile()

# Singleton graph instance to be invoked in main.py
app_graph = build_graph()
