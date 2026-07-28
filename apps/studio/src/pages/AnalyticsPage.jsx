import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AnalyticsPage({ teamId }) {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [polls, setPolls] = useState([]);
  const [sprints, setSprints] = useState([]);

  function fetchData(key, setter) {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/${key}/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setter(d); }).catch(() => {});
  }

  useEffect(() => { fetchData('tasks-data', setTasks); fetchData('polls-data', setPolls); fetchData('sprint-data', setSprints); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  const taskStatusCounts = {};
  tasks.forEach(t => { const s = parse(t).status || 'unknown'; taskStatusCounts[s] = (taskStatusCounts[s] || 0) + 1; });
  const totalTasks = tasks.length;
  const totalPolls = polls.length;
  const activeSprint = sprints.find(s => parse(s).status === 'active');
  const sprintData = activeSprint ? parse(activeSprint) : null;
  const sprintProgress = sprintData ? (sprintData.completed || 0) / Math.max((sprintData.total || 1), 1) * 100 : 0;

  const cards = [
    { label: 'Total Tasks', value: totalTasks, icon: 'nf-fa-list_check', color: '#4af' },
    { label: 'Total Polls', value: totalPolls, icon: 'nf-fa-chart_simple', color: '#f84' },
    { label: 'Sprint Progress', value: sprintData ? `${Math.round(sprintProgress)}%` : 'N/A', icon: 'nf-fa-sprint', color: '#4c6' },
  ];

  const barData = Object.entries(taskStatusCounts).map(([k, v]) => ({ label: k.replace('_', ' '), value: v, pct: totalTasks > 0 ? v / totalTasks * 100 : 0 }));

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-chart_pie" /> Analytics</h1></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} className="glass" style={{ padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <span className={`nf ${c.icon}`} style={{ fontSize: 28, color: c.color }} />
            <div style={{ fontSize: 28, fontWeight: 700, margin: '4px 0' }}>{c.value}</div>
            <div className="studio-text-muted">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="glass" style={{ padding: 20, borderRadius: 12 }}>
        <h3 style={{ margin: '0 0 12px' }}>Tasks by Status</h3>
        {barData.length === 0 ? (
          <div className="studio-text-muted">No task data available</div>
        ) : (
          barData.map(b => (
            <div key={b.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
                <span>{b.label}</span><span>{b.value} ({Math.round(b.pct)}%)</span>
              </div>
              <div style={{ height: 20, background: 'var(--bg-secondary)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${b.pct}%`, background: '#4af', borderRadius: 6, transition: 'width 0.5s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', minWidth: b.pct > 0 ? 24 : 0 }}>{b.value}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
