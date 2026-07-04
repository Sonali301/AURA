import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ActivitySquare } from 'lucide-react';

// Hooks & State
import { useSystemState } from './hooks/useSystemState';

// Layouts
import Sidebar from './layouts/Sidebar';
import Topbar from './layouts/Topbar';

// Pages
import LandingPage from './pages/LandingPage';
import BootSequence from './pages/BootSequence';
import Dashboard from './pages/Dashboard';
import ReplayCenter from './pages/ReplayCenter';

function App() {
  const [appView, setAppView] = useState('landing'); // 'landing' | 'booting' | 'dashboard'
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [replayIncidentId, setReplayIncidentId] = useState(null);
  
  // Extract all complex socket & state logic into custom hook
  const { isConnected, logs, metricData, incidents, canaryMetrics, metrics } = useSystemState();

  const activeIncidentsCount = incidents.filter(i => i.status !== 'Resolved').length;

  if (appView === 'landing') {
    return (
      <LandingPage 
        onLaunch={() => setAppView('booting')} 
        onReplayLaunch={() => {
          const latestResolved = incidents.find(i => i.status === 'Resolved');
          setReplayIncidentId(latestResolved ? latestResolved.incident_id : 'INC-DEMO-999');
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

      {/* Main Layout Shell */}
      <Sidebar 
        activeRoute={activeRoute} 
        setActiveRoute={setActiveRoute} 
        isConnected={isConnected} 
        activeIncidentsCount={activeIncidentsCount}
        onBackToLanding={() => setAppView('landing')}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Topbar isConnected={isConnected} onBackToLanding={() => setAppView('landing')} />
        
        <main className={`flex-1 overflow-y-auto p-6 scrollbar-hide flex flex-col transition-all duration-700 ${replayIncidentId ? 'blur-md opacity-30 pointer-events-none grayscale sepia-[.2] hue-rotate-[320deg]' : ''}`}>
          
          {/* Conditional Rendering for Routes */}
          {activeRoute === 'dashboard' ? (
            <Dashboard 
              metrics={metrics}
              incidents={incidents}
              canaryMetrics={canaryMetrics}
              metricData={metricData}
              logs={logs}
              setReplayIncidentId={setReplayIncidentId}
            />
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
      </div>
    </motion.div>
  );
}

export default App;
