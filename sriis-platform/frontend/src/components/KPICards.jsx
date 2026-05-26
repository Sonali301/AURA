import React from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export default function KPICards({ metrics, activeIncidentsCount }) {
  
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
      <motion.div variants={itemVariants} className="glass-card rounded-xl p-5 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-neon-cyan/5 rounded-full blur-2xl group-hover:bg-neon-cyan/10 transition-colors"></div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Requests / sec</h3>
          <Activity size={16} className="text-neon-cyan" />
        </div>
        <div className="flex items-end space-x-2">
          <motion.p 
            key={metrics.requestsPerSec}
            initial={{ scale: 1.1, color: '#ffffff' }}
            animate={{ scale: 1, color: '#00f0ff' }}
            className="text-3xl font-bold font-mono text-neon-cyan tracking-tight drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]"
          >
            {metrics.requestsPerSec}
          </motion.p>
          <span className="text-xs text-gray-500 mb-1">req/s</span>
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
      <motion.div variants={itemVariants} className={`glass-card rounded-xl p-5 relative overflow-hidden group ${activeIncidentsCount > 0 ? 'border-neon-pink/30' : ''}`}>
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors ${activeIncidentsCount > 0 ? 'bg-neon-pink/10 group-hover:bg-neon-pink/20' : 'bg-gray-500/5'}`}></div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Incidents</h3>
          <Zap size={16} className={activeIncidentsCount > 0 ? 'text-neon-pink' : 'text-gray-500'} />
        </div>
        <div className="flex items-end space-x-2">
          <motion.p 
            key={activeIncidentsCount}
            initial={{ scale: 1.2, y: -5 }}
            animate={{ scale: 1, y: 0 }}
            className={`text-3xl font-bold font-mono tracking-tight ${activeIncidentsCount > 0 ? 'text-neon-pink drop-shadow-[0_0_12px_rgba(255,0,85,0.6)]' : 'text-gray-400'}`}
          >
            {activeIncidentsCount}
          </motion.p>
        </div>
      </motion.div>

      {/* Autonomous Recoveries */}
      <motion.div variants={itemVariants} className="glass-card rounded-xl p-5 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-neon-green/5 rounded-full blur-2xl group-hover:bg-neon-green/10 transition-colors"></div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Auto Recoveries</h3>
          <ShieldCheck size={16} className="text-neon-green" />
        </div>
        <div className="flex items-end space-x-2">
          <p className="text-3xl font-bold font-mono tracking-tight text-neon-green drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]">
            100%
          </p>
          <span className="text-xs text-gray-500 mb-1">uptime</span>
        </div>
      </motion.div>

    </motion.div>
  );
}
