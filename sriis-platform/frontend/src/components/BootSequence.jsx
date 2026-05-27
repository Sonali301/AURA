import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const bootMessages = [
  "Initializing telemetry pipeline...",
  "Connecting vector memory...",
  "Loading autonomous recovery engine...",
  "Synchronizing incident graph...",
  "AI systems online."
];

export default function BootSequence({ onComplete }) {
  useEffect(() => {
    // Total sequence is roughly 2.2 seconds to respect the 1.5-2.5s golden rule.
    const timer = setTimeout(() => {
      onComplete();
    }, 2200);
    return () => clearTimeout(timer);
  }, []); // Empty dependency array so it never resets!

  return (
    <div className="fixed inset-0 bg-[#020617] z-[200] flex flex-col items-center justify-center overflow-hidden">
      
      {/* Subtle Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10" 
           style={{
             backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px)',
             backgroundSize: '100% 3px'
           }} 
      />

      {/* Ambient background glow */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute w-[600px] h-[600px] bg-neon-cyan/20 blur-[120px] rounded-full pointer-events-none"
      />

      <div className="relative z-20 w-full max-w-2xl px-8 flex flex-col font-mono text-sm tracking-wider">
        {bootMessages.map((msg, idx) => {
          const isLast = idx === bootMessages.length - 1;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: idx * 0.35, 
                duration: 0.2,
                ease: "easeOut"
              }}
              className={`flex items-center space-x-3 my-1.5 ${isLast ? 'text-neon-green mt-6 font-bold text-base' : 'text-neon-cyan'}`}
            >
              <span className="text-gray-500 opacity-50">&gt;</span>
              <span>{msg}</span>
              {!isLast && (
                <motion.span 
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-2 h-4 bg-neon-cyan inline-block ml-2"
                />
              )}
            </motion.div>
          );
        })}

        {/* Global Progress Bar */}
        <motion.div 
          className="w-full h-1 bg-white/5 rounded-full mt-10 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="h-full bg-neon-cyan shadow-[0_0_10px_#00f0ff]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
