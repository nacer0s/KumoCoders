import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const DATA_SOURCES = [
  { key: 'tasks', label: 'Tasks', endpoint: 'tasks-data', metrics: ['count', 'by_status', 'by_priority', 'by_assignee'] },
  { key: 'files', label: 'Files', endpoint: 'files-data', metrics: ['count', 'by_type', 'by_size_range'] },
  { key: 'events', label: 'Events', endpoint: 'calendar-data', metrics: ['count', 'by_type', 'upcoming'] },
  { key: 'crm', label: 'CRM', endpoint: 'crm-data', metrics: ['count', 'by_status', 'by_source'] },
  { key: 'expenses', label: 'Expenses', endpoint: 'expenses-data', metrics: ['total', 'by_category', 'by_date_range'] },
  { key: 'invoices', label: 'Invoices', endpoint: 'invoices-data', metrics: ['total', 'by_status', 'overdue'] },
];

const METRIC_LABELS = {
  count: 'Count', by_status: 'By Status', by_priority: 'By Priority', by_assignee: 'By Assignee',
  by_type: 'By Type', by_size_range: 'By Size Range', upcoming: 'Upcoming',
  by_source: 'By Source', total: 'Total Amount', by_category: 'By Category', by_date_range: 'By Date Range',
  overdue: 'Overdue',
};

function buildReport(sourceData, sourceKey, metrics) {
  const rows = [];
  const data = Array.isArray(sourceData) ? sourceData : [];
  const parsed = data.map((d) => (typeof d.data === 'string' ? JSON.parse(d.data) : (d.data || {})));

  metrics.forEach((m) => {
    if (m === 'count') {
      rows.push({ metric: 'Total Records', value: parsed.length });
    } else if (m === 'total') {
      const sum = parsed.reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
      rows.push({ metric: 'Total Amount', value: `$${sum.toLocaleString()}` });
    } else if (m === 'overdue') {
      const overdue = parsed.filter((p) => p.status === 'overdue' || p.status === 'past_due');
      rows.push({ metric: 'Overdue', value: overdue.length });
    } else if (m === 'upcoming') {
      const upcoming = parsed.filter((p) => new Date(p.date || p.start) > new Date());
      rows.push({ metric: 'Upcoming', value: upcoming.length });
    } else if (m.startsWith('by_')) {
      const field = m.replace('by_', '');
      const groups = {};
      parsed.forEach((p) => {
        const key = p[field] || 'unknown';
        groups[key] = (groups[key] || 0) + 1;
      });
      Object.entries(groups).forEach(([k, v]) => {
        rows.push({ metric: `${field.replace('_', ' ')}: ${k}`, value: v });
      });
    }
  });
  return rows;
}

export default function ReportsBuilderPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', source: 'tasks', metrics: ['count'] });
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  function fetchItems() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/reportsbuilder/data`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setItems(d); })
      .catch(() => {});
  }

  useEffect(() => { fetchItems(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  const source = DATA_SOURCES.find((s) => s.key === form.source);

  async function handleGenerate() {
    setPreviewLoading(true);
    setPreview(null);
    try {
      const res = await fetch(`/api/studio/teams/${teamId}/apps/${source.endpoint}/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : [];
      const rows = buildReport(data, form.source, form.metrics);
      setPreview(rows);
    } catch {
      showToast('Failed to load data', 'error');
    }
    setPreviewLoading(false);
  }

  async function handleSave() {
    try {
      await fetch(`/api/studio/teams/${teamId}/apps/reportsbuilder/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          itemKey: `report_${Date.now()}`,
          data: { ...form, lastRun: new Date().toISOString() },
        }),
      });
      fetchItems();
      setBuilderOpen(false);
      setPreview(null);
      setForm({ name: '', description: '', source: 'tasks', metrics: ['count'] });
      showToast('Report saved', 'success');
    } catch {
      showToast('Failed to save', 'error');
    }
  }

  function toggleMetric(m) {
    setForm((f) => ({
      ...f,
      metrics: f.metrics.includes(m) ? f.metrics.filter((x) => x !== m) : [...f.metrics, m],
    }));
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-chart_bar" /> Reports Builder</h1>
        <button className="studio-btn studio-btn--primary" onClick={() => { setBuilderOpen(true); setPreview(null); }}>
          <span className="nf nf-fa-plus" /> New Report
        </button>
      </div>

      {items.length === 0 ? (
        <div className="studio-empty"><span className="nf nf-fa-chart_bar studio-empty-icon" /><h3>No saved reports</h3></div>
      ) : (
        items.map((item) => {
          const d = parse(item);
          return (
            <div key={item.id} className="glass" style={{ padding: 16, borderRadius: 12, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{d.name}</strong>
                <div className="studio-text-muted" style={{ fontSize: 12 }}>{d.description}</div>
                <div className="studio-text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                  Source: {d.source} &middot; {d.metrics?.length} metrics &middot; Last run: {d.lastRun ? new Date(d.lastRun).toLocaleDateString() : 'Never'}
                </div>
              </div>
            </div>
          );
        })
      )}

      {builderOpen && (
        <>
          <div className="studio-backdrop" onClick={() => { setBuilderOpen(false); setPreview(null); }} />
          <div className="studio-modal s-modal-wide">
            <div className="studio-modal-header">
              <h2>New Report</h2>
              <button className="studio-btn studio-btn--ghost" onClick={() => { setBuilderOpen(false); setPreview(null); }}><span className="nf nf-fa-xmark" /></button>
            </div>
            <div className="studio-form">
              <label className="studio-label">Report Name <input className="studio-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Weekly Task Summary" autoFocus /></label>
              <label className="studio-label">Description <textarea className="studio-input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this report show?" /></label>

              <div className="studio-label">Data Source</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
                {DATA_SOURCES.map((s) => (
                  <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '6px 8px', borderRadius: 6, background: form.source === s.key ? 'var(--color-primary)' : 'var(--color-bg)', color: form.source === s.key ? '#fff' : undefined }}>
                    <input type="radio" name="source" checked={form.source === s.key} onChange={() => setForm({ ...form, source: s.key, metrics: ['count'] })} />
                    {s.label}
                  </label>
                ))}
              </div>

              <div className="studio-label">Metrics</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {source?.metrics.map((m) => (
                  <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.metrics.includes(m)} onChange={() => toggleMetric(m)} />
                    {METRIC_LABELS[m] || m}
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="studio-btn studio-btn--primary" onClick={handleGenerate} disabled={previewLoading}>
                  {previewLoading ? 'Loading...' : <><span className="nf nf-fa-play" /> Generate</>}
                </button>
                {preview && (
                  <button type="button" className="studio-btn" onClick={handleSave}>
                    <span className="nf nf-fa-floppy_disk" /> Save Report
                  </button>
                )}
              </div>

              {previewLoading && <div className="studio-text-muted" style={{ textAlign: 'center', padding: 20 }}>Loading data...</div>}

              {preview && !previewLoading && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ margin: '0 0 8px' }}>Preview</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px 12', borderBottom: '1px solid var(--border-color)' }}>Metric</th>
                        <th style={{ textAlign: 'right', padding: '8px 12', borderBottom: '1px solid var(--border-color)' }}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i}>
                          <td style={{ padding: '6px 12', borderBottom: '1px solid var(--border-color)' }}>{row.metric}</td>
                          <td style={{ padding: '6px 12', borderBottom: '1px solid var(--border-color)', textAlign: 'right', fontWeight: 600 }}>{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
