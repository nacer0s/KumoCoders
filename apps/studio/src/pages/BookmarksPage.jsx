import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function BookmarksPage({ teamId }) {
  const { token } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState({ title: '', url: '', folder: 'General' });

  function fetchAll() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/bookmarks/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setBookmarks(d); }).catch(() => {});
  }

  useEffect(() => { fetchAll(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  const folders = {};
  bookmarks.forEach(b => {
    const d = parse(b);
    const folder = d.folder || 'General';
    if (!folders[folder]) folders[folder] = [];
    folders[folder].push(b);
  });

  async function handleCreate(e) {
    e.preventDefault();
    const res = await fetch(`/api/studio/teams/${teamId}/apps/bookmarks/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { title: form.title, url: form.url, folder: form.folder || 'General' } }),
    });
    if (res.ok) { setShowCreate(false); setForm({ title: '', url: '', folder: 'General' }); fetchAll(); }
  }

  async function handleDelete(id) {
    await fetch(`/api/studio/apps/data/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-bookmark" /> Bookmarks</h1>
        <button className="studio-btn studio-btn--primary" onClick={() => setShowCreate(true)}><span className="nf nf-fa-plus" /> Add Bookmark</button>
      </div>
      {Object.keys(folders).length === 0 ? (
        <div className="studio-empty"><span className="nf nf-fa-bookmark studio-empty-icon" /><h3>No bookmarks yet</h3></div>
      ) : (
        Object.entries(folders).map(([folder, items]) => {
          const open = expanded[folder] !== false;
          return (
            <div key={folder} style={{ marginBottom: 12 }}>
              <button className="studio-btn studio-btn--ghost" onClick={() => setExpanded({ ...expanded, [folder]: !open })} style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12', fontSize: 15, fontWeight: 600 }}>
                <span className={`nf nf-fa-chevron_${open ? 'down' : 'right'}`} style={{ marginRight: 8 }} />
                <span className="nf nf-fa-folder" style={{ marginRight: 8 }} /> {folder} <span className="studio-text-muted" style={{ marginLeft: 8, fontSize: 12 }}>({items.length})</span>
              </button>
              {open && items.map(b => {
                const d = parse(b);
                return (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 12 6px 48', gap: 8 }}>
                    <span className="nf nf-fa-link" style={{ opacity: 0.5 }} />
                    <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: 'none' }}>{d.title}</a>
                    <span className="studio-text-muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{d.url}</span>
                    <button className="studio-btn studio-btn--icon" onClick={() => handleDelete(b.id)} style={{ minWidth: 'auto', padding: 2, opacity: 0.6 }}><span className="nf nf-fa-trash" /></button>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal">
            <div className="studio-modal-header"><h2>Add Bookmark</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleCreate} className="studio-form">
              <label className="studio-label">Title <input className="studio-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus /></label>
              <label className="studio-label">URL <input className="studio-input" type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} required placeholder="https://" /></label>
              <label className="studio-label">Folder <input className="studio-input" value={form.folder} onChange={e => setForm({ ...form, folder: e.target.value })} placeholder="General" /></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Add</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
