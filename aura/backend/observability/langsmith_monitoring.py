"""
LangSmith Observability Module.
This module is responsible for configuring LangSmith.
LangSmith allows us to visually debug, trace, and evaluate the internal execution paths
of our LangGraph State Machine and LangChain LLM prompts in real-time.
"""

from config.settings import settings
import os

def init_tracing():
    """
    Injects LangSmith configuration into the OS environment variables 
    so LangChain automatically picks them up.
    If the API key is missing, it gracefully disables tracing.
    """
    if settings.LANGCHAIN_TRACING_V2 and settings.LANGCHAIN_API_KEY:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGCHAIN_ENDPOINT
        os.environ["LANGCHAIN_API_KEY"] = settings.LANGCHAIN_API_KEY
        os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT
        print(f"✅ [OBSERVABILITY] LangSmith Tracing Enabled (Project: {settings.LANGCHAIN_PROJECT})")
    else:
        # Failsafe backward compatibility if user doesn't have API keys setup yet
        os.environ["LANGCHAIN_TRACING_V2"] = "false"
        print("⚠️ [OBSERVABILITY] LangSmith Tracing Disabled (Missing API Key)")
