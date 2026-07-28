import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { marked } from 'marked';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function EditHistoryModal({ postId, onClose }) {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`/api/community/posts/${postId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setHistory(d.history || []); setSelected(d.history?.[0]?.id || null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId, token]);

  const current = history.find((h) => h.id === selected);

  return (
    <div className="community-modal-overlay" onClick={onClose}>
      <div className="community-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className="community-modal-header">
          <h2>Edit History</h2>
          <button className="community-btn community-btn--icon" onClick={onClose}><span className="nf nf-fa-xmark" /></button>
        </div>
        <div className="community-modal-body" style={{ display: 'flex', gap: 'var(--space-md)', maxHeight: '60vh' }}>
          <div style={{ flex: '0 0 180px', overflowY: 'auto', borderRight: '1px solid var(--color-border)', paddingRight: 'var(--space-sm)' }}>
            {loading ? (
              <div className="community-loading-spinner" />
            ) : history.length === 0 ? (
              <p className="community-text-muted">No edit history</p>
            ) : (
              history.map((h) => (
                <button
                  key={h.id}
                  className={`community-list-item ${selected === h.id ? 'community-list-item--active' : ''}`}
                  onClick={() => setSelected(h.id)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', marginBottom: '4px', fontSize: 'var(--font-size-sm)' }}
                >
                  <div style={{ fontWeight: 600 }}>{h.editor_username}</div>
                  <div className="community-text-muted" style={{ fontSize: '0.85em' }}>{timeAgo(h.created_at)}</div>
                </button>
              ))
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {current && (
              <>
                <h3 style={{ marginBottom: 'var(--space-xs)' }}>{current.title}</h3>
                <div
                  className="community-markdown-body"
                  style={{ fontSize: 'var(--font-size-sm)' }}
                  dangerouslySetInnerHTML={{ __html: (() => { try { return marked.parse(current.body, { breaks: true }); } catch { return current.body; } })() }}
                />
                {current.tags && (
                  <div style={{ marginTop: 'var(--space-sm)' }}>
                    {current.tags.split(',').map((t) => (
                      <span key={t} className="community-tag">{t.trim()}</span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
