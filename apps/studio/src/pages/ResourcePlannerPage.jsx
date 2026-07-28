import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ResourcePlannerPage({ teamId }) {
  const { token, user } = useAuth();
  const [members, setMembers] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ userId: '', type: 'pto', startDate: '', endDate: '', notes: '' });
  const [weekOffset, setWeekOffset] = useState(0);

  function load() {
    if (!token) return;
    Promise.all([
      fetch(`/api/studio/teams/${teamId}/members`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch(`/api/studio/teams/${teamId}/apps/resourceplanner/data`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
    ]).then(([m, b]) => { if (Array.isArray(m)) setMembers(m); if (Array.isArray(b)) setBlocks(b); }).catch(() => {});
  }
  useEffect(() => { load(); }, [teamId, token]);

  function parse(i) { return typeof i.data === 'string' ? JSON.parse(i.data) : (i.data || {}); }

  async function save(e) {
    e.preventDefault();
    await fetch(`/api/studio/teams/${teamId}/apps/resourceplanner/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { ...form, userId: form.userId || user?.id } }),
    });
    setShow(false); setForm({ userId: '', type: 'pto', startDate: '', endDate: '', notes: '' }); load();
  }

  const days = [];
  const start = new Date();
  start.setDate(start.getDate() + weekOffset * 7);
  start.setDate(start.getDate() - start.getDay());
  for (let i = 0; i < 14; i++) { const d = new Date(start); d.setDate(d.getDate() + i); days.push(d); }

  const typeColors = { pto: '#4af', sick: '#f84', meeting: '#84f', busy: '#fa4' };
  const typeLabels = { pto: 'PTO', sick: 'Sick', meeting: 'Meeting', busy: 'Busy' };

  function hasBlock(memberId, date) {
    const ds = date.toISOString().slice(0, 10);
    return blocks.filter(b => {
      const d = parse(b);
      return d.userId == memberId && ds >= d.startDate && ds <= d.endDate;
    });
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-calendar_week" /> Resource Planner</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="studio-btn studio-btn--ghost" onClick={() => setWeekOffset(w => w - 1)}><span className="nf nf-fa-chevron_left" /></button>
          <span style={{ fontSize: 13, minWidth: 120, textAlign: 'center' }}>{days[0].toLocaleDateString()} – {days[days.length - 1].toLocaleDateString()}</span>
          <button className="studio-btn studio-btn--ghost" onClick={() => setWeekOffset(w => w + 1)}><span className="nf nf-fa-chevron_right" /></button>
          <button className="studio-btn studio-btn--primary" onClick={() => setShow(true)}><span className="nf nf-fa-plus" /> Add Block</button>
        </div>
      </div>
      <div className="s-rp-grid">
        <div className="s-rp-header-name">Member</div>
        {days.map(d => <div key={d.toISOString()} className={`s-rp-header-day ${d.getDay() === 0 || d.getDay() === 6 ? 's-rp-weekend' : ''}`}>{d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}</div>)}
        {members.map(m => (<><div key={`n-${m.user_id}`} className="s-rp-name">{(m.display_name || m.username || '?')}</div>{days.map(d => { const bs = hasBlock(m.user_id, d); return (<div key={`c-${m.user_id}-${d.toISOString()}`} className={`s-rp-cell ${bs.length > 0 ? 's-rp-cell--filled' : ''}`} style={bs.length > 0 ? { background: (typeColors[parse(bs[0]).type] || '#888') + '33', borderLeft: `3px solid ${typeColors[parse(bs[0]).type] || '#888'}` } : {}} title={bs.map(b => `${typeLabels[parse(b).type] || parse(b).type}: ${parse(b).notes}`).join('\n')} />);})}</>))}
      </div>
      {blocks.length === 0 && <div className="studio-empty" style={{ marginTop: 32 }}><span className="nf nf-fa-calendar_week studio-empty-icon" /><h3>No time blocks</h3></div>}
      {show && (
        <>
          <div className="studio-backdrop" onClick={() => setShow(false)} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>Add Time Block</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShow(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={save} className="studio-form">
              <label className="studio-label">Member <select className="studio-input" value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })}><option value="">Myself</option>{members.map(m => <option key={m.user_id} value={m.user_id}>{m.display_name || m.username}</option>)}</select></label>
              <label className="studio-label">Type <select className="studio-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
              <label className="studio-label">Start Date <input type="date" className="studio-input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required /></label>
              <label className="studio-label">End Date <input type="date" className="studio-input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required /></label>
              <label className="studio-label">Notes <input className="studio-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Add</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
