🌟Core Features
Agentic AI Workflow: Uses LangGraph to automatically analyze system logs, correlate anomalies, and determine the root cause of issues.
Autonomous Recovery: Can automatically heal known system issues, while safely escalating riskier problems for human approval.
Retrieval-Augmented Generation (RAG): Uses a Pinecone vector database to learn from historical incident data and provide context-aware solutions.
Real-Time Log Aggregation: Continuously monitors logs in the background and groups related anomalies together over time windows.
Live Dashboard: A React + Vite frontend that receives real-time updates via WebSockets (Socket.IO) whenever new incidents occur.
Observability: Integrated with LangSmith to trace and monitor the AI agents' decision-making processes.
🚀 How to Start and Run
You will need to open two separate terminal windows (one for the backend and one for the frontend).

1. Start the Backend (FastAPI + LangGraph)
In your first terminal, run the following commands:
# Navigate into the backend folder
cd "e:\log analysis\aura\backend"
# Install the Python dependencies
pip install -r requirements.txt
# Ensure your .env file is set up with your API keys (MongoDB, Pinecone, LangSmith, etc.)
# Start the server (Make sure to run socket_app for WebSockets to work)
uvicorn main:socket_app --reload

2. Start the Frontend (React + Vite)
In your second terminal, run the following commands:
# Navigate into the frontend folder
cd "e:\log analysis\aura\frontend"
# Install the Node.js dependencies
npm install
# Start the development server
npm run dev
Once both are running, your backend API and WebSocket server will be active, 
and you can open the local URL provided by Vite (usually http://localhost:5173) 
in your browser to view the frontend dashboard!
