import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, ShieldAlert, ShieldCheck, Terminal, GitMerge } from 'lucide-react';

export default function AutonomousDecisionTrace({ incident }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isApproved = incident.action_status?.includes("Approved");
  // If it requires human approval or is escalated, it's blocked from autonomous execution
  const isBlocked = incident.action_status?.includes("Rejected") || incident.action_status?.includes("Requires Human") || incident.status === "Escalated";

  const confScore = incident.confidence_score * 100 || 0;
  let confColor = 'neon-pink';
  let confGlow = 'rgba(255,0,85,0.8)';
  if (confScore >= 90) {
    confColor = 'neon-green';
    confGlow = 'rgba(0,255,102,0.8)';
  } else if (confScore >= 70) {
    confColor = 'yellow-400';
    confGlow = 'rgba(250,204,21,0.8)';
  }

  // Mocked AI Thought Timeline (derived from timestamps)
  const generateTimeline = () => {
    const timeStr = incident.timeline_events?.[0]?.time || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    return [
      { time: timeStr, event: "Anomaly cluster detected across telemetry streams" },
      { time: timeStr, event: "Distributed trace correlation engine activated" },
      { time: timeStr, event: "Pinecone semantic memory queried for historical resolution" },
      { time: timeStr, event: incident.pinecone_matches?.length ? "Similar historical incidents found" : "No similar historical incidents found" },
      { time: timeStr, event: "Groq LPU reasoning synthesis completed" },
      { time: timeStr, event: "Safety validation guardrails checked" },
      { time: timeStr, event: isApproved ? "Autonomous execution approved" : "Execution blocked by safety policy" }
    ];
  };

  const thoughtTimeline = generateTimeline();

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs font-mono text-neon-cyan hover:text-white flex items-center transition-colors px-3 py-1.5 rounded border border-neon-cyan/20 bg-neon-cyan/5 hover:bg-neon-cyan/10 shadow-[0_0_10px_rgba(0,240,255,0.1)]"
      >
        {isExpanded ? '[-] CLOSE DECISION TRACE' : '[+] VIEW AUTONOMOUS DECISION TRACE'}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-4 space-y-4"
          >
            <div className="p-5 bg-black/60 border border-white/10 rounded-lg shadow-inner">
              
              {/* 1. VECTOR MEMORY PANEL */}
              <div className="mb-6">
                <h4 className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-2 flex items-center">
                  <Database size={12} className="mr-2 text-neon-purple" /> Retrieved Historical Incidents
                </h4>
                {incident.pinecone_matches && incident.pinecone_matches.length > 0 ? (
                  <div className="space-y-2">
                    {incident.pinecone_matches.map((match, i) => (
                      <div key={i} className="bg-white/[0.02] border border-neon-purple/20 p-2.5 rounded flex justify-between items-center shadow-[0_0_10px_rgba(176,38,255,0.05)]">
                        <div className="text-xs text-gray-300 font-mono">
                          <span className="text-neon-purple font-bold mr-2 drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]">{match.score}% Similar</span>
                          — {match.action}
                        </div>
                        <span className="text-[9px] uppercase tracking-wider text-neon-green bg-neon-green/10 px-2 py-0.5 rounded border border-neon-green/20">
                          {match.resolution || 'Successful'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 font-mono italic p-2 bg-white/[0.02] rounded border border-white/5">
                    No relevant historical incidents found in semantic memory.
                  </div>
                )}
              </div>

              {/* 2. AI COGNITIVE ANALYSIS PANEL */}
              <div className="mb-6 relative">
                <h4 className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-2 flex items-center">
                  <Terminal size={12} className="mr-2 text-neon-cyan" /> Cognitive Analysis Trace
                </h4>
                <div className="bg-[#050510] border border-neon-cyan/30 p-4 rounded font-mono relative overflow-hidden group shadow-[0_0_15px_rgba(0,240,255,0.05)]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-2xl group-hover:bg-neon-cyan/10 transition-all"></div>
                  
                  {/* Radial Confidence Meter */}
                  <div className="absolute right-4 top-4 flex flex-col items-center">
                    <div className="relative w-14 h-14 flex items-center justify-center mb-1">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/10" strokeWidth="2.5" />
                        <motion.circle 
                          cx="18" cy="18" r="16" fill="none" 
                          className={`stroke-${confColor}`} strokeWidth="2.5"
                          strokeDasharray="100"
                          initial={{ strokeDashoffset: 100 }}
                          animate={{ strokeDashoffset: 100 - confScore }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                          style={{ filter: `drop-shadow(0 0 6px ${confGlow})` }}
                        />
                      </svg>
                      <span className={`absolute text-[11px] font-bold text-${confColor}`} style={{ filter: `drop-shadow(0 0 8px ${confGlow})` }}>
                        {confScore.toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">Confidence</span>
                  </div>

                  <div className="pr-24">
                    <div className="text-xs text-neon-cyan/70 mb-2">&gt; Analyzing anomaly cluster...</div>
                    <p className="text-sm text-gray-300 leading-relaxed mb-3 whitespace-pre-wrap">
                      {incident.root_cause || "Analyzing telemetry... Root cause synthesis pending."}
                    </p>
                    {incident.action_reason && (
                      <div className="bg-white/5 border border-white/10 p-2 rounded mb-4">
                        <span className="text-[9px] text-neon-purple uppercase font-bold tracking-wider mb-1 block">Reasoning Core:</span>
                        <p className="text-xs text-gray-400 font-mono italic">{incident.action_reason}</p>
                      </div>
                    )}
                    <div className="flex space-x-6 border-t border-neon-cyan/20 pt-3">
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase">Blast Radius:</span>
                        <span className="text-xs text-white ml-1.5 font-bold">{incident.affected_services?.length || 1} System(s)</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase">Proposed Action:</span>
                        <span className="text-xs text-yellow-400 ml-1.5 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">{incident.recommended_action}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. SAFETY ENGINE PANEL */}
              <div className="mb-6">
                <h4 className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-2 flex items-center">
                  <ShieldCheck size={12} className="mr-2 text-white/50" /> Safety Engine Validation
                </h4>
                {isApproved ? (
                  <div className="bg-neon-green/10 border border-neon-green/30 p-3.5 rounded flex items-start space-x-3 shadow-[0_0_15px_rgba(0,255,102,0.1)]">
                    <ShieldCheck size={18} className="text-neon-green mt-0.5 drop-shadow-[0_0_8px_rgba(0,255,102,0.8)]" />
                    <div>
                      <div className="text-xs font-bold text-neon-green uppercase tracking-wide mb-1 drop-shadow-[0_0_8px_rgba(0,255,102,0.8)]">✔ Action Approved</div>
                      <div className="text-xs text-gray-300 font-mono leading-relaxed">
                        {incident.validation_reason || "Confidence threshold satisfied. Action present in approved recovery allowlist."}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neon-pink/10 border border-neon-pink/30 p-3.5 rounded flex items-start space-x-3 shadow-[0_0_15px_rgba(255,0,85,0.1)]">
                    <ShieldAlert size={18} className="text-neon-pink mt-0.5 drop-shadow-[0_0_8px_rgba(255,0,85,0.8)]" />
                    <div>
                      <div className="text-xs font-bold text-neon-pink uppercase tracking-wide mb-1 drop-shadow-[0_0_8px_rgba(255,0,85,0.8)]">⚠ Action Rejected</div>
                      <div className="text-xs text-gray-300 font-mono leading-relaxed">
                        {incident.validation_reason || "Action deemed too risky by safety guardrails. Escalated for human review."}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. AI THOUGHT TIMELINE */}
              <div>
                <h4 className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-2 flex items-center">
                  <GitMerge size={12} className="mr-2 text-white/50" /> Cognitive Pipeline
                </h4>
                <div className="bg-black/40 border border-white/5 p-3.5 rounded space-y-2">
                  {thoughtTimeline.map((ev, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.4 + 0.3 }}
                      className="flex text-[11px] font-mono items-center"
                    >
                      <span className="text-gray-500 w-12 shrink-0">{ev.time}</span>
                      <span className="text-white/20 mx-2 text-xs">→</span>
                      <span className="text-neon-cyan mr-1.5 text-[9px] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">[✓]</span>
                      <span className={`text-gray-400 ${i === thoughtTimeline.length - 1 ? (isApproved ? 'text-neon-green font-bold drop-shadow-[0_0_5px_rgba(0,255,102,0.8)]' : 'text-neon-pink font-bold drop-shadow-[0_0_5px_rgba(255,0,85,0.8)]') : ''}`}>
                        {ev.event}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
