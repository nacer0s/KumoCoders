import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function OnboardingPage({ teamId }) {
  const { token } = useAuth();
  const [lists, setLists] = useState([]);
  const [members, setMembers] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', appKey: '' });
  const [itemText, setItemText] = useState('');

  function load() {
    if (!token) return;
    Promise.all([
      fetch(`/api/studio/teams/${teamId}/members`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch(`/api/studio/teams/${teamId}/apps/onboarding/data`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
    ]).then(([m, l]) => { if (Array.isArray(m)) setMembers(m); if (Array.isArray(l)) setLists(l); }).catch(() => {});
  }
  useEffect(() => { load(); }, [teamId, token]);

  function parse(i) { return typeof i.data === 'string' ? JSON.parse(i.data) : (i.data || {}); }

  async function create(e) {
    e.preventDefault();
    await fetch(`/api/studio/teams/${teamId}/apps/onboarding/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { ...form, items: [] } }),
    });
    setShow(false); setForm({ title: '', description: '', appKey: '' }); load();
  }

  async function addItem(list) {
    if (!itemText.trim()) return;
    const d = parse(list);
    d.items = [...(d.items || []), { text: itemText, completed: false }];
    await fetch(`/api/studio/apps/data/${list.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    setItemText(''); load();
  }

  async function toggleItem(list, idx) {
    const d = parse(list);
    d.items[idx].completed = !d.items[idx].completed;
    await fetch(`/api/studio/apps/data/${list.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    load();
  }

  async function deleteItem(list, idx) {
    const d = parse(list);
    d.items.splice(idx, 1);
    await fetch(`/api/studio/apps/data/${list.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    load();
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-clipboard_list" /> Onboarding</h1>
        <button className="studio-btn studio-btn--primary" onClick={() => setShow(true)}><span className="nf nf-fa-plus" /> New Checklist</button>
      </div>
      {lists.map(list => {
        const d = parse(list);
        const done = d.items?.filter(i => i.completed).length || 0;
        const total = d.items?.length || 0;
        const pct = total > 0 ? Math.round(done / total * 100) : 0;
        return (
          <div key={list.id} className="s-onboard-card glass" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div><strong>{d.title}</strong> {d.appKey && <span className="studio-badge" style={{ fontSize: 10 }}>{d.appKey}</span>}
                <div className="studio-text-muted" style={{ fontSize: 12, marginTop: 2 }}>{d.description}</div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{done}/{total} ({pct}%)</span>
            </div>
            <div className="s-okr-progress" style={{ marginBottom: 12 }}><div className="s-okr-progress-bar" style={{ width: `${pct}%` }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {d.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 6, background: 'var(--color-bg)', fontSize: 13 }}>
                  <input type="checkbox" checked={item.completed} onChange={() => toggleItem(list, idx)} style={{ cursor: 'pointer' }} />
                  <span style={{ flex: 1, textDecoration: item.completed ? 'line-through' : 'none', opacity: item.completed ? 0.5 : 1 }}>{item.text}</span>
                  <button className="studio-btn studio-btn--ghost" style={{ fontSize: 11, padding: '2px 6px' }} onClick={() => deleteItem(list, idx)}><span className="nf nf-fa-xmark" /></button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input className="studio-input" style={{ flex: 1, fontSize: 12 }} value={itemText} onChange={e => setItemText(e.target.value)} placeholder="Add item..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(list); } }} />
              <button className="studio-btn studio-btn--primary" style={{ fontSize: 12 }} onClick={() => addItem(list)}>Add</button>
            </div>
          </div>
        );
      })}
      {lists.length === 0 && <div className="studio-empty"><span className="nf nf-fa-clipboard_list studio-empty-icon" /><h3>No checklists</h3></div>}
      {show && (
        <>
          <div className="studio-backdrop" onClick={() => setShow(false)} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>New Checklist</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShow(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={create} className="studio-form">
              <label className="studio-label">Title <input className="studio-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus /></label>
              <label className="studio-label">Description <textarea className="studio-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
              <label className="studio-label">App (optional) <input className="studio-input" value={form.appKey} onChange={e => setForm({ ...form, appKey: e.target.value })} placeholder="e.g. crm, tasks, wiki" /></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Create</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
