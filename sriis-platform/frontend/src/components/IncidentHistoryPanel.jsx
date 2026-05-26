import React from 'react';

const IncidentHistoryPanel = ({ incidents, onReplay }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex flex-col h-full">
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-200">Incident History & Replay</h3>
        <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
          {incidents.length} Records
        </span>
      </div>
      
      <div className="p-4 overflow-y-auto flex-1 space-y-3">
        {incidents.length === 0 ? (
          <p className="text-gray-500 italic text-sm">No historical incidents found.</p>
        ) : (
          incidents.map((inc) => (
            <div key={inc.incident_id} className="bg-gray-950 border border-gray-800 p-3 rounded hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-gray-400">{inc.incident_id.split('-')[0]}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  inc.status === 'Resolved' ? 'bg-green-900/40 text-green-400' :
                  inc.status === 'Escalated' ? 'bg-red-900/40 text-red-400' :
                  'bg-yellow-900/40 text-yellow-400'
                }`}>
                  {inc.status || 'Unknown'}
                </span>
              </div>
              
              <div className="text-sm text-gray-300 mb-3 line-clamp-2" title={inc.root_cause}>
                {inc.root_cause}
              </div>
              
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800">
                <span className="text-xs text-blue-400 font-mono">
                  {inc.cascading_chain?.length > 0 ? `🔥 Root: ${inc.root_dependency}` : 'No cascade'}
                </span>
                
                <button
                  onClick={() => onReplay(inc.incident_id)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1 px-3 rounded flex items-center shadow-lg transition-colors"
                >
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  Replay
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default IncidentHistoryPanel;
