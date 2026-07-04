const API_BASE = 'http://localhost:8000/api';

export const fetchIncidents = async () => {
  const res = await fetch(`${API_BASE}/incidents`);
  return res.json();
};

export const fetchRecentLogs = async () => {
  const res = await fetch(`${API_BASE}/logs/recent`);
  return res.json();
};

export const fetchSystemStatus = async () => {
  const res = await fetch(`${API_BASE}/system/status`);
  return res.json();
};

export const fetchMetricsHistory = async () => {
  const res = await fetch(`${API_BASE}/metrics/history`);
  return res.json();
};

export const healIncident = async (id, user = "AIOps Admin") => {
  return fetch(`${API_BASE}/incidents/${id}/heal`, { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ approval_user: user })
  });
};
