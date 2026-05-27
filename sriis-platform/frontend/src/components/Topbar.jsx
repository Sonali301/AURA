import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Activity, ShieldCheck, ShieldAlert, Cpu, WifiOff } from 'lucide-react';

export default function Topbar({ isConnected = true }) {
  const [latency, setLatency] = useState(12);

  useEffect(() => {
    if (!isConnected) return;
    
    // Simulate realistic network latency fluctuations between 8ms and 24ms
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * (24 - 8 + 1)) + 8);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [isConnected]);
  return (
    <div className="h-16 border-b border-white/5 glass-panel flex items-center justify-between px-6 sticky top-0 z-40 shrink-0">
      
      {/* Search / Breadcrumb (Simulated) */}
      <div className="flex items-center text-gray-400 text-sm font-mono tracking-wider">
        <span className="text-neon-cyan font-bold drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]">GLOBAL COMMAND CENTER</span>
        <span className="mx-4 text-gray-600">|</span>
        <span className="text-white text-[10px] bg-white/5 px-2 py-1 rounded border border-white/10 flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse mr-2"></span>
          UTC {new Date().toISOString().substring(11, 16)}
        </span>
      </div>

      {/* AI Status Banner */}
      <div className="flex items-center space-x-6">
        
        {isConnected ? (
          <>
            {/* Recovery Engine Status */}
            <div className="flex items-center space-x-2 bg-green-950/30 border border-green-500/20 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(0,255,102,0.1)]">
              <ShieldCheck size={14} className="text-neon-green" />
              <span className="text-xs font-bold text-neon-green tracking-wide">Recovery Engine Active</span>
            </div>

            {/* AI Operational Pulse */}
            <div className="flex items-center space-x-2 bg-blue-950/30 border border-neon-cyan/20 px-3 py-1.5 rounded-full relative overflow-hidden group">
              <motion.div 
                className="absolute top-0 bottom-0 w-8 bg-neon-cyan/20 blur-md skew-x-[-20deg]"
                animate={{ left: ['-100%', '200%'] }}
                transition={{ duration: 3, ease: 'linear', repeat: Infinity, repeatDelay: 2 }}
              />
              <BrainCircuit size={14} className="text-neon-cyan relative z-10 group-hover:animate-pulse" />
              <span className="text-xs font-bold text-neon-cyan tracking-wide relative z-10">AI Operational</span>
            </div>
            
            {/* Resource Monitor Mini */}
            <div className="flex items-center space-x-3 pl-4 border-l border-white/10 text-gray-400">
              <div className="flex flex-col items-end w-12">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Latency</span>
                <span className="text-xs font-mono font-bold text-gray-200">{latency}ms</span>
              </div>
              <Cpu size={16} className="text-gray-500" />
            </div>
          </>
        ) : (
          <div className="flex items-center space-x-2 bg-red-950/40 border border-neon-pink/40 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(255,0,85,0.3)] animate-pulse">
            <ShieldAlert size={14} className="text-neon-pink" />
            <span className="text-xs font-bold text-neon-pink tracking-wide">SYSTEM OFFLINE: BACKEND DISCONNECTED</span>
            <WifiOff size={14} className="text-neon-pink ml-2" />
          </div>
        )}

      </div>
    </div>
  );
}
