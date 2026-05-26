import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle, AlertOctagon, ShieldAlert, Zap, BrainCircuit, Filter } from 'lucide-react';

export default function IncidentTimeline({ incidents, onHeal, onReplay }) {
  const [filter, setFilter] = useState('All');

  const filteredIncidents = incidents.filter(inc => {
    if (filter === 'All') return true;
    if (filter === 'Active') return inc.status === 'Active' || inc.status === 'Recovering';
    if (filter === 'Escalated') return inc.status === 'Escalated';
    if (filter === 'Resolved') return inc.status === 'Resolved';
    return true;
  });

  return (
    <div className="glass-panel border border-white/5 rounded-xl flex flex-col h-full overflow-hidden">
      
      <div className="bg-black/50 border-b border-white/5 px-6 py-4 flex flex-col z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Activity size={18} className="text-neon-cyan" />
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">Incident Intelligence Timeline</h2>
          </div>
          <span className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gray-300 font-mono">
            {filteredIncidents.length} Records
          </span>
        </div>
        
        {/* Filtering Tabs */}
        <div className="flex space-x-2 border-b border-white/10 pb-1">
          {['All', 'Active', 'Escalated', 'Resolved'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-t-lg text-[10px] uppercase font-bold tracking-widest transition-colors ${
                filter === tab 
                  ? tab === 'Active' ? 'text-yellow-400 border-b-2 border-yellow-400 bg-yellow-400/5'
                  : tab === 'Escalated' ? 'text-neon-pink border-b-2 border-neon-pink bg-neon-pink/5'
                  : tab === 'Resolved' ? 'text-neon-green border-b-2 border-neon-green bg-neon-green/5'
                  : 'text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5'
                : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative bg-black/40">
        {/* Timeline Line */}
        <div className="absolute left-10 top-0 bottom-0 w-[2px] bg-gradient-to-b from-neon-cyan/50 via-neon-purple/20 to-transparent"></div>

        <AnimatePresence>
          {filteredIncidents.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-40 text-gray-600 space-y-3">
              <ShieldAlert size={32} className="opacity-20" />
              <p className="uppercase tracking-widest text-xs">No incidents found in this category</p>
            </motion.div>
          ) : (
            filteredIncidents.map((inc, index) => {
              const isResolved = inc.status === 'Resolved';
              const isEscalated = inc.status === 'Escalated';
              const isActive = inc.status === 'Active';
              const isRecovering = inc.status === 'Recovering';
              
              const statusColor = isResolved ? 'text-neon-green' : isEscalated ? 'text-neon-pink' : isActive ? 'text-yellow-400' : 'text-neon-cyan';
              const borderColor = isResolved ? 'border-neon-green/30' : isEscalated ? 'border-neon-pink/50 neon-glow-red' : isActive ? 'border-yellow-400/50 neon-glow-yellow' : 'border-neon-cyan/30 neon-glow-cyan';
              const bgGradient = isResolved ? 'bg-gradient-to-r from-neon-green/5 to-transparent' : isEscalated ? 'bg-gradient-to-r from-neon-pink/10 to-transparent' : isActive ? 'bg-gradient-to-r from-yellow-400/10 to-transparent' : 'bg-gradient-to-r from-neon-cyan/5 to-transparent';

              return (
                <motion.div 
                  key={inc.incident_id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25, delay: index * 0.05 }}
                  className="relative pl-12"
                >
                  {/* Timeline Node */}
                  <div className={`absolute left-[-1.5rem] top-4 w-4 h-4 rounded-full border-2 bg-cyber-bg z-10 ${statusColor.replace('text-', 'border-')} shadow-[0_0_10px_currentColor] flex items-center justify-center`}>
                    {isRecovering && <span className="w-2 h-2 rounded-full bg-neon-cyan animate-ping"></span>}
                  </div>

                  <div className={`glass-card rounded-xl p-5 border-l-4 ${borderColor} ${bgGradient}`}>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-bold text-gray-100 font-mono tracking-tight">{inc.incident_id.split('-')[0]}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                            isResolved ? 'bg-neon-green/10 text-neon-green border-neon-green/20' :
                            isEscalated ? 'bg-neon-pink/10 text-neon-pink border-neon-pink/20' :
                            isActive ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' :
                            'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20'
                          }`}>
                            {inc.status || 'Active'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          Affected: <span className="text-gray-300">{inc.affected_services?.join(', ')}</span>
                        </div>
                      </div>
                      
                      <span className="bg-red-950/40 text-red-400 border border-red-500/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                        {inc.severity}
                      </span>
                    </div>
                    
                    {/* Root Cause Analysis */}
                    <div className="bg-black/40 border border-white/5 p-3 rounded-lg mb-4">
                      <h4 className="text-[10px] font-bold text-neon-purple mb-1 uppercase tracking-widest flex items-center">
                        <BrainCircuit size={12} className="mr-1" /> Groq AI Analysis
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed font-sans">{inc.root_cause}</p>
                    </div>
                    
                    {/* Actions and Status */}
                    <div className="flex justify-between items-end">
                      <div className="flex-1 mr-4">
                        <h4 className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-widest">AI Action Plan</h4>
                        <div className="flex items-center space-x-2">
                          <Zap size={14} className={statusColor} />
                          <span className="text-sm font-bold text-gray-200 font-mono">{inc.recommended_action || inc.recovery_action}</span>
                          {inc.confidence_score && (
                            <span className="text-xs text-gray-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                              {(inc.confidence_score * 100).toFixed(0)}% CONF
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dynamic Action Buttons */}
                      <div className="shrink-0">
                        {isResolved ? (
                          <div className="flex items-center space-x-2 text-neon-green bg-neon-green/10 px-4 py-2 rounded-lg border border-neon-green/20">
                            <CheckCircle size={16} />
                            <span className="text-xs font-bold tracking-wider uppercase">Resolved</span>
                          </div>
                        ) : isRecovering ? (
                          <div className="flex items-center space-x-2 text-neon-cyan bg-neon-cyan/10 px-4 py-2 rounded-lg border border-neon-cyan/20">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span className="text-xs font-bold tracking-wider uppercase">Recovering...</span>
                          </div>
                        ) : isActive && !inc.executed_action ? (
                          <button 
                            onClick={() => onHeal(inc.incident_id)}
                            className="flex items-center space-x-2 text-black bg-neon-cyan hover:bg-white px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_20px_rgba(255,255,255,0.6)]"
                          >
                            <Zap size={14} />
                            <span className="text-xs font-bold tracking-wider uppercase">Heal System</span>
                          </button>
                        ) : isEscalated ? (
                          <div className="flex items-center space-x-2 text-neon-pink bg-neon-pink/10 px-4 py-2 rounded-lg border border-neon-pink/20">
                            <AlertOctagon size={16} />
                            <span className="text-xs font-bold tracking-wider uppercase">Escalated</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Timeline Events for Recovering/Resolved */}
                    {inc.timeline_events && inc.timeline_events.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                          {inc.timeline_events.map((ev, i) => (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={i} 
                              className="flex items-start text-xs font-mono"
                            >
                              <span className="text-gray-500 w-16 shrink-0 pt-0.5">{ev.time}</span>
                              <span className="text-neon-purple shrink-0 mx-2 pt-0.5">→</span>
                              <span className={`text-gray-300 leading-relaxed ${ev.event.includes('Failed') ? 'text-neon-pink' : ''}`}>
                                {ev.event}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Replay Button for historical investigation */}
                    {isResolved && (
                      <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                        <button
                          onClick={() => onReplay(inc.incident_id)}
                          className="text-xs font-mono text-gray-400 hover:text-neon-cyan flex items-center transition-colors"
                        >
                          [ Initialize Replay ]
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
