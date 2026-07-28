import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AnnouncementsPage({ teamId }) {
  const { token } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  function fetchAll() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/announcements/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setAnnouncements(d.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))); }).catch(() => {});
  }

  useEffect(() => { fetchAll(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  async function handleCreate(e) {
    e.preventDefault();
    const res = await fetch(`/api/studio/teams/${teamId}/apps/announcements/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { title, body } }),
    });
    if (res.ok) { setShowCreate(false); setTitle(''); setBody(''); fetchAll(); }
  }

  async function handleDelete(id) {
    await fetch(`/api/studio/apps/data/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-bullhorn" /> Announcements</h1>
        <button className="studio-btn studio-btn--primary" onClick={() => setShowCreate(true)}><span className="nf nf-fa-plus" /> New Announcement</button>
      </div>
      <div className="s-list">
        {announcements.map(a => {
          const d = parse(a);
          return (
            <div key={a.id} className="s-list-item glass" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{d.title}</h3>
                <button className="studio-btn studio-btn--icon" onClick={() => handleDelete(a.id)} style={{ minWidth: 'auto', padding: 2, opacity: 0.6 }}><span className="nf nf-fa-trash" /></button>
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{d.body}</p>
              <div className="studio-text-muted" style={{ fontSize: 12 }}>{a.author_name || 'Unknown'} · {a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
            </div>
          );
        })}
        {announcements.length === 0 && (
          <div className="studio-empty"><span className="nf nf-fa-bullhorn studio-empty-icon" /><h3>No announcements yet</h3></div>
        )}
      </div>
      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal">
            <div className="studio-modal-header"><h2>New Announcement</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleCreate} className="studio-form">
              <label className="studio-label">Title <input className="studio-input" value={title} onChange={e => setTitle(e.target.value)} required autoFocus /></label>
              <label className="studio-label">Body <textarea className="studio-input" value={body} onChange={e => setBody(e.target.value)} rows={4} required /></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Post</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
