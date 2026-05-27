import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, ShieldCheck, ActivitySquare } from 'lucide-react';

// New Components
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import KPICards from './components/KPICards';
import DashboardMetrics from './components/DashboardMetrics';
import BlastRadiusGraph from './components/BlastRadiusGraph';
import LiveLogTerminal from './components/LiveLogTerminal';
import IncidentTimeline from './components/IncidentTimeline';
import SimulationControlPanel from './components/SimulationControlPanel';
import LandingPage from './components/LandingPage';
import BootSequence from './components/BootSequence';

// Existing Components
import IncidentRelationshipGraph from './components/IncidentRelationshipGraph';
import ReplayCenter from './components/ReplayCenter';

function App() {
  const [appView, setAppView] = useState('landing'); // 'landing' | 'booting' | 'dashboard'
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [metricData, setMetricData] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [canaryMetrics, setCanaryMetrics] = useState({ stable_health: 100, canary_health: 100, stable_error_rate: 0, canary_error_rate: 0 });
  const [metrics, setMetrics] = useState({ requestsPerSec: 0, errorRate: 0 });
  const [replayIncidentId, setReplayIncidentId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const logStats = useRef({ count: 0, errorCount: 0 });
  const logBuffer = useRef([]);

  useEffect(() => {
    let interval;
    let isMounted = true;

    const socket = io('http://localhost:8000');

    const hydrateState = async () => {
      try {
        const [incRes, logsRes, statusRes, metricRes] = await Promise.all([
          fetch('http://localhost:8000/api/incidents'),
          fetch('http://localhost:8000/api/logs/recent'),
          fetch('http://localhost:8000/api/system/status'),
          fetch('http://localhost:8000/api/metrics/history')
        ]);

        const incData = await incRes.json();
        const logsData = await logsRes.json();
        const statusData = await statusRes.json();
        const metricHistory = await metricRes.json();

        if (!isMounted) return;

        if (Array.isArray(incData)) setIncidents(incData);
        if (Array.isArray(logsData)) setLogs(logsData);
        if (statusData && Object.keys(statusData).length > 0) {
          setCanaryMetrics({
            stable_health: statusData.stable_health !== undefined ? statusData.stable_health : 100,
            canary_health: statusData.canary_health !== undefined ? statusData.canary_health : 100,
            stable_error_rate: statusData.stable_error_rate || 0,
            canary_error_rate: statusData.canary_error_rate || 0
          });
        }
        if (Array.isArray(metricHistory) && metricHistory.length > 0) {
          setMetricData(metricHistory);
          const latest = metricHistory[metricHistory.length - 1];
          setMetrics({ requestsPerSec: latest.value, errorRate: latest.error_rate || 0 });
        }
      } catch (err) {
        console.error("Hydration failed:", err);
      }
    };

    socket.on('connect', () => {
      setIsConnected(true);
      hydrateState();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('new_log', (log) => {
      logBuffer.current.push(log);
      logStats.current.count += 1;
      
      if (log.level === 'ERROR' || log.level === 'CRITICAL' || log.is_anomaly) {
        logStats.current.errorCount += 1;
      }
    });

    socket.on('new_incident', (incident) => {
      setIncidents((prev) => [incident, ...prev]);
    });

    socket.on('canary_metrics', (data) => {
      setCanaryMetrics(data);
    });

    socket.on('incident_status_update', (data) => {
      setIncidents(prev => prev.map(inc => 
        inc.incident_id === data.incident_id ? { ...inc, status: data.status } : inc
      ));
    });

    socket.on('recovery_event', (data) => {
      setIncidents(prev => prev.map(inc => {
        if (inc.incident_id === data.incident_id) {
          const events = inc.timeline_events || [];
          return { ...inc, timeline_events: [...events, { time: data.time, event: data.event }] };
        }
        return inc;
      }));
    });

    interval = setInterval(() => {
      const reqPerSec = logStats.current.count;
      const errRate = reqPerSec > 0 ? ((logStats.current.errorCount / reqPerSec) * 100).toFixed(1) : 0;
      
      setMetrics({ requestsPerSec: reqPerSec, errorRate: errRate });
      
      setMetricData((prev) => {
        const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
        const newData = [...prev, { time: timeStr, value: reqPerSec }];
        return newData.slice(-60);
      });

      if (logBuffer.current.length > 0) {
        const newLogs = [...logBuffer.current].reverse();
        setLogs((prev) => [...newLogs, ...prev].slice(0, 100));
        logBuffer.current = [];
      }

      logStats.current = { count: 0, errorCount: 0 };
    }, 1000);

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, []);

  const handleHeal = (id) => {
    fetch(`http://localhost:8000/api/incidents/${id}/heal`, { method: 'POST' })
      .catch(err => console.error("Failed to send heal request:", err));
  };

  const activeIncidentsCount = incidents.filter(i => i.status !== 'Resolved').length;

  if (appView === 'landing') {
    return (
      <LandingPage 
        onLaunch={() => setAppView('booting')} 
        onReplayLaunch={() => {
          setReplayIncidentId('INC-DEMO-999');
          setAppView('booting');
        }}
      />
    );
  }

  if (appView === 'booting') {
    return <BootSequence onComplete={() => setAppView('dashboard')} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 1 }}
      className="flex h-screen overflow-hidden bg-cyber-bg text-gray-200 relative selection:bg-neon-cyan/30"
    >
      
      {/* Replay Overlay */}
      {replayIncidentId && (
        <ReplayCenter 
          incidentId={replayIncidentId} 
          onClose={() => setReplayIncidentId(null)} 
        />
      )}

      {/* Modular Layout */}
      <Sidebar 
        activeRoute={activeRoute} 
        setActiveRoute={setActiveRoute} 
        isConnected={isConnected} 
        activeIncidentsCount={activeIncidentsCount}
        onBackToLanding={() => setAppView('landing')}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Topbar isConnected={isConnected} />
        
        <main className={`flex-1 overflow-y-auto p-6 scrollbar-hide flex flex-col space-y-6 transition-all duration-700 ${replayIncidentId ? 'blur-md opacity-30 pointer-events-none grayscale sepia-[.2] hue-rotate-[320deg]' : ''}`}>
          {activeRoute === 'dashboard' ? (
            <>
              {/* Row 1: KPI Metrics (Hardware + AI) */}
              <div className="flex flex-col space-y-4 w-full">
                <KPICards metrics={metrics} incidents={incidents} />
                <DashboardMetrics systemStatus={canaryMetrics} incidents={incidents} />
              </div>

          {/* Top Section: Simulation, Traffic, Topology (Left) + Live Logs (Right) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 shrink-0">
            
            {/* Left Column (Main Data & Graphs) */}
            <div className="xl:col-span-2 flex flex-col space-y-6">
              <div className="shrink-0">
                <SimulationControlPanel />
              </div>
              
              {/* Traffic & Canary Dual Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                
                {/* Traffic Monitor */}
                <div className="glass-panel border border-white/5 rounded-xl p-5 h-72">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                    <Activity className="mr-2 text-neon-cyan" size={14} /> Network Traffic Monitor
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metricData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="time" stroke="#4b5563" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                        <YAxis stroke="#4b5563" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(10,10,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ color: '#00f0ff' }}
                        />
                        <Line type="monotone" dataKey="value" stroke="#00f0ff" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#00f0ff' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Canary Health Gauges */}
                <div className="glass-panel border border-white/5 rounded-xl p-5 h-72 flex flex-col">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                    <ShieldCheck className="mr-2 text-neon-purple" size={14} /> Deployment Health (Canary V2)
                  </h3>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="bg-black/40 border border-white/5 rounded-lg flex flex-col items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-t from-neon-green/5 to-transparent"></div>
                      <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 z-10">Stable Cluster</h4>
                      <div className={`text-4xl font-mono font-bold z-10 ${canaryMetrics.stable_health > 90 ? 'text-neon-green drop-shadow-[0_0_8px_rgba(0,255,102,0.5)]' : canaryMetrics.stable_health > 70 ? 'text-yellow-400' : 'text-neon-pink'}`}>
                        {canaryMetrics.stable_health}%
                      </div>
                      <span className="text-[10px] text-gray-500 mt-2 z-10 font-mono">ERR RATE: {canaryMetrics.stable_error_rate}%</span>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-lg flex flex-col items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-t from-neon-purple/5 to-transparent"></div>
                      <h4 className="text-[10px] text-neon-purple uppercase tracking-widest mb-2 z-10 font-bold">Canary Traffic</h4>
                      <div className={`text-4xl font-mono font-bold z-10 ${canaryMetrics.canary_health > 90 ? 'text-neon-purple drop-shadow-[0_0_8px_rgba(176,38,255,0.5)]' : canaryMetrics.canary_health > 70 ? 'text-yellow-400' : 'text-neon-pink'}`}>
                        {canaryMetrics.canary_health}%
                      </div>
                      <span className="text-[10px] text-gray-500 mt-2 z-10 font-mono">ERR RATE: {canaryMetrics.canary_error_rate}%</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Service Graph (Blast Radius Live) */}
              <div className="glass-panel border border-white/5 rounded-xl overflow-hidden h-[350px] shrink-0 flex flex-col relative">
                 <BlastRadiusGraph activeIncidents={incidents.filter(i => i.status !== 'Resolved')} />
              </div>

            </div>

            {/* Right Column (Logs) */}
            <div className="xl:col-span-1 relative min-h-[300px]">
              {/* Live Logs - strictly bounds to the exact height of left column */}
              <div className="absolute inset-0">
                <LiveLogTerminal logs={logs} />
              </div>
            </div>

          </div>

          {/* Bottom Section: Incident Timeline (Full Width) */}
          <div className="flex-1 min-h-[600px] w-full">
            <div className="glass-panel border border-white/5 rounded-xl overflow-hidden h-full flex flex-col relative">
              <IncidentTimeline 
                incidents={incidents} 
                onHeal={handleHeal} 
                onReplay={(id) => setReplayIncidentId(id)} 
              />
            </div>
          </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center glass-panel border border-white/5 rounded-xl min-h-[600px] text-center p-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-neon-cyan/20 blur-xl rounded-full animate-pulse"></div>
                <ActivitySquare size={64} className="text-neon-cyan relative z-10 opacity-80" />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-widest mb-2 capitalize">
                {activeRoute.replace('-', ' ')}
              </h2>
              <p className="text-gray-400 max-w-md">
                This module is currently offline for routine maintenance. The full {activeRoute.replace('-', ' ')} experience will be unlocked in the V2 production release.
              </p>
              <button 
                onClick={() => setActiveRoute('dashboard')}
                className="mt-8 px-6 py-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan rounded-lg transition-all font-mono text-sm uppercase tracking-wider"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </main>
        
        {/* Footer */}
        <div className="h-8 border-t border-white/5 flex items-center justify-between px-6 shrink-0 bg-black/80 font-mono text-[9px] text-gray-500 uppercase tracking-widest z-40">
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green mr-2 animate-pulse"></span>
            AI CORE ONLINE • VECTOR MEMORY SYNCHRONIZED
          </span>
          <span>SRIIS NOC v2.0.0</span>
        </div>
      </div>
    </motion.div>
  );
}

export default App;
