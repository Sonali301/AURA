import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Activity, AlertTriangle, ShieldCheck, Zap, ShieldAlert, Cpu } from 'lucide-react';

function AnimatedNumber({ value }) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

export default function KPICards({ metrics, incidents = [] }) {
  const activeCount = incidents.filter(i => ['Active', 'Recovering', 'Validating'].includes(i.status)).length;
  const escalatedCount = incidents.filter(i => i.status === 'Escalated').length;
  const blockedCount = incidents.filter(i => i.status === 'Active' && i.action_status && i.action_status.includes('Blocked')).length;
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
    >
      
      {/* Requests / sec */}
      <motion.div variants={itemVariants} className="glass-panel border border-white/5 rounded-xl p-6 flex flex-col justify-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-3xl group-hover:bg-neon-cyan/10 transition-colors" />
        <div className="flex items-center text-gray-400 mb-2 z-10">
          <Activity size={16} className="mr-2 text-neon-cyan" />
          <span className="text-xs font-bold uppercase tracking-widest">Global Telemetry Rate</span>
        </div>
        <div className="text-4xl font-mono font-bold text-white z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
          <AnimatedNumber value={metrics.requestsPerSec} /><span className="text-xl text-gray-500"> req/s</span>
        </div>
      </motion.div>

      {/* Error Rate */}
      <motion.div variants={itemVariants} className="glass-card rounded-xl p-5 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-colors"></div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Error Rate</h3>
          <AlertTriangle size={16} className="text-yellow-400" />
        </div>
        <div className="flex items-end space-x-2">
          <motion.p 
            key={metrics.errorRate}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className={`text-3xl font-bold font-mono tracking-tight ${metrics.errorRate > 5 ? 'text-neon-pink drop-shadow-[0_0_8px_rgba(255,0,85,0.4)]' : 'text-yellow-400 drop-shadow-[0_0_8px_rgba(255,204,0,0.4)]'}`}
          >
            {metrics.errorRate}%
          </motion.p>
        </div>
      </motion.div>

      {/* Active Incidents */}
      <motion.div variants={itemVariants} className={`glass-panel border rounded-xl p-6 flex flex-col justify-center relative overflow-hidden transition-all duration-500 ${activeCount > 0 ? 'border-yellow-400/40 shadow-[0_0_20px_rgba(250,204,21,0.15)] bg-yellow-950/10' : 'border-white/5'}`}>
        {activeCount > 0 && <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/5 to-transparent pointer-events-none" />}
        <div className="flex items-center text-gray-400 mb-2 z-10">
          <ShieldAlert size={16} className={`mr-2 ${activeCount > 0 ? 'text-yellow-400 animate-pulse' : 'text-gray-500'}`} />
          <span className="text-xs font-bold uppercase tracking-widest">Active Anomalies</span>
        </div>
        <div className={`text-4xl font-mono font-bold z-10 ${activeCount > 0 ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]' : 'text-gray-300'}`}>
          <AnimatedNumber value={activeCount} />
        </div>
        {blockedCount > 0 && (
          <div className="mt-3 text-[10px] font-bold text-neon-pink flex items-center z-10 bg-neon-pink/10 px-2 py-1 rounded-full border border-neon-pink/30 animate-pulse self-start">
            <ShieldCheck size={10} className="mr-1" /> {blockedCount} Awaiting Human Approval
          </div>
        )}
      </motion.div>

      {/* Escalated Incidents */}
      <motion.div variants={itemVariants} className={`glass-panel border rounded-xl p-6 flex flex-col justify-center relative overflow-hidden transition-all duration-500 ${escalatedCount > 0 ? 'border-neon-pink/40 shadow-[0_0_20px_rgba(255,0,85,0.15)] bg-red-950/20' : 'border-white/5'}`}>
        {escalatedCount > 0 && <div className="absolute inset-0 bg-gradient-to-t from-neon-pink/10 to-transparent pointer-events-none animate-pulse" />}
        <div className="flex items-center text-gray-400 mb-2 z-10">
          <AlertTriangle size={16} className={`mr-2 ${escalatedCount > 0 ? 'text-neon-pink' : 'text-gray-500'}`} />
          <span className="text-xs font-bold uppercase tracking-widest">Escalated Anomalies</span>
        </div>
        <div className={`text-4xl font-mono font-bold z-10 ${escalatedCount > 0 ? 'text-neon-pink drop-shadow-[0_0_15px_rgba(255,0,85,0.8)]' : 'text-gray-300'}`}>
          <AnimatedNumber value={escalatedCount} />
        </div>
      </motion.div>

    </motion.div>
  );
}
