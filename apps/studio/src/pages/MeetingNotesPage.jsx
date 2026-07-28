import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function MeetingNotesPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState({ title: '', date: new Date().toISOString().slice(0, 10), attendees: '', agenda: '', notes: '', actionItems: [] });
  const [newAi, setNewAi] = useState({ text: '', assignee: '' });

  function loadData() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/meetingnotes/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setItems(d); }).catch(() => {});
  }
  useEffect(() => { loadData(); }, [teamId, token]);

  function parse(i) { return typeof i.data === 'string' ? JSON.parse(i.data) : (i.data || {}); }

  async function handleSave(e) {
    e.preventDefault();
    await fetch(`/api/studio/teams/${teamId}/apps/meetingnotes/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: form }),
    });
    setShow(false); setForm({ title: '', date: new Date().toISOString().slice(0, 10), attendees: '', agenda: '', notes: '', actionItems: [] }); loadData();
    showToast('Meeting note created', 'success');
  }

  async function toggleActionItem(note, aiIdx) {
    const d = parse(note);
    d.actionItems[aiIdx].done = !d.actionItems[aiIdx].done;
    await fetch(`/api/studio/apps/data/${note.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    loadData();
  }

  function addActionItem() {
    if (!newAi.text.trim()) return;
    setForm({ ...form, actionItems: [...form.actionItems, { text: newAi.text, assignee: newAi.assignee, done: false }] });
    setNewAi({ text: '', assignee: '' });
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-note_sticky" /> Meeting Notes</h1><button className="studio-btn studio-btn--primary" onClick={() => setShow(true)}><span className="nf nf-fa-plus" /> New Meeting</button></div>
      <div className="s-list">
        {items.map(item => {
          const d = parse(item);
          const open = expanded[item.id];
          const doneCount = (d.actionItems || []).filter(a => a.done).length;
          const totalAi = (d.actionItems || []).length;
          return (
            <div key={item.id}>
              <div className="s-list-item" onClick={() => setExpanded({ ...expanded, [item.id]: !open })} style={{ cursor: 'pointer' }}>
                <span className={`nf nf-fa-chevron_${open ? 'down' : 'right'}`} style={{ opacity: 0.5 }} />
                <span className="nf nf-fa-calendar" style={{ opacity: 0.5 }} />
                <div className="s-list-item-info"><strong>{d.title}</strong><span className="studio-text-muted">{d.date} · {d.attendees || 'No attendees'} · {totalAi > 0 ? `${doneCount}/${totalAi} actions` : 'No action items'}</span></div>
              </div>
              {open && (
                <div style={{ padding: '8px 12 12 48', background: 'var(--color-surface)', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, marginBottom: 8 }}><strong>Agenda:</strong><br />{d.agenda}</div>
                  <div style={{ fontSize: 13, marginBottom: 8 }}><strong>Notes:</strong><br />{d.notes}</div>
                  {(d.actionItems || []).length > 0 && <div><strong style={{ fontSize: 13 }}>Action Items:</strong>
                    {(d.actionItems || []).map((ai, i) => (
                      <label key={i} className="studio-label--checkbox" style={{ fontSize: 13, padding: '2px 0' }}>
                        <input type="checkbox" checked={ai.done} onChange={() => toggleActionItem(item, i)} />
                        <span style={{ textDecoration: ai.done ? 'line-through' : 'none', opacity: ai.done ? 0.5 : 1 }}>{ai.text}</span>
                        {ai.assignee && <span className="studio-text-muted" style={{ fontSize: 11 }}>— {ai.assignee}</span>}
                      </label>
                    ))}
                  </div>}
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && <div className="studio-empty"><span className="nf nf-fa-note_sticky studio-empty-icon" /><h3>No meetings yet</h3></div>}
      </div>
      {show && (
        <>
          <div className="studio-backdrop" onClick={() => setShow(false)} />
          <div className="studio-modal s-modal-wide"><div className="studio-modal-header"><h2>New Meeting Note</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShow(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleSave} className="studio-form">
              <div className="studio-form-row">
                <label className="studio-label">Title <input className="studio-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus /></label>
                <label className="studio-label">Date <input type="date" className="studio-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
              </div>
              <label className="studio-label">Attendees <input className="studio-input" value={form.attendees} onChange={e => setForm({ ...form, attendees: e.target.value })} placeholder="Comma-separated names" /></label>
              <label className="studio-label">Agenda <textarea className="studio-input" rows={3} value={form.agenda} onChange={e => setForm({ ...form, agenda: e.target.value })} /></label>
              <label className="studio-label">Notes <textarea className="studio-input" rows={4} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
              <div><strong style={{ fontSize: 13 }}>Action Items</strong>
                {form.actionItems.map((ai, i) => (
                  <div key={i} className="s-form-field">
                    <span>{ai.text}</span>
                    {ai.assignee && <span className="studio-text-muted" style={{ fontSize: 11 }}>({ai.assignee})</span>}
                    <button type="button" className="studio-btn studio-btn--icon" style={{ marginLeft: 'auto', width: 24, height: 24, fontSize: 11 }} onClick={() => setForm({ ...form, actionItems: form.actionItems.filter((_, j) => j !== i) })}><span className="nf nf-fa-xmark" /></button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input className="studio-input" style={{ flex: 1 }} value={newAi.text} onChange={e => setNewAi({ ...newAi, text: e.target.value })} placeholder="Action item" />
                  <input className="studio-input" style={{ width: 140 }} value={newAi.assignee} onChange={e => setNewAi({ ...newAi, assignee: e.target.value })} placeholder="Assignee" />
                  <button type="button" className="studio-btn studio-btn--ghost" onClick={addActionItem}><span className="nf nf-fa-plus" /></button>
                </div>
              </div>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Save</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
