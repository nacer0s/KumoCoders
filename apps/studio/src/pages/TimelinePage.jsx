import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function TimelinePage({ teamId }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [edit, setEdit] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editColor, setEditColor] = useState('#4af');

  function fetchItems() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/timeline/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setItems(d); }).catch(() => {});
  }

  useEffect(() => { fetchItems(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  function resetForm() { setEditTitle(''); setEditStart(''); setEditEnd(''); setEditColor('#4af'); setEdit(null); }

  async function handleSave(e) {
    e.preventDefault();
    const body = { title: editTitle, start: editStart, end: editEnd, color: editColor };
    if (edit) {
      await fetch(`/api/studio/apps/data/${edit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: body }) });
    } else {
      await fetch(`/api/studio/teams/${teamId}/apps/timeline/data`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itemKey: Date.now().toString(), data: body }) });
    }
    setShowCreate(false); resetForm(); fetchItems();
  }

  function openEdit(item) {
    const d = parse(item);
    setEdit(item); setEditTitle(d.title); setEditStart(d.start); setEditEnd(d.end); setEditColor(d.color || '#4af'); setShowCreate(true);
  }

  async function handleDelete(id) {
    await fetch(`/api/studio/apps/data/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); fetchItems();
  }

  const sorted = [...items].sort((a, b) => (parse(a).start || '').localeCompare(parse(b).start || ''));
  const startDates = sorted.map(i => parse(i).start).filter(Boolean);
  const endDates = sorted.map(i => parse(i).end).filter(Boolean);
  const rangeStart = startDates.length ? startDates.reduce((a, b) => a < b ? a : b) : new Date().toISOString().slice(0, 10);
  const rangeEnd = endDates.length ? endDates.reduce((a, b) => a > b ? a : b) : new Date().toISOString().slice(0, 10);
  const dayCount = Math.max(1, Math.ceil((new Date(rangeEnd) - new Date(rangeStart)) / (1000 * 60 * 60 * 24)) + 1);

  function getOffset(d) {
    return Math.max(0, Math.round(((new Date(d) - new Date(rangeStart)) / (1000 * 60 * 60 * 24)) / dayCount * 100));
  }
  function getWidth(s, e) {
    if (!s || !e) return 20;
    return Math.max(5, Math.round(((new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24)) / dayCount * 100));
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-chart_bar" /> Timeline / Gantt</h1><button className="studio-btn studio-btn--primary" onClick={() => { resetForm(); setShowCreate(true); }}><span className="nf nf-fa-plus" /> Add Task</button></div>
      <div className="s-timeline">
        <div className="s-timeline-header">
          <div className="s-timeline-label">Task</div>
          <div className="s-timeline-bars">
            {rangeStart && rangeEnd && Array.from({ length: Math.min(dayCount, 60) }, (_, i) => {
              const d = new Date(new Date(rangeStart).getTime() + i * 86400000);
              return <div key={i} className="s-timeline-day" style={{ flex: 1 }}>{d.getDate()}</div>;
            })}
          </div>
        </div>
        {sorted.map(item => {
          const d = parse(item);
          return (
            <div key={item.id} className="s-timeline-row" onClick={() => openEdit(item)}>
              <div className="s-timeline-label"><strong>{d.title || 'Untitled'}</strong><span className="studio-text-muted">{d.start}{d.end ? ` - ${d.end}` : ''}</span></div>
              <div className="s-timeline-bars">
                <div className="s-timeline-bar-wrap">
                  <div className="s-timeline-bar" style={{ left: `${getOffset(d.start)}%`, width: `${getWidth(d.start, d.end)}%`, background: d.color || '#4af' }} />
                </div>
                <button className="studio-btn studio-btn--icon" onClick={e => { e.stopPropagation(); handleDelete(item.id); }} style={{ minWidth: 'auto', padding: 2, flexShrink: 0 }}><span className="nf nf-fa-trash" /></button>
              </div>
            </div>
          );
        })}
      </div>
      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => { setShowCreate(false); resetForm(); }} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>{edit ? 'Edit Task' : 'New Task'}</h2><button className="studio-btn studio-btn--ghost" onClick={() => { setShowCreate(false); resetForm(); }}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleSave} className="studio-form">
              <label className="studio-label">Title <input className="studio-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} required autoFocus /></label>
              <div style={{ display: 'flex', gap: 8 }}><label className="studio-label" style={{ flex: 1 }}>Start <input type="date" className="studio-input" value={editStart} onChange={e => setEditStart(e.target.value)} /></label><label className="studio-label" style={{ flex: 1 }}>End <input type="date" className="studio-input" value={editEnd} onChange={e => setEditEnd(e.target.value)} /></label></div>
              <label className="studio-label">Color <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="studio-color-input" /></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">{edit ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
