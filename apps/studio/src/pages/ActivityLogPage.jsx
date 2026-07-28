import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

const ICONS = { create: 'nf-fa-plus', update: 'nf-fa-pen', delete: 'nf-fa-trash', vote: 'nf-fa-check', move: 'nf-fa-arrow_right', complete: 'nf-fa-check_double', upload: 'nf-fa-upload', download: 'nf-fa-download', comment: 'nf-fa-comment' };

export default function ActivityLogPage({ teamId }) {
  const { token } = useAuth();
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/studio/activity/${teamId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setEntries(d); }).catch(() => {});
  }, [teamId, token]);

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-clock_history" /> Activity Log</h1></div>
      <div className="s-list">
        {entries.map(e => (
          <div key={e.id} className="s-list-item">
            <span className={`nf ${ICONS[e.action] || 'nf-fa-circle'}`} style={{ fontSize: 14, opacity: 0.5, width: 24 }} />
            <div className="s-list-item-info">
              <span><strong>{e.user_name || e.user_username || 'System'}</strong> {e.description}</span>
              <span className="studio-text-muted" style={{ fontSize: 11 }}>{new Date(e.created_at).toLocaleString()} · {e.app_key}</span>
            </div>
          </div>
        ))}
        {entries.length === 0 && <div className="studio-empty"><span className="nf nf-fa-clock_history studio-empty-icon" /><h3>No activity yet</h3></div>}
      </div>
    </div>
  );
}
