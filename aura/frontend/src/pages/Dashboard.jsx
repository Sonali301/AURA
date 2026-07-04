import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { Activity, ShieldCheck } from 'lucide-react';

import KPICards from '../components/KPICards';
import DashboardMetrics from '../components/DashboardMetrics';
import BlastRadiusGraph from '../components/BlastRadiusGraph';
import LiveLogTerminal from '../components/LiveLogTerminal';
import IncidentTimeline from '../components/IncidentTimeline';
import SimulationControlPanel from '../components/SimulationControlPanel';
import { healIncident } from '../services/api';

const Dashboard = ({ metrics, incidents, canaryMetrics, metricData, logs, setReplayIncidentId }) => {
  const handleHeal = (id) => {
    healIncident(id).catch(err => console.error("Failed to send heal request:", err));
  };

  return (
    <>
      {/* Row 1: KPI Metrics (Hardware + AI) */}
      <div id="dashboard-top" className="flex flex-col space-y-4 w-full">
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
            <div id="network-traffic-monitor" className="glass-panel border border-white/5 rounded-xl p-5 h-72">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
                  <Activity className="mr-2 text-neon-cyan" size={14} /> Network Traffic Monitor
                </h3>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-neon-cyan font-bold uppercase tracking-widest font-mono">Live Throughput</span>
                  <span className="text-[9px] text-gray-500 font-mono">Measured in Logs / Second</span>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricData} margin={{ top: 10, right: 10, bottom: 15, left: 15 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="time" stroke="#4b5563" tick={{ fontSize: 10, fill: '#6b7280', dy: 10 }} tickLine={false} axisLine={false}>
                      <Label value="Time" offset={-10} position="insideBottom" fill="#6b7280" fontSize={10} />
                    </XAxis>
                    <YAxis stroke="#4b5563" tick={{ fontSize: 10, fill: '#6b7280', dx: -5 }} tickLine={false} axisLine={false}>
                      <Label value="Logs / Sec" angle={-90} position="insideLeft" offset={-5} fill="#6b7280" fontSize={10} style={{ textAnchor: 'middle' }} />
                    </YAxis>
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
            <div id="deployment-health" className="glass-panel border border-white/5 rounded-xl p-5 h-72 flex flex-col">
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
          <div id="live-blast-radius-topology" className="glass-panel border border-white/5 rounded-xl overflow-hidden h-[350px] shrink-0 flex flex-col relative">
             <BlastRadiusGraph activeIncidents={incidents.filter(i => i.status !== 'Resolved')} />
          </div>

        </div>

        {/* Right Column (Logs) */}
        <div id="global-telemetry-feed" className="xl:col-span-1 relative min-h-[300px]">
          <div className="absolute inset-0">
            <LiveLogTerminal logs={logs} />
          </div>
        </div>

      </div>

      {/* Bottom Section: Incident Timeline (Full Width) */}
      <div id="incident-intelligence-timeline" className="flex-1 min-h-[600px] w-full mt-6">
        <div className="glass-panel border border-white/5 rounded-xl overflow-hidden h-full flex flex-col relative">
          <IncidentTimeline 
            incidents={incidents} 
            onHeal={handleHeal} 
            onReplay={(id) => setReplayIncidentId(id)} 
          />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
