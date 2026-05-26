import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Filter, Search } from 'lucide-react';

export default function LiveLogTerminal({ logs }) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom smoothly
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-panel border border-white/5 rounded-xl flex flex-col h-full overflow-hidden relative">
      
      {/* Terminal Header */}
      <div className="bg-black/50 border-b border-white/5 px-4 py-3 flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
          <Terminal size={16} className="text-gray-400" />
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-mono">Live Telemetry Feed</h2>
          <span className="flex h-2 w-2 ml-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
          </span>
        </div>
        
        {/* Terminal Controls */}
        <div className="flex items-center space-x-3 text-gray-500">
          <button className="hover:text-neon-cyan transition-colors"><Filter size={14} /></button>
          <button className="hover:text-neon-cyan transition-colors"><Search size={14} /></button>
        </div>
      </div>

      {/* Log Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px] md:text-xs scroll-smooth scrollbar-hide bg-black/80"
        style={{ scrollBehavior: 'smooth' }}
      >
        <AnimatePresence initial={false}>
          {logs.map((log, i) => {
            const isError = log.level === 'ERROR' || log.level === 'CRITICAL';
            const isWarn = log.level === 'WARN';
            
            return (
              <motion.div
                key={log.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex space-x-3 hover:bg-white/5 p-1 rounded transition-colors border-l-2 ${
                  isError ? 'border-neon-pink text-gray-300' :
                  isWarn ? 'border-yellow-400 text-gray-300' :
                  'border-transparent text-gray-400'
                }`}
              >
                <span className="text-gray-600 shrink-0 select-none">
                  [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 })}]
                </span>
                
                <span className={`shrink-0 w-16 font-bold ${
                  isError ? 'text-neon-pink drop-shadow-[0_0_5px_rgba(255,0,85,0.8)]' : 
                  isWarn ? 'text-yellow-400' : 
                  'text-neon-cyan'
                }`}>
                  {log.level}
                </span>
                
                <span className="text-gray-500 shrink-0 w-24 truncate" title={log.service}>
                  {log.service}
                </span>
                
                <span className={`break-all ${isError ? 'text-white' : ''}`}>
                  {log.message}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-3">
            <Terminal size={32} className="opacity-20" />
            <p className="uppercase tracking-widest text-xs">Waiting for telemetry...</p>
          </div>
        )}
      </div>

      {/* Bottom overlay gradient for smooth fade */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
    </div>
  );
}
