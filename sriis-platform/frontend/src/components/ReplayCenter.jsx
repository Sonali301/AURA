import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const ReplayCenter = ({ incidentId, onClose }) => {
  const [replayEvents, setReplayEvents] = useState([]);
  const [replaySpeed, setReplaySpeed] = useState(1.0);
  const [incidentData, setIncidentData] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to dedicated replay namespace
    socketRef.current = io('http://localhost:8000/replay');

    socketRef.current.on('connect', () => {
      // Start replay immediately upon connection
      socketRef.current.emit('start_replay', { incident_id: incidentId, speed: replaySpeed });
    });

    socketRef.current.on('replay_started', (data) => {
      setIncidentData(data.incident);
      setReplayEvents([]);
      setIsCompleted(false);
    });

    socketRef.current.on('replay_event', (event) => {
      setReplayEvents(prev => [...prev, event]);
    });

    socketRef.current.on('replay_completed', () => {
      setIsCompleted(true);
    });

    socketRef.current.on('replay_error', (data) => {
      console.error("Replay error:", data.message);
      setIsCompleted(true);
    });

    return () => {
      socketRef.current.emit('stop_replay', { incident_id: incidentId });
      socketRef.current.disconnect();
    };
  }, [incidentId]);

  const changeSpeed = (speed) => {
    setReplaySpeed(speed);
    // Restart the replay at new speed
    socketRef.current.emit('start_replay', { incident_id: incidentId, speed: speed });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-gray-900 border-2 border-blue-900/50 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="bg-gray-950 p-4 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-red-500 animate-pulse font-bold text-xl flex items-center">
              <span className="mr-2">⏺</span> REPLAY MODE
            </span>
            <span className="text-gray-400 font-mono text-lg">
              Incident {incidentId.split('-')[0]}
            </span>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex space-x-2">
              {[0.5, 1.0, 2.0, 5.0].map(speed => (
                <button
                  key={speed}
                  onClick={() => changeSpeed(speed)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                    replaySpeed === speed ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
            
            <button
              onClick={onClose}
              className="bg-red-900/50 text-red-400 hover:bg-red-800 hover:text-white px-4 py-1.5 rounded font-bold transition-colors"
            >
              Exit Replay
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {incidentData && (
            <div className="mb-8 bg-gray-950 border border-gray-800 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-200 mb-2">AI Root Cause Analysis</h2>
              <p className="text-gray-400 leading-relaxed text-lg">{incidentData.root_cause}</p>
              
              <div className="mt-4 flex space-x-4">
                <div className="bg-gray-900 px-4 py-2 rounded border border-gray-700">
                  <span className="text-xs text-gray-500 block uppercase">Root Dependency</span>
                  <span className="text-red-400 font-mono font-bold">{incidentData.root_dependency || 'N/A'}</span>
                </div>
                <div className="bg-gray-900 px-4 py-2 rounded border border-gray-700">
                  <span className="text-xs text-gray-500 block uppercase">AI Recommended Action</span>
                  <span className="text-green-400 font-mono font-bold">{incidentData.recommended_action}</span>
                </div>
              </div>
            </div>
          )}

          <div className="relative pl-6 border-l-2 border-blue-900/30 space-y-8">
            {replayEvents.map((ev, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[33px] top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-gray-900 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse"></div>
                <div className="text-sm font-bold text-gray-500 mb-1 font-mono">{ev.time}</div>
                <div className={`text-xl ${
                  ev.event.includes('Approved') || ev.event.includes('successful') ? 'text-green-400' :
                  ev.event.includes('Rejected') || ev.event.includes('failed') ? 'text-red-400' :
                  'text-blue-300'
                }`}>
                  {ev.event}
                </div>
              </div>
            ))}
            
            {!isCompleted && replayEvents.length > 0 && (
              <div className="relative opacity-50">
                <div className="absolute -left-[33px] top-1.5 w-4 h-4 rounded-full bg-gray-700 border-4 border-gray-900"></div>
                <div className="text-xl text-gray-600 animate-pulse">Waiting for next event...</div>
              </div>
            )}
            
            {isCompleted && (
              <div className="relative mt-12">
                <div className="absolute -left-[33px] top-1.5 w-4 h-4 rounded-full bg-green-500 border-4 border-gray-900 shadow-[0_0_15px_rgba(34,197,94,1)]"></div>
                <div className="text-2xl font-bold text-green-400">Replay Completed</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplayCenter;
