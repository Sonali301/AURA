import React, { useState } from 'react';

const SimulationControlPanel = () => {
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
      .then(data => {
        setTimeout(() => setActiveSimulation(null), duration * 1000);
      })
      .catch(err => {
        console.error(err);
        setActiveSimulation(null);
      });
  };

  const scenarios = [
    { id: 'db-timeout', label: 'DB Timeout', color: 'red' },
    { id: 'api-crash', label: 'API Crash', color: 'orange' },
    { id: 'canary-failure', label: 'Canary Failure', color: 'purple' },
    { id: 'latency-spike', label: 'Latency Spike', color: 'yellow' },
    { id: 'auth-failure', label: 'Auth Brute-Force', color: 'pink' },
    { id: 'traffic-surge', label: 'Traffic Surge', color: 'blue' }
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-200 font-bold flex items-center">
          <span className="mr-2">🕹️</span> Failure Injection System
        </h3>
        <div className="flex space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <label className="text-gray-400">Severity:</label>
            <select 
              value={severity} 
              onChange={(e) => setSeverity(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1"
            >
              <option value="warning">Warning</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-gray-400">Duration (s):</label>
            <input 
              type="number" 
              value={duration} 
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 w-16"
              min="5" max="60"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {scenarios.map(s => (
          <button
            key={s.id}
            onClick={() => simulateFailure(s.id)}
            disabled={activeSimulation !== null}
            className={`py-2 px-3 rounded text-xs font-bold transition-all ${
              activeSimulation === s.id 
                ? 'bg-green-600 text-white animate-pulse' 
                : activeSimulation 
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : `bg-${s.color}-900/40 text-${s.color}-400 hover:bg-${s.color}-800/60 border border-${s.color}-800/50`
            }`}
          >
            {activeSimulation === s.id ? 'Injecting...' : s.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SimulationControlPanel;
