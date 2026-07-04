import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Database, Globe, Lock, CreditCard, Activity } from 'lucide-react';

export default function BlastRadiusGraph({ activeIncidents }) {
  const [affectedNodes, setAffectedNodes] = useState([]);
  const [severityLevel, setSeverityLevel] = useState('healthy'); // healthy, warning, critical, escalated

  useEffect(() => {
    if (!activeIncidents || activeIncidents.length === 0) {
      setAffectedNodes([]);
      setSeverityLevel('healthy');
      return;
    }

    const currentIncident = activeIncidents[0]; // Take the most recent active incident
    setAffectedNodes(currentIncident.affected_services || []);
    
    if (currentIncident.status === 'Escalated') {
      setSeverityLevel('escalated');
    } else if (currentIncident.severity === 'Critical') {
      setSeverityLevel('critical');
    } else {
      setSeverityLevel('warning');
    }
  }, [activeIncidents]);

  const nodes = [
    { id: 'frontend', label: 'Frontend', icon: <Globe size={20} />, x: 10, y: 50 },
    { id: 'api-gateway', label: 'API Gateway', icon: <Server size={20} />, x: 40, y: 50 },
    { id: 'auth-service', label: 'Auth Service', icon: <Lock size={20} />, x: 80, y: 20 },
    { id: 'db-service', label: 'DB Service', icon: <Database size={20} />, x: 80, y: 50 },
    { id: 'payment-service', label: 'Payment Service', icon: <CreditCard size={20} />, x: 80, y: 80 },
  ];

  const edges = [
    { from: 'frontend', to: 'api-gateway' },
    { from: 'api-gateway', to: 'auth-service' },
    { from: 'api-gateway', to: 'db-service' },
    { from: 'api-gateway', to: 'payment-service' },
  ];

  const getNodeState = (id) => {
    if (!affectedNodes.includes(id)) return 'healthy';
    return severityLevel;
  };

  const getColors = (state) => {
    switch(state) {
      case 'escalated': return { border: 'border-neon-purple', bg: 'bg-neon-purple/20', text: 'text-neon-purple', shadow: 'shadow-[0_0_20px_rgba(176,38,255,0.6)]' };
      case 'critical': return { border: 'border-neon-pink', bg: 'bg-neon-pink/20', text: 'text-neon-pink', shadow: 'shadow-[0_0_20px_rgba(255,0,85,0.6)]' };
      case 'warning': return { border: 'border-yellow-400', bg: 'bg-yellow-400/20', text: 'text-yellow-400', shadow: 'shadow-[0_0_20px_rgba(250,204,21,0.6)]' };
      default: return { border: 'border-neon-cyan/30', bg: 'bg-black/50', text: 'text-neon-cyan', shadow: 'shadow-none' };
    }
  };

  return (
    <div className="glass-panel border border-white/5 rounded-xl flex flex-col h-full overflow-hidden relative">
      <div className="bg-black/50 border-b border-white/5 px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
          <Activity size={18} className="text-neon-cyan" />
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">Live Blast Radius Topology</h2>
        </div>
        <span className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${severityLevel === 'healthy' ? 'bg-neon-green' : 'bg-neon-pink animate-ping'}`}></span>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            {severityLevel === 'healthy' ? 'System Nominal' : 'Active Anomaly'}
          </span>
        </span>
      </div>

      {/* Live Event Feed Banner (Replaces top overlay) */}
      {activeIncidents && activeIncidents.length > 0 && (
        <div className="bg-neon-pink/5 border-b border-white/5 px-6 py-2 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <Activity size={12} className="text-neon-cyan animate-pulse shrink-0" />
            <span className="text-[11px] font-mono text-gray-300 truncate">
              <span className="text-neon-pink font-bold">{activeIncidents[0].incident_id.split('-')[0]}</span>: {activeIncidents[0].timeline_events && activeIncidents[0].timeline_events.length > 0 ? activeIncidents[0].timeline_events[activeIncidents[0].timeline_events.length - 1].event : "Detecting anomaly signature..."}
            </span>
          </div>
          {activeIncidents[0].executed_action && (
            <div className="ml-4 text-[9px] font-bold tracking-widest text-yellow-400 uppercase border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 rounded shrink-0 animate-pulse">
              {activeIncidents[0].executed_action}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 relative w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-cyan/5 via-black to-black p-8 min-h-[300px]">
        
        {/* Draw Edges (SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {edges.map((edge, i) => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            
            const isAffectedPath = affectedNodes.includes(edge.from) || affectedNodes.includes(edge.to);
            
            return (
              <g key={i}>
                <line 
                  x1={`${fromNode.x}%`} y1={`${fromNode.y}%`} 
                  x2={`${toNode.x}%`} y2={`${toNode.y}%`} 
                  stroke={isAffectedPath && severityLevel !== 'healthy' ? 'rgba(255,0,85,0.4)' : 'rgba(0,240,255,0.2)'} 
                  strokeWidth="2" 
                />
                {isAffectedPath && severityLevel !== 'healthy' && (
                  <circle r="3" fill="#ff0055">
                    <animateMotion dur="1s" repeatCount="indefinite" path={`M ${fromNode.x*8} ${fromNode.y*4} L ${toNode.x*8} ${toNode.y*4}`} />
                    {/* SVG animateMotion usually needs absolute pixels, so we simulate the pulse via css classes on the lines instead */}
                  </circle>
                )}
              </g>
            )
          })}
        </svg>

        {/* Draw Nodes */}
        {nodes.map(node => {
          const state = getNodeState(node.id);
          const colors = getColors(state);
          const isPulsing = state !== 'healthy';

          return (
            <motion.div
              key={node.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-10`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className={`w-14 h-14 rounded-full border-2 ${colors.border} ${colors.bg} flex items-center justify-center backdrop-blur-md transition-all duration-500 ${colors.shadow}`}>
                {isPulsing && (
                  <span className={`absolute inset-0 rounded-full animate-ping opacity-75 ${colors.bg}`}></span>
                )}
                <span className={colors.text}>{node.icon}</span>
              </div>
              <span className={`mt-3 text-[10px] font-bold font-mono tracking-wider uppercase bg-black/60 px-2 py-1 rounded border border-white/5 ${isPulsing ? colors.text : 'text-gray-400'}`}>
                {node.label}
              </span>
            </motion.div>
          )
        })}
        {/* Horizontal Legend Overlay */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/80 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 z-30 shadow-[0_0_20px_rgba(0,0,0,0.8)] whitespace-nowrap">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold hidden sm:inline-block">Status:</span>
          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-gray-300"><span className="w-2 h-2 rounded-full border border-neon-cyan/50 bg-black/50"></span><span>Healthy</span></div>
          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-yellow-400"><span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)] animate-pulse"></span><span>Warning</span></div>
          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-neon-pink"><span className="w-2 h-2 rounded-full bg-neon-pink shadow-[0_0_8px_rgba(255,0,85,0.6)] animate-pulse"></span><span>Critical</span></div>
          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-neon-purple"><span className="w-2 h-2 rounded-full bg-neon-purple shadow-[0_0_8px_rgba(176,38,255,0.6)] animate-pulse"></span><span>Escalated</span></div>
        </div>
      </div>
    </div>
  );
}
