import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';

export default function DocumentsPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  function fetchDocs() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then((data) => { if (Array.isArray(data)) setDocs(data); })
      .catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { fetchDocs(); }, [teamId, token]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/studio/teams/${teamId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle || 'Untitled', content: '' }),
      });
      if (res.ok) {
        const doc = await res.json();
        setShowCreate(false);
        setNewTitle('');
        fetchDocs();
        openDoc(doc);
        showToast('Document created', 'success');
      }
    } catch { showToast('Failed to create document', 'error'); }
  }

  async function openDoc(doc) {
    try {
      const res = await fetch(`/api/studio/documents/${doc.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveDoc(data);
        setTitle(data.title);
        setContent(data.content || '');
      }
    } catch {}
  }

  async function handleSave() {
    if (!activeDoc) return;
    try {
      const res = await fetch(`/api/studio/documents/${activeDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) { fetchDocs(); showToast('Document saved', 'success'); }
    } catch { showToast('Failed to save document', 'error'); }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/studio/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (activeDoc?.id === id) setActiveDoc(null);
        fetchDocs();
        showToast('Document deleted', 'success');
      }
    } catch { showToast('Failed to delete document', 'error'); }
  }

  if (loading) return <LoadingSkeleton.Page />;

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-file_lines" style={{ color: '#777' }} /> Documents</h1>
        <button className="studio-btn studio-btn--primary" onClick={() => setShowCreate(true)}>
          <span className="nf nf-fa-plus" /> New Document
        </button>
      </div>

      <div className="studio-docs-layout">
        <div className="studio-docs-sidebar">
          {docs.map((doc) => (
            <button
              key={doc.id}
              className={`studio-docs-item ${activeDoc?.id === doc.id ? 'studio-docs-item--active' : ''}`}
              onClick={() => openDoc(doc)}
            >
              <span className="nf nf-fa-file_lines" />
              <div>
                <strong>{doc.title}</strong>
                <span className="studio-text-muted">{doc.author_name}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="studio-docs-editor">
          {activeDoc ? (
            <>
              <div className="studio-docs-toolbar">
                <input
                  className="studio-input studio-docs-title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <button className="studio-btn studio-btn--primary" onClick={handleSave}>
                  <span className="nf nf-fa-floppy_disk" /> Save
                </button>
              </div>
              <textarea
                className="studio-docs-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing..."
              />
            </>
          ) : (
            <div className="studio-empty">
              <span className="nf nf-fa-file_lines studio-empty-icon" />
              <h3>Select a document</h3>
              <p>Choose a document from the list or create a new one</p>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal">
            <div className="studio-modal-header">
              <h2>New Document</h2>
              <button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}>
                <span className="nf nf-fa-xmark" /></button>
            </div>
            <form onSubmit={handleCreate} className="studio-form">
              <label className="studio-label">
                Title <input className="studio-input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required autoFocus />
              </label>
              <div className="studio-form-actions">
                <button type="submit" className="studio-btn studio-btn--primary">Create</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}