import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function HelpDeskPage({ teamId }) {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [members, setMembers] = useState([]);
  const [show, setShow] = useState(false);
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assigneeId: '' });
  const [comment, setComment] = useState('');

  function load() {
    if (!token) return;
    Promise.all([
      fetch(`/api/studio/teams/${teamId}/members`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch(`/api/studio/teams/${teamId}/apps/helpdesk/data`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
    ]).then(([m, t]) => { if (Array.isArray(m)) setMembers(m); if (Array.isArray(t)) setTickets(t); }).catch(() => {});
  }
  useEffect(() => { load(); }, [teamId, token]);

  function parse(i) { return typeof i.data === 'string' ? JSON.parse(i.data) : (i.data || {}); }
  function memberName(id) { const m = members.find(x => x.user_id == id); return m?.display_name || m?.username || 'Unassigned'; }

  async function save(e) {
    e.preventDefault();
    await fetch(`/api/studio/teams/${teamId}/apps/helpdesk/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { ...form, status: 'open', createdBy: user?.id, comments: [], createdAt: new Date().toISOString() } }),
    });
    setShow(false); setForm({ title: '', description: '', priority: 'medium', assigneeId: '' }); load();
  }

  async function addComment() {
    if (!comment.trim() || !detail) return;
    const d = parse(detail);
    d.comments = [...(d.comments || []), { userId: user?.id, text: comment, createdAt: new Date().toISOString() }];
    await fetch(`/api/studio/apps/data/${detail.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    setComment(''); load(); setDetail(null);
  }

  async function updateStatus(ticket, status) {
    const d = parse(ticket);
    await fetch(`/api/studio/apps/data/${ticket.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: { ...d, status } }) });
    load();
  }

  const statusColors = { open: '#4af', in_progress: '#fa4', resolved: '#84f', closed: '#888' };
  const priorityColors = { low: '#888', medium: '#4af', high: '#fa4', urgent: '#f66' };
  const filtered = filter === 'all' ? tickets : tickets.filter(t => parse(t).status === filter);

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-ticket" /> Help Desk</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="studio-input" style={{ width: 'auto', fontSize: 12 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All</option><option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
          </select>
          <button className="studio-btn studio-btn--primary" onClick={() => setShow(true)}><span className="nf nf-fa-plus" /> New Ticket</button>
        </div>
      </div>
      <div className="s-list">
        {filtered.map(t => {
          const d = parse(t);
          return (
            <div key={t.id} className="s-list-item" style={{ cursor: 'pointer' }} onClick={() => setDetail(t)}>
              <span className="nf nf-fa-ticket" style={{ opacity: 0.5, color: priorityColors[d.priority] || '#888' }} />
              <div className="s-list-item-info"><strong>{d.title}</strong><span className="studio-text-muted">{memberName(d.assigneeId)} · <span style={{ color: priorityColors[d.priority] }}>{d.priority}</span></span></div>
              <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: (statusColors[d.status] || '#888') + '22', color: statusColors[d.status] || '#888' }}>{d.status}</span>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="studio-empty"><span className="nf nf-fa-ticket studio-empty-icon" /><h3>No tickets</h3></div>}
      </div>
      {show && (
        <>
          <div className="studio-backdrop" onClick={() => setShow(false)} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>New Ticket</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShow(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={save} className="studio-form">
              <label className="studio-label">Title <input className="studio-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus /></label>
              <label className="studio-label">Description <textarea className="studio-input" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
              <label className="studio-label">Priority <select className="studio-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
              <label className="studio-label">Assignee <select className="studio-input" value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })}><option value="">Unassigned</option>{members.map(m => <option key={m.user_id} value={m.user_id}>{m.display_name || m.username}</option>)}</select></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Create</button></div>
            </form>
          </div>
        </>
      )}
      {detail && (
        <>
          <div className="studio-backdrop" onClick={() => setDetail(null)} />
          <div className="studio-modal s-modal-wide"><div className="studio-modal-header">
            <h2>{(parse(detail)).title}</h2>
            <div style={{ display: 'flex', gap: 4 }}>{['open', 'in_progress', 'resolved', 'closed'].map(s => <button key={s} className="studio-btn studio-btn--ghost" style={{ fontSize: 11, padding: '4px 8px', background: parse(detail).status === s ? (statusColors[s] + '33') : '' }} onClick={() => updateStatus(detail, s)}>{s}</button>)}</div>
            <button className="studio-btn studio-btn--ghost" onClick={() => setDetail(null)}><span className="nf nf-fa-xmark" /></button>
          </div>
            <div style={{ padding: '0 var(--space-lg) var(--space-md)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{(parse(detail)).description || 'No description'}</div>
            <div style={{ padding: '0 var(--space-lg)', borderTop: 'var(--glass-border)', paddingTop: 12 }}>
              <h4 style={{ marginBottom: 8 }}>Comments ({(parse(detail).comments || []).length})</h4>
              {(parse(detail).comments || []).map((c, i) => (
                <div key={i} style={{ padding: '6px 0', fontSize: 13, borderBottom: '1px solid var(--color-border)', marginBottom: 4 }}>
                  <strong>{memberName(c.userId)}</strong> <span className="studio-text-muted" style={{ fontSize: 11 }}>{new Date(c.createdAt).toLocaleString()}</span>
                  <div style={{ marginTop: 2 }}>{c.text}</div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input className="studio-input" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." style={{ flex: 1 }} />
                <button className="studio-btn studio-btn--primary" onClick={addComment}>Send</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
