import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { fetchIncidents, fetchRecentLogs, fetchSystemStatus, fetchMetricsHistory } from '../services/api';

export function useSystemState() {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const [metricData, setMetricData] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [canaryMetrics, setCanaryMetrics] = useState({ 
    stable_health: 100, canary_health: 100, stable_error_rate: 0, canary_error_rate: 0 
  });
  const [metrics, setMetrics] = useState({ requestsPerSec: 0, errorRate: 0 });

  const logStats = useRef({ count: 0, errorCount: 0 });
  const logBuffer = useRef([]);

  useEffect(() => {
    let interval;
    let isMounted = true;
    const socket = io('https://aura-api-uhdu.onrender.com');

    const hydrateState = async () => {
      try {
        const [incData, logsData, statusData, metricHistory] = await Promise.all([
          fetchIncidents(),
          fetchRecentLogs(),
          fetchSystemStatus(),
          fetchMetricsHistory()
        ]);

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

  return {
    isConnected,
    logs,
    metricData,
    incidents,
    canaryMetrics,
    metrics
  };
}
