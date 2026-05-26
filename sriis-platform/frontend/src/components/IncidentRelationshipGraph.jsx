import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';

export default function IncidentRelationshipGraph({ incidents = [] }) {
  const { nodes, edges } = useMemo(() => {
    // Get the most recent incident with correlation data
    const activeIncident = incidents.find(inc => inc.cascading_chain && inc.cascading_chain.length > 0);
    
    if (!activeIncident) {
      // Default static state if no correlation data
      return {
        nodes: [
          { id: '1', position: { x: 250, y: 50 }, data: { label: 'DB Service' }, style: { backgroundColor: '#1F2937', color: 'white' } },
          { id: '2', position: { x: 250, y: 150 }, data: { label: 'API Gateway' }, style: { backgroundColor: '#1F2937', color: 'white' } },
          { id: '3', position: { x: 250, y: 250 }, data: { label: 'Auth Service' }, style: { backgroundColor: '#1F2937', color: 'white' } },
          { id: '4', position: { x: 250, y: 350 }, data: { label: 'Frontend' }, style: { backgroundColor: '#1F2937', color: 'white' } },
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2', style: { stroke: '#4B5563' } },
          { id: 'e2-3', source: '2', target: '3', style: { stroke: '#4B5563' } },
          { id: 'e3-4', source: '3', target: '4', style: { stroke: '#4B5563' } },
        ]
      };
    }

    const { cascading_chain, root_dependency } = activeIncident;
    const newNodes = [];
    const newEdges = [];
    const addedNodes = new Set();
    
    let yPos = 50;
    
    const addNode = (serviceId) => {
      if (addedNodes.has(serviceId)) return;
      addedNodes.add(serviceId);
      
      const isRoot = serviceId === root_dependency;
      
      newNodes.push({
        id: serviceId,
        position: { x: 250, y: yPos },
        data: { label: isRoot ? `🔥 ROOT CAUSE: ${serviceId}` : serviceId },
        style: isRoot ? {
          backgroundColor: '#991b1b', // dark red
          border: '2px solid #ef4444', // glowing red border
          color: 'white',
          fontWeight: 'bold',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)'
        } : {
          backgroundColor: '#374151',
          border: '1px solid #eab308', // warning yellow
          color: 'white'
        }
      });
      yPos += 120;
    };

    cascading_chain.forEach((link, idx) => {
      addNode(link.source);
      addNode(link.target);
      
      // The edge thickness is weighted by confidence
      const thickness = Math.max(1, link.confidence * 4);
      
      newEdges.push({
        id: `e-${link.source}-${link.target}`,
        source: link.source,
        target: link.target,
        animated: true,
        label: `${Math.round(link.confidence * 100)}% conf.`,
        labelStyle: { fill: '#ef4444', fontWeight: 700, fontSize: 12 },
        labelBgStyle: { fill: '#1F2937', color: '#fff', fillOpacity: 0.8 },
        style: { stroke: '#ef4444', strokeWidth: thickness },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }
      });
    });

    return { nodes: newNodes, edges: newEdges };
  }, [incidents]);

  return (
    <div className="w-full h-96 border border-gray-800 rounded-lg bg-gray-900 shadow-xl overflow-hidden relative">
      <div className="p-3 bg-gray-800 border-b border-gray-700 font-semibold text-white flex justify-between">
        <span>Distributed Intelligence Correlation</span>
        {incidents.length > 0 && incidents[0].cascading_chain?.length > 0 && (
          <span className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded border border-red-800 animate-pulse">
            Live Cascading Failure Detected
          </span>
        )}
      </div>
      <div className="h-full w-full">
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background color="#374151" gap={16} />
          <Controls className="bg-gray-800 border-gray-700 fill-white" />
        </ReactFlow>
      </div>
    </div>
  );
}
