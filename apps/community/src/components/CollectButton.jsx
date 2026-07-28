import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function CollectButton({ postId, className }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [savedIn, setSavedIn] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') { setOpen(false); setShowNew(false); }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  async function openMenu() {
    setOpen(true);
    setLoading(true);
    try {
      const [colRes, checkRes] = await Promise.all([
        fetch('/api/community/collections', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/community/collections/check/${postId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const colData = await colRes.json();
      const checkData = await checkRes.json();
      setCollections(colData.collections || []);
      setSavedIn((checkData.collections || []).map((c) => c.id));
    } catch {} finally { setLoading(false); }
  }

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) { setOpen(false); setShowNew(false); }
  }

  async function toggleCollection(colId) {
    const already = savedIn.includes(colId);
    try {
      if (already) {
        await fetch(`/api/community/collections/${colId}/posts/${postId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        setSavedIn((prev) => prev.filter((id) => id !== colId));
        showToast('Removed from collection', 'info');
      } else {
        await fetch(`/api/community/collections/${colId}/posts`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: postId }) });
        setSavedIn((prev) => [...prev, colId]);
        showToast('Saved to collection', 'success');
      }
    } catch { showToast('Failed', 'error'); }
  }

  async function createCollection() {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/community/collections', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim() }) });
      const col = (await res.json()).collection;
      setCollections((prev) => [...prev, col]);
      setNewName('');
      setShowNew(false);
      showToast('Collection created!', 'success');
    } catch { showToast('Failed to create', 'error'); }
  }

  return (
    <>
      <button className={`community-btn community-btn--icon ${className || ''}`} onClick={(e) => { e.stopPropagation(); openMenu(); }} aria-label="Save to collection">
        <span className="nf nf-fa-folder" />
      </button>

      {open && createPortal(
        <div className="community-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
          <div className="community-modal" style={{ maxWidth: 360 }}>
            <div className="community-modal-header">
              <h3><span className="nf nf-fa-folder" /> Save to Collection</h3>
              <button className="community-btn community-btn--icon" onClick={() => { setOpen(false); setShowNew(false); }} aria-label="Close">
                <span className="nf nf-fa-xmark" />
              </button>
            </div>
            <div className="community-modal-body">
              {loading ? (
                <div style={{ padding: 'var(--space-lg)', textAlign: 'center' }}><div className="community-loading-spinner" /></div>
              ) : collections.length === 0 ? (
                <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  No collections yet. Create one!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 'var(--space-sm)' }}>
                  {collections.map((col) => (
                    <button key={col.id} className="community-share-option" onClick={() => toggleCollection(col.id)}>
                      <span className={`nf ${savedIn.includes(col.id) ? 'nf-fa-check_square' : 'nf-fa-square'}`} style={{ width: 20 }} />
                      {col.name}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-sm)' }}>
                {showNew ? (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input className="community-input" style={{ flex: 1, fontSize: 'var(--font-size-sm)' }} placeholder="Collection name" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createCollection()} autoFocus />
                    <button className="community-btn community-btn--primary" style={{ fontSize: 'var(--font-size-sm)' }} onClick={createCollection}>Create</button>
                  </div>
                ) : (
                  <button className="community-share-option" onClick={() => setShowNew(true)}>
                    <span className="nf nf-fa-plus" /> New Collection
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
