import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function RetroPage({ teamId }) {
  const { token } = useAuth();
  const [retros, setRetros] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({ title: '', date: new Date().toISOString().slice(0, 10), wentWell: [''], toImprove: [''], actionItems: [''] });

  function fetchAll() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/retro/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setRetros(d); }).catch(() => {});
  }

  useEffect(() => { fetchAll(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  function addField(field) { setForm({ ...form, [field]: [...form[field], ''] }); }

  function updateField(field, i, val) { const a = [...form[field]]; a[i] = val; setForm({ ...form, [field]: a }); }

  async function handleCreate(e) {
    e.preventDefault();
    const data = {
      title: form.title, date: form.date,
      wentWell: form.wentWell.filter(Boolean),
      toImprove: form.toImprove.filter(Boolean),
      actionItems: form.actionItems.filter(Boolean),
    };
    const res = await fetch(`/api/studio/teams/${teamId}/apps/retro/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data }),
    });
    if (res.ok) { setShowCreate(false); setActive(null); setForm({ title: '', date: new Date().toISOString().slice(0, 10), wentWell: [''], toImprove: [''], actionItems: [''] }); fetchAll(); }
  }

  async function handleDelete(id) {
    await fetch(`/api/studio/apps/data/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (active?.id === id) setActive(null);
    fetchAll();
  }

  const columns = [
    { key: 'wentWell', label: 'Went Well', color: '#4c6', icon: 'nf-fa-face_smile' },
    { key: 'toImprove', label: 'To Improve', color: '#f84', icon: 'nf-fa-face_frown' },
    { key: 'actionItems', label: 'Action Items', color: '#4af', icon: 'nf-fa-list' },
  ];

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-rotate_left" /> Retrospectives</h1>
        <button className="studio-btn studio-btn--primary" onClick={() => setShowCreate(true)}><span className="nf nf-fa-plus" /> New Retro</button>
      </div>
      {retros.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {retros.map(r => {
            const d = parse(r);
            return (
              <button key={r.id} className={`studio-btn ${active?.id === r.id ? 'studio-btn--primary' : 'studio-btn--ghost'}`} onClick={() => setActive(r)} style={{ fontSize: 13 }}>
                {d.title} <span className="studio-text-muted">({d.date})</span>
              </button>
            );
          })}
        </div>
      )}
      {active ? (() => {
        const d = parse(active);
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {columns.map(col => (
              <div key={col.key} className="glass" style={{ padding: 16, borderRadius: 12 }}>
                <h3 style={{ margin: '0 0 12px', color: col.color }}><span className={`nf ${col.icon}`} /> {col.label}</h3>
                {(d[col.key] || []).length === 0 ? (
                  <div className="studio-text-muted" style={{ fontSize: 13, fontStyle: 'italic' }}>No items</div>
                ) : (
                  (d[col.key] || []).map((item, i) => (
                    <div key={i} style={{ padding: '6px 10px', marginBottom: 6, background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 14 }}>{item}</div>
                  ))
                )}
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
              <button className="studio-btn studio-btn--ghost" onClick={() => handleDelete(active.id)}><span className="nf nf-fa-trash" /> Delete</button>
            </div>
          </div>
        );
      })() : retros.length === 0 && (
        <div className="studio-empty"><span className="nf nf-fa-rotate_left studio-empty-icon" /><h3>No retrospectives yet</h3><p>Create one to get started</p></div>
      )}
      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal" style={{ maxWidth: 600 }}>
            <div className="studio-modal-header"><h2>New Retrospective</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleCreate} className="studio-form">
              <div className="studio-form-row">
                <label className="studio-label">Title <input className="studio-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus /></label>
                <label className="studio-label">Date <input className="studio-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></label>
              </div>
              {columns.map(col => (
                <div key={col.key} style={{ marginBottom: 12 }}>
                  <label className="studio-label" style={{ color: col.color }}><span className={`nf ${col.icon}`} /> {col.label}</label>
                  {form[col.key].map((val, i) => (
                    <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      <input className="studio-input" value={val} onChange={e => updateField(col.key, i, e.target.value)} placeholder={`Item ${i + 1}`} />
                      {i === form[col.key].length - 1 && <button type="button" className="studio-btn studio-btn--ghost" onClick={() => addField(col.key)} style={{ padding: '4px 8px' }}><span className="nf nf-fa-plus" /></button>}
                    </div>
                  ))}
                </div>
              ))}
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Create</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
