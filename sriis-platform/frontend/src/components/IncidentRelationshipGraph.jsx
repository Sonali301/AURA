import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 250, y: 0 }, data: { label: 'DB Service (Timeout)' }, style: { backgroundColor: '#fee2e2', border: '1px solid #ef4444' } },
  { id: '2', position: { x: 250, y: 100 }, data: { label: 'API Gateway (Latency Spike)' }, style: { backgroundColor: '#fef08a', border: '1px solid #eab308' } },
  { id: '3', position: { x: 250, y: 200 }, data: { label: 'Auth Service (Failing)' }, style: { backgroundColor: '#fef08a', border: '1px solid #eab308' } },
  { id: '4', position: { x: 250, y: 300 }, data: { label: 'Frontend Timeout (User Impact)' }, style: { backgroundColor: '#fee2e2', border: '1px solid #ef4444' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#ef4444' } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#eab308' } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#ef4444' } },
];

export default function IncidentRelationshipGraph() {
  return (
    <div className="w-full h-96 border border-gray-800 rounded-lg bg-gray-900 shadow-xl overflow-hidden">
      <div className="p-3 bg-gray-800 border-b border-gray-700 font-semibold text-white">
        Incident Dependency Graph
      </div>
      <div className="h-full w-full">
        <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
          <Background color="#374151" gap={16} />
          <Controls className="bg-gray-800 border-gray-700 fill-white" />
        </ReactFlow>
      </div>
    </div>
  );
}
