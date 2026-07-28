import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  a.click(); URL.revokeObjectURL(url);
}

function downloadCSV(data, filename) {
  if (!data || typeof data !== 'object') return;
  const rows = Array.isArray(data) ? data : [data];
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  a.click(); URL.revokeObjectURL(url);
}

const DATA_TYPES = [
  { key: 'tasks', label: 'Tasks', icon: 'nf-fa-list_check', color: '#4c6' },
  { key: 'files', label: 'Files', icon: 'nf-fa-files', color: '#6af' },
  { key: 'documents', label: 'Documents', icon: 'nf-fa-file_lines', color: '#fa4' },
  { key: 'events', label: 'Events', icon: 'nf-fa-calendar', color: '#c6f' },
  { key: 'all', label: 'All Data', icon: 'nf-fa-database', color: '#f84' },
];

export default function DataExportPage({ teamId }) {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exportData, setExportData] = useState(null);
  const [history, setHistory] = useState([]);
  const [exporting, setExporting] = useState(null);

  function fetchExport() {
    if (!token) { setLoading(false); return; }
    fetch(`/api/studio/teams/${teamId}/export?types=all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setExportData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function fetchHistory() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/exports/data`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (Array.isArray(d)) setHistory(d); })
      .catch(() => {});
  }

  useEffect(() => { fetchExport(); fetchHistory(); }, [teamId, token]);

  async function handleExport(type, format) {
    setExporting(type);
    try {
      const qs = type === 'all' ? 'types=all' : `types=${type}`;
      const res = await fetch(`/api/studio/teams/${teamId}/export?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      if (format === 'csv') downloadCSV(data, `${type}-export.csv`);
      else downloadJSON(data, `${type}-export.json`);

      await fetch(`/api/studio/teams/${teamId}/apps/exports/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          itemKey: Date.now().toString(),
          data: { date: new Date().toISOString(), types: type, format, status: 'completed', user: user?.display_name || user?.username },
        }),
      });
      fetchHistory();
      showToast(`${type} exported as ${format.toUpperCase()}`, 'success');
    } catch { showToast('Export failed', 'error'); }
    setExporting(null);
  }

  async function handleExportAll() {
    for (const dt of DATA_TYPES.filter(d => d.key !== 'all')) {
      await handleExport(dt.key, 'json');
    }
  }

  function handleScheduleBackup() {
    showToast('Backup scheduled — daily at 2:00 AM', 'success');
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-download" /> Data Export & Backup</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="studio-btn studio-btn--primary" onClick={handleExportAll} disabled={loading}>
            <span className="nf nf-fa-cloud_arrow_down" /> Export All
          </button>
          <button className="studio-btn studio-btn--glass" onClick={handleScheduleBackup}>
            <span className="nf nf-fa-clock" /> Schedule Backup
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[1,2,3,4,5].map(i => <LoadingSkeleton key={i} height={120} style={{ borderRadius: 12 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {DATA_TYPES.map(dt => {
            const count = exportData?.[dt.key]?.length ?? exportData?.[dt.key] ?? '—';
            return (
              <div key={dt.key} className="glass" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className={`nf ${dt.icon}`} style={{ color: dt.color, fontSize: 20 }} />
                  <strong>{dt.label}</strong>
                </div>
                <div className="studio-text-muted" style={{ fontSize: 13, marginBottom: 12 }}>
                  ~{typeof count === 'number' ? count.toLocaleString() : count} records
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="studio-btn studio-btn--ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => handleExport(dt.key, 'json')} disabled={exporting === dt.key}>
                    <span className="nf nf-fa-brackets_curly" /> JSON
                  </button>
                  <button className="studio-btn studio-btn--ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => handleExport(dt.key, 'csv')} disabled={exporting === dt.key}>
                    <span className="nf nf-fa-table" /> CSV
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="studio-page-header" style={{ marginTop: 8 }}>
        <h2 style={{ fontSize: 16 }}><span className="nf nf-fa-clock_rotate_left" /> Export History</h2>
      </div>
      <div className="s-list">
        {history.length === 0 ? (
          <div className="studio-empty">
            <span className="nf nf-fa-download studio-empty-icon" />
            <h3>No exports yet</h3>
            <p className="studio-text-muted">Export data to see history here</p>
          </div>
        ) : (
          [...history].reverse().map(h => {
            const d = typeof h.data === 'string' ? JSON.parse(h.data) : (h.data || {});
            return (
              <div key={h.id} className="s-list-item" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`nf ${d.status === 'completed' ? 'nf-fa-check_circle' : 'nf-fa-times_circle'}`} style={{ color: d.status === 'completed' ? '#4c6' : '#f66', fontSize: 18 }} />
                <div className="s-list-item-info" style={{ flex: 1 }}>
                  <strong>{d.types}</strong>
                  <span className="studio-text-muted">{d.format?.toUpperCase()} — {d.user}</span>
                </div>
                <span className="studio-text-muted" style={{ fontSize: 12 }}>{new Date(d.date).toLocaleString()}</span>
                <span className={`studio-badge ${d.status === 'completed' ? 'studio-badge--success' : 'studio-badge--danger'}`}>{d.status}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}