import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TerminalSquare, AlertTriangle, ShieldAlert, Zap, Cpu, Flame, ServerCrash } from 'lucide-react';

const scenarios = [
  { id: 'db-timeout', label: 'DB Timeout', icon: ShieldAlert, color: 'neon-pink', hoverClass: 'hover:bg-neon-pink/20 hover:border-neon-pink/50 hover:shadow-[0_0_15px_rgba(255,0,85,0.4)]' },
  { id: 'api-crash', label: 'API Crash', icon: Flame, color: 'orange-500', hoverClass: 'hover:bg-orange-500/20 hover:border-orange-500/50 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]' },
  { id: 'canary-failure', label: 'Canary Failure', icon: Cpu, color: 'neon-purple', hoverClass: 'hover:bg-neon-purple/20 hover:border-neon-purple/50 hover:shadow-[0_0_15px_rgba(176,38,255,0.4)]' },
  { id: 'latency-spike', label: 'Latency Spike', icon: Zap, color: 'yellow-400', hoverClass: 'hover:bg-yellow-400/20 hover:border-yellow-400/50 hover:shadow-[0_0_15px_rgba(250,204,21,0.4)]' },
  { id: 'auth-failure', label: 'Auth Brute-Force', icon: AlertTriangle, color: 'neon-pink', hoverClass: 'hover:bg-neon-pink/20 hover:border-neon-pink/50 hover:shadow-[0_0_15px_rgba(255,0,85,0.4)]' },
  { id: 'traffic-surge', label: 'Traffic Surge', icon: Activity => <Zap size={18} />, color: 'neon-cyan', hoverClass: 'hover:bg-neon-cyan/20 hover:border-neon-cyan/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]' }
];

export default function SimulationControlPanel() {
  const [severity, setSeverity] = useState('critical');
  const [duration, setDuration] = useState(20);
  const [activeSimulation, setActiveSimulation] = useState(null);

  const simulateFailure = (scenario) => {
    setActiveSimulation(scenario);
    fetch(`http://localhost:8000/api/simulate/${scenario}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ severity, duration })
    })
      .then(res => res.json())
      .then(() => {
        setTimeout(() => setActiveSimulation(null), duration * 1000);
      })
      .catch(err => {
        console.error(err);
        setActiveSimulation(null);
      });
  };

  return (
    <div className="glass-panel border border-white/5 p-5 rounded-xl mb-6 relative overflow-hidden">
      {/* Background Warning Stripes if active */}
      {activeSimulation && (
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ff0055 0px, #ff0055 10px, transparent 10px, transparent 20px)' }}>
        </div>
      )}

      {/* Danger glow background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/5 to-transparent pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-neon-pink/20 blur-[50px] rounded-full pointer-events-none group-hover:bg-neon-pink/30 transition-colors" />

      <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-4 flex items-center relative z-10">
        <ServerCrash className="mr-2 text-neon-pink" size={14} /> Chaos Engineering Console
      </h3>
      
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-5 relative z-10">
          <div className="flex flex-col space-y-1">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-2">Impact Level</label>
            <div className="relative">
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-neon-pink/50 appearance-none transition-colors"
              >
                <option value="warning">WARNING</option>
                <option value="major">MAJOR</option>
                <option value="critical">CRITICAL</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-gray-500 uppercase tracking-widest text-[9px]">Chaos Duration (sec)</label>
            <input 
              type="number" 
              value={duration} 
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="bg-black/60 border border-white/10 text-white rounded px-3 py-1.5 w-20 focus:border-neon-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-all"
              min="5" max="60"
            />
          </div>
        </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
        {scenarios.map(s => {
          const isActive = activeSimulation === s.id;
          const isDisabled = activeSimulation !== null && !isActive;
          const Icon = typeof s.icon === 'function' ? Zap : s.icon; // Quick fix for traffic surge

          return (
            <motion.button
              key={s.id}
              whileHover={!isDisabled && !isActive ? { scale: 1.02, y: -2 } : {}}
              whileTap={!isDisabled ? { scale: 0.95 } : {}}
              onClick={() => simulateFailure(s.id)}
              disabled={activeSimulation !== null}
              className={`relative py-3 px-4 rounded-lg flex flex-col items-center justify-center space-y-2 text-xs font-bold font-mono transition-all duration-300 overflow-hidden ${
                isActive 
                  ? 'bg-red-950/80 border-red-500 text-white shadow-[0_0_20px_rgba(255,0,85,0.6)]' 
                  : isDisabled 
                    ? 'bg-black/40 border-white/5 text-gray-600 cursor-not-allowed'
                    : `bg-black/60 border-white/10 text-gray-300 cursor-pointer ${s.hoverClass}`
              } border`}
            >
              {isActive && (
                <motion.div 
                  className="absolute inset-0 bg-red-500/20"
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
              <Icon size={18} className={`relative z-10 ${isActive ? 'text-white' : `text-${s.color}`}`} />
              <span className="relative z-10 text-center tracking-wider text-[10px] uppercase">{isActive ? 'Injecting...' : s.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
