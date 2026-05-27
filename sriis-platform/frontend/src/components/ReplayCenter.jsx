import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, X, FastForward, BrainCircuit, ActivitySquare, ShieldCheck } from 'lucide-react';

const ReplayCenter = ({ incidentId, onClose }) => {
  const [replayEvents, setReplayEvents] = useState([]);
  const [replaySpeed, setReplaySpeed] = useState(1.0);
  const [incidentData, setIncidentData] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:8000/replay');

    socketRef.current.on('connect', () => {
      socketRef.current.emit('start_replay', { incident_id: incidentId, speed: replaySpeed });
    });

    socketRef.current.on('replay_started', (data) => {
      setIncidentData(data.incident);
      setReplayEvents([]);
      setIsCompleted(false);
    });

    socketRef.current.on('replay_event', (event) => {
      setReplayEvents(prev => [...prev, event]);
    });

    socketRef.current.on('replay_completed', () => {
      setIsCompleted(true);
    });

    socketRef.current.on('replay_error', (data) => {
      console.error("Replay error:", data.message);
      setIsCompleted(true);
    });

    return () => {
      socketRef.current.emit('stop_replay', { incident_id: incidentId });
      socketRef.current.disconnect();
    };
  }, [incidentId]);

  const changeSpeed = (speed) => {
    setReplaySpeed(speed);
    socketRef.current.emit('start_replay', { incident_id: incidentId, speed: speed });
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4 md:p-8"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-6xl glass-panel border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col h-[90vh] relative"
        >
          {/* REPLAY MODE OVERLAY */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-50 pointer-events-none">
            <div className="bg-red-950/80 border border-red-500/50 px-8 py-2 rounded-full shadow-[0_0_30px_rgba(255,0,0,0.4)] animate-pulse flex items-center space-x-3 backdrop-blur-md">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(255,0,0,1)]"></div>
              <span className="text-red-400 font-bold tracking-[0.3em] uppercase text-sm">Forensic Replay Mode Active</span>
            </div>
          </div>

          {/* Neon Top Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50"></div>

          {/* Header */}
          <div className="bg-black/60 border-b border-white/5 p-5 flex justify-between items-center z-10">
            <div className="flex items-center space-x-4">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-neon-cyan/10 border border-neon-cyan/30">
                <span className="absolute inset-0 rounded-full border border-neon-cyan animate-ping opacity-50"></span>
                <PlayCircle className="text-neon-cyan relative z-10" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-100 uppercase tracking-widest flex items-center">
                  Cinematic Replay
                </h2>
                <p className="text-neon-cyan text-xs font-mono tracking-wider">INCIDENT_ID: {incidentId.split('-')[0]}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Speed Controls */}
              <div className="flex items-center bg-black/40 rounded-lg border border-white/10 p-1">
                <FastForward size={14} className="text-gray-500 mx-2" />
                {[0.5, 1.0, 2.0, 5.0].map(speed => (
                  <button
                    key={speed}
                    onClick={() => changeSpeed(speed)}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                      replaySpeed === speed 
                        ? 'bg-neon-cyan text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
              
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-neon-pink/20 hover:text-neon-pink border border-transparent hover:border-neon-pink/50 flex items-center justify-center transition-all group"
              >
                <X size={20} className="text-gray-400 group-hover:text-neon-pink" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col relative bg-black/40">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="flex-1 overflow-y-auto p-8 relative z-10 scrollbar-hide">
              {incidentData && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-10 bg-cyber-card border border-white/5 p-6 rounded-xl shadow-lg backdrop-blur-md"
                >
                  <h3 className="text-sm font-bold text-neon-purple mb-4 uppercase tracking-widest flex items-center">
                    <BrainCircuit size={16} className="mr-2" /> AI Root Cause Analysis (Snapshot)
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-lg font-sans mb-6">
                    {incidentData.root_cause}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/50 border border-white/5 p-4 rounded-lg flex items-center">
                      <ActivitySquare size={24} className="text-neon-pink mr-4" />
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase tracking-widest font-bold">Root Dependency</span>
                        <span className="text-neon-pink font-mono text-lg">{incidentData.root_dependency || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="bg-black/50 border border-white/5 p-4 rounded-lg flex items-center">
                      <ShieldCheck size={24} className="text-neon-green mr-4" />
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase tracking-widest font-bold">Recommended Action</span>
                        <span className="text-neon-green font-mono text-lg">{incidentData.recommended_action}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Cinematic Timeline */}
              <div className="relative pl-8 md:pl-12 max-w-4xl mx-auto">
                <div className="absolute left-0 top-2 bottom-0 w-[2px] bg-gradient-to-b from-neon-cyan/50 to-transparent"></div>

                <AnimatePresence>
                  {replayEvents.map((ev, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ type: 'spring', damping: 20 }}
                      className="relative mb-8"
                    >
                      <div className="absolute -left-[37px] md:-left-[53px] top-1.5 w-5 h-5 rounded-full bg-cyber-bg border-2 border-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.6)] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-ping"></div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-1">
                        <div className="text-xs font-bold text-gray-500 font-mono tracking-wider bg-black/40 px-2 py-1 rounded border border-white/5">
                          {ev.time}
                        </div>
                      </div>
                      
                      <div className={`text-xl md:text-2xl font-light tracking-wide ${
                        ev.event.includes('Approved') || ev.event.includes('successful') ? 'text-neon-green drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]' :
                        ev.event.includes('Rejected') || ev.event.includes('failed') ? 'text-neon-pink drop-shadow-[0_0_8px_rgba(255,0,85,0.4)]' :
                        'text-neon-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                      }`}>
                        {ev.event}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {!isCompleted && replayEvents.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}
                    className="relative mt-8"
                  >
                    <div className="absolute -left-[37px] md:-left-[53px] top-2 w-5 h-5 rounded-full bg-black border-2 border-gray-600"></div>
                    <div className="text-lg font-mono text-gray-500 animate-pulse tracking-widest uppercase">Awaiting Next Sequence...</div>
                  </motion.div>
                )}
                
                {isCompleted && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative mt-12 bg-neon-green/10 border border-neon-green/30 p-6 rounded-xl inline-block"
                  >
                    <div className="absolute -left-[37px] md:-left-[53px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-neon-green border-2 border-neon-green shadow-[0_0_20px_rgba(0,255,102,1)]"></div>
                    <div className="text-2xl font-bold text-neon-green uppercase tracking-widest flex items-center">
                      Replay Sequence Completed
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReplayCenter;
