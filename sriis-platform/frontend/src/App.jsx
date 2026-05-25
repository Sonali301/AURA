import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import IncidentRelationshipGraph from './components/IncidentRelationshipGraph';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  const [logs, setLogs] = useState([]);
  const [metricData, setMetricData] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [canaryMetrics, setCanaryMetrics] = useState({ stable_health: 100, canary_health: 100, stable_error_rate: 0, canary_error_rate: 0 });
  const [metrics, setMetrics] = useState({ requestsPerSec: 0, errorRate: 0 });
  const logStats = useRef({ count: 0, errorCount: 0 });
  const logBuffer = useRef([]);

  useEffect(() => {
    // Initialize socket inside useEffect to guarantee fresh connection
    const socket = io('http://localhost:8000');

    // Fetch historical incidents on load
    fetch('http://localhost:8000/api/incidents')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setIncidents(data);
        }
      })
      .catch(err => console.error("Failed to fetch incidents:", err));

    // Calculate metrics and update chart every second
    const interval = setInterval(() => {
      const reqPerSec = logStats.current.count;
      const errRate = reqPerSec > 0 ? ((logStats.current.errorCount / reqPerSec) * 100).toFixed(1) : 0;
      
      setMetrics({ requestsPerSec: reqPerSec, errorRate: errRate });
      
      setMetricData((prev) => {
        const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
        const newData = [...prev, { time: timeStr, value: reqPerSec }];
        return newData.slice(-20);
      });

      // Batch update the logs to prevent React from freezing
      if (logBuffer.current.length > 0) {
        const newLogs = [...logBuffer.current].reverse(); // newest first
        setLogs((prev) => [...newLogs, ...prev].slice(0, 100));
        logBuffer.current = []; // Clear buffer
      }

      logStats.current = { count: 0, errorCount: 0 };
    }, 1000);

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

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const handleHeal = (id) => {
    fetch(`http://localhost:8000/api/incidents/${id}/heal`, { method: 'POST' })
      .catch(err => console.error("Failed to send heal request:", err));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <header className="mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-blue-400">SRIIS</h1>
        <p className="text-gray-400">Self-Reasoning Incident Intelligence System</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metrics & Graph */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
              <h3 className="text-gray-400 text-sm">Requests / sec</h3>
              <p className="text-2xl font-bold text-green-400">{metrics.requestsPerSec}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
              <h3 className="text-gray-400 text-sm">Error Rate</h3>
              <p className="text-2xl font-bold text-yellow-400">{metrics.errorRate}%</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
              <h3 className="text-gray-400 text-sm">Active Incidents</h3>
              <p className={`text-2xl font-bold ${incidents.length > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                {incidents.length}
              </p>
            </div>
          </div>

          {/* AI Incident Reports */}
          {incidents.length > 0 && (
            <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-lg space-y-4">
              <h2 className="text-xl font-bold text-red-400 flex items-center">
                🚨 Autonomous Recovery Engine
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {incidents.map((inc) => (
                  <div key={inc.incident_id} className="bg-gray-900 border border-red-900/30 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-bold text-gray-200">Incident: {inc.incident_id.split('-')[0]}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase flex items-center ${
                          inc.status === 'Resolved' ? 'bg-green-900/50 text-green-400' :
                          inc.status === 'Recovering' || inc.status === 'Validating' ? 'bg-blue-900/50 text-blue-400' :
                          'bg-red-900/50 text-red-400'
                        }`}>
                          {(inc.status === 'Recovering' || inc.status === 'Validating') && (
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                          {inc.status || 'Active'}
                        </span>
                      </div>
                      <span className="bg-red-900/50 text-red-400 px-2 py-1 rounded text-xs font-bold uppercase">
                        {inc.severity}
                      </span>
                    </div>
                    <div className="mb-3 text-sm text-gray-400">
                      <span className="font-semibold">Affected Services:</span> {inc.affected_services.join(', ')}
                    </div>
                    <div className="space-y-3">
                      <div className="bg-gray-950 p-3 rounded border border-gray-800">
                        <h4 className="text-xs font-bold text-blue-400 mb-1 uppercase tracking-wider">Root Cause Analysis (Groq)</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">{inc.root_cause}</p>
                      </div>
                      
                      <div className="bg-green-950/20 p-3 rounded border border-green-900/30 flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-bold text-green-400 mb-1 uppercase tracking-wider">AI Recommended Action</h4>
                          <p className="text-sm text-gray-300 font-medium">
                            {inc.recommended_action || inc.recovery_action} 
                            {inc.confidence_score && <span className="ml-2 text-xs text-gray-500">(Confidence: {Math.round(inc.confidence_score * 100)}%)</span>}
                          </p>
                        </div>
                        {(!inc.executed_action && inc.status === 'Active') && (
                          <button 
                            onClick={() => handleHeal(inc.incident_id)}
                            className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-1 px-3 rounded shadow"
                          >
                            Heal System (Approve)
                          </button>
                        )}
                      </div>

                      {/* Autonomous Timeline */}
                      {inc.timeline_events && inc.timeline_events.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-800">
                          <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Autonomous Action Timeline</h4>
                          <div className="space-y-1">
                            {inc.timeline_events.map((ev, i) => (
                              <div key={i} className="flex text-xs">
                                <span className="text-gray-500 w-16 shrink-0">{ev.time}</span>
                                <span className={`${ev.event.includes('Approved') || ev.event.includes('successful') ? 'text-green-400' : ev.event.includes('Rejected') || ev.event.includes('failed') ? 'text-red-400' : 'text-blue-300'}`}>
                                  → {ev.event}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Canary Health Dashboard */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex flex-col items-center">
              <h3 className="text-gray-400 text-sm mb-2">Stable Health</h3>
              <div className={`text-4xl font-bold ${canaryMetrics.stable_health > 90 ? 'text-green-400' : canaryMetrics.stable_health > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                {canaryMetrics.stable_health}%
              </div>
              <div className="text-xs text-gray-500 mt-2">Error Rate: {canaryMetrics.stable_error_rate}%</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex flex-col items-center">
              <h3 className="text-gray-400 text-sm mb-2 text-purple-400">Canary Health (V2)</h3>
              <div className={`text-4xl font-bold ${canaryMetrics.canary_health > 90 ? 'text-green-400' : canaryMetrics.canary_health > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                {canaryMetrics.canary_health}%
              </div>
              <div className="text-xs text-gray-500 mt-2">Error Rate: {canaryMetrics.canary_error_rate}%</div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg h-64">
            <h3 className="text-gray-400 text-sm mb-4">Traffic Monitor</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <IncidentRelationshipGraph />
        </div>

        {/* Right Column: Live Logs */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex flex-col h-full min-h-[800px]">
          <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
            <h3 className="font-semibold text-gray-200">Live Log Stream</h3>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-2 font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500 italic">Waiting for logs...</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="border-b border-gray-800 pb-2">
                  <span className="text-gray-500 mr-2">{log.timestamp}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold mr-2 ${
                    log.level === 'INFO' ? 'bg-blue-900/50 text-blue-400' :
                    log.level === 'WARNING' ? 'bg-yellow-900/50 text-yellow-400' :
                    log.level === 'ERROR' ? 'bg-red-900/50 text-red-400' :
                    'bg-red-600 text-white'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-purple-400 mr-2">[{log.service}]</span>
                  <span className="text-gray-300">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
