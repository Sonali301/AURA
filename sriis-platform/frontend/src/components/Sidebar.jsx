import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, AlertCircle, PlayCircle, BrainCircuit, Activity, Settings, Terminal, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'incidents', label: 'Incidents', icon: AlertCircle },
  { id: 'replay', label: 'Replay Center', icon: PlayCircle },
  { id: 'intelligence', label: 'AI Intelligence', icon: BrainCircuit },
  { id: 'canary', label: 'Canary Monitor', icon: Activity },
  { id: 'simulation', label: 'Simulation', icon: Terminal },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeRoute, setActiveRoute }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div 
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className="h-screen glass-panel flex flex-col border-r border-white/5 relative z-50 flex-shrink-0"
    >
      {/* Collapse Toggle */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 bg-cyber-panel border border-white/10 rounded-full p-1 text-gray-400 hover:text-white hover:neon-glow-cyan transition-all"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo Area */}
      <div className="p-6 flex items-center space-x-3 border-b border-white/5 h-20 shrink-0 overflow-hidden">
        <ShieldAlert className="text-neon-cyan shrink-0" size={28} />
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan to-blue-500 tracking-wider">SRIIS</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Autonomous Core</p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 flex flex-col space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {navItems.map((item) => {
          const isActive = activeRoute === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveRoute(item.id)}
              className={`flex items-center px-3 py-3 rounded-lg transition-all relative group ${
                isActive ? 'text-neon-cyan' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
              title={collapsed ? item.label : ''}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-neon-cyan/10 rounded-lg neon-glow-cyan"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon size={22} className={`shrink-0 relative z-10 ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : ''}`} />
              {!collapsed && (
                <motion.span 
                  className="ml-3 font-medium relative z-10 whitespace-nowrap"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status Area */}
      <div className="p-4 border-t border-white/5">
        <div className={`flex items-center justify-center ${!collapsed && 'justify-start space-x-3'} p-2 rounded-lg bg-black/40`}>
          <div className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-green shadow-[0_0_8px_rgba(0,255,102,1)]"></span>
          </div>
          {!collapsed && (
            <div className="flex flex-col whitespace-nowrap">
              <span className="text-xs text-gray-300 font-bold">System Nominal</span>
              <span className="text-[10px] text-gray-500 font-mono">Uptime: 99.99%</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
