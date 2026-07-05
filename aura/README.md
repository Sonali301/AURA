# Aura Agentic Platform

Aura Autonomous Systems (formerly SRIIS) is an intelligent, agent-based platform designed for proactive system observability, real-time log analysis, and autonomous incident recovery. By combining a powerful LangGraph orchestration engine with a modern React frontend, Aura detects, analyzes, and resolves system anomalies with minimal human intervention.

## 🚀 Key Features

*   **Agentic Orchestration (LangGraph):** Employs a sophisticated graph-based workflow (Correlation -> Memory -> Reasoning -> Safety) to intelligently process anomalies, deduce root causes, and determine the safest course of action.
*   **Autonomous & Human-in-the-Loop Recovery:** Supports automatic healing (`AUTO_HEAL`) of well-understood issues, while safely escalating uncertain or high-risk incidents for manual human approval (`HUMAN_APPROVAL`).
*   **Retrieval-Augmented Generation (RAG):** Integrates Pinecone vector databases and embeddings to leverage historical incident data, ensuring context-aware and highly accurate root cause analysis.
*   **Real-time Observability & Telemetry:** Continuously monitors system logs via a time-windowed aggregation loop that automatically groups related anomalies into unified incident reports.
*   **Modern Interactive Dashboard:** Features a sleek, responsive React + Vite frontend styled with TailwindCSS, utilizing Framer Motion for smooth animations, and Recharts/React Flow for rich data and workflow visualizations.
*   **Live WebSockets Updates:** Uses Socket.IO to provide instant, real-time push notifications of new incidents, system status, and agent actions directly to the UI.
*   **Comprehensive Tracing:** Deeply integrated with LangSmith for full observability, debugging, and monitoring of agent decision pathways and LLM interactions.

## 🛠️ Tech Stack

### Backend
*   **Framework:** Python, FastAPI
*   **AI/Orchestration:** LangGraph, LangSmith
*   **Databases:** MongoDB (Primary Data), Pinecone (Vector Store)
*   **Real-time Communication:** Socket.IO

### Frontend
*   **Core:** React 19, Vite
*   **Styling & UI:** TailwindCSS, Framer Motion, Lucide React
*   **Visualization:** Recharts (Data), React Flow / Force Graph 2D (Network Graphs)

## 📁 Project Structure

*   `/backend` - Contains the FastAPI application, LangGraph agents (Recovery, Safety), MongoDB/Pinecone integrations, and WebSocket managers.
*   `/frontend` - Contains the React Vite application, including UI components, layouts, and data visualization tools.

## ⚙️ Getting Started

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies: `pip install -r requirements.txt`
3. Configure your `.env` file with necessary API keys (MongoDB, Pinecone, LangSmith, etc.).
4. Run the server: `uvicorn main:socket_app --reload` (Make sure to run the `socket_app` instance for WebSocket support).

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
