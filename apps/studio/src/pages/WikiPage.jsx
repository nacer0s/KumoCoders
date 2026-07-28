import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function WikiPage({ teamId }) {
  const { token } = useAuth();
  const [pages, setPages] = useState([]);
  const [active, setActive] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  function fetchPages() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/wiki/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setPages(d); }).catch(() => {});
  }

  useEffect(() => { fetchPages(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  async function handleCreate(e) {
    e.preventDefault();
    const res = await fetch(`/api/studio/teams/${teamId}/apps/wiki/data`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itemKey: newTitle.toLowerCase().replace(/\s+/g, '-'), data: { title: newTitle, content: '' } }) });
    if (res.ok) { setShowCreate(false); setNewTitle(''); fetchPages(); }
  }

  function openPage(page) {
    const d = parse(page);
    setActive(page); setEditTitle(d.title || ''); setEditContent(d.content || ''); setEditMode(false);
  }

  async function savePage() {
    if (!active) return;
    await fetch(`/api/studio/apps/data/${active.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: { title: editTitle, content: editContent } }) });
    setEditMode(false); fetchPages();
  }

  async function handleDelete(id) {
    await fetch(`/api/studio/apps/data/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (active?.id === id) setActive(null);
    fetchPages();
  }

  function renderMarkdown(text) {
    if (!text) return '<p><em>Empty page</em></p>';
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/### (.+)/g, '<h3>$1</h3>');
    html = html.replace(/## (.+)/g, '<h2>$1</h2>');
    html = html.replace(/# (.+)/g, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/^- (.+)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/\n/g, '<br />');
    return html;
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-book" /> Wiki</h1><button className="studio-btn studio-btn--primary" onClick={() => setShowCreate(true)}><span className="nf nf-fa-plus" /> New Page</button></div>
      <div className="studio-docs-layout">
        <div className="studio-docs-sidebar">
          {pages.map(p => (
            <button key={p.id} className={`studio-docs-item ${active?.id === p.id ? 'studio-docs-item--active' : ''}`} onClick={() => openPage(p)}>
              <span className="nf nf-fa-file_lines" />
              <div><strong>{parse(p).title}</strong><span className="studio-text-muted">{p.author_name}</span></div>
              <button className="studio-btn studio-btn--icon" onClick={e => { e.stopPropagation(); handleDelete(p.id); }} style={{ minWidth: 'auto', padding: 2, opacity: 0.6 }}><span className="nf nf-fa-trash" /></button>
            </button>
          ))}
        </div>
        <div className="studio-docs-content-wrap">
          {active ? (
            editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
                <input className="studio-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ fontSize: '1.2rem', fontWeight: 700 }} />
                <textarea className="studio-docs-content" value={editContent} onChange={e => setEditContent(e.target.value)} style={{ flex: 1, minHeight: 300 }} placeholder="Write markdown..." />
                <div style={{ display: 'flex', gap: 8 }}><button className="studio-btn studio-btn--primary" onClick={savePage}>Save</button><button className="studio-btn studio-btn--ghost" onClick={() => { setEditMode(false); const d = parse(active); setEditTitle(d.title); setEditContent(d.content); }}>Cancel</button></div>
              </div>
            ) : (
              <div style={{ padding: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2>{editTitle}</h2>
                  <button className="studio-btn studio-btn--ghost" onClick={() => setEditMode(true)}><span className="nf nf-fa-pen" /> Edit</button>
                </div>
                <div className="s-wiki-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) }} />
              </div>
            )
          ) : (
            <div className="studio-empty"><span className="nf nf-fa-book studio-empty-icon" /><h3>Select a page</h3><p>Choose a wiki page or create a new one</p></div>
          )}
        </div>
      </div>
      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>New Page</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleCreate} className="studio-form"><label className="studio-label">Title <input className="studio-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} required autoFocus /></label><div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Create</button></div></form>
          </div>
        </>
      )}
    </div>
  );
}
