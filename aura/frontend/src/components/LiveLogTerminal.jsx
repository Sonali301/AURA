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

  const getLogColor = (level) => {
    if (level === 'ERROR' || level === 'CRITICAL') return 'text-neon-pink';
    if (level === 'WARN' || level === 'WARNING') return 'text-yellow-400';
    return 'text-neon-cyan';
  };

  return (
    <div className="glass-panel border border-white/5 rounded-xl flex flex-col h-full relative overflow-hidden group">
      
      {/* Subtle CRT Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-5 group-hover:opacity-10 transition-opacity" 
           style={{
             backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.2) 1px, transparent 1px)',
             backgroundSize: '100% 3px'
           }} 
      />

      {/* Terminal Header */}
      <div className="bg-black/60 border-b border-white/10 px-4 py-2 flex items-center justify-between z-20 shrink-0">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center">
          <Terminal className="mr-2 text-neon-cyan" size={14} /> Global Telemetry Feed
        </h3>
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
          </span>
          <span className="text-[10px] text-neon-cyan uppercase tracking-widest font-bold">Live Stream</span>
        </div>
      </div>

      {/* Log Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px] md:text-xs scroll-smooth scrollbar-hide bg-[#050505] z-20 relative"
      >
        <AnimatePresence initial={false}>
          {logs.map((log, i) => {
            const isError = log.level === 'ERROR' || log.level === 'CRITICAL';
            const isWarn = log.level === 'WARN' || log.level === 'WARNING';
            
            return (
              <motion.div
                key={log.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start space-x-3 hover:bg-white/5 p-1 rounded transition-colors`}
              >
                <span className="text-gray-600 shrink-0 select-none opacity-70">
                  [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 })}]
                </span>
                
                <span className={`shrink-0 font-bold px-1 rounded ${
                  isError ? 'bg-red-900/30 text-neon-pink' : 
                  isWarn ? 'bg-yellow-900/20 text-yellow-500' : 
                  'text-neon-cyan'
                }`}>
                  [{log.level}]
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
