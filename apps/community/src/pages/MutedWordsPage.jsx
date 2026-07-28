import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function MutedWordsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pattern, setPattern] = useState('');
  const [isTag, setIsTag] = useState(false);

  useEffect(() => {
    fetch('/api/community/muted-words', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function addMute() {
    if (!pattern.trim()) return;
    const res = await fetch('/api/community/muted-words', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ pattern: pattern.trim(), is_tag: isTag }),
    });
    if (res.ok) {
      const item = (await res.json()).item;
      setItems((prev) => [item, ...prev]);
      setPattern('');
      showToast('Muted', 'success');
    }
  }

  async function removeMute(id) {
    await fetch(`/api/community/muted-words/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast('Unmuted', 'info');
  }

  return (
    <div className="community-page">
      <div className="community-page-header">
        <h1><span className="nf nf-fa-ban" /> Muted Words & Tags</h1>
        <p>Hide posts containing specific words or tags from your feed</p>
      </div>

      <div className="community-card community-muted-form">
        <input className="community-input" placeholder="Word or tag name" value={pattern} onChange={(e) => setPattern(e.target.value)} />
        <label className="community-checkbox-label">
          <input type="checkbox" checked={isTag} onChange={(e) => setIsTag(e.target.checked)} /> Mute as tag
        </label>
        <button className="community-btn community-btn--primary" onClick={addMute}>Add</button>
      </div>

      {loading ? (
        <div className="community-loading"><div className="community-loading-spinner" /></div>
      ) : items.length === 0 ? (
        <div className="community-empty"><p>No muted words or tags</p></div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="community-list-item">
            <div className="community-muted-info">
              <code className="community-muted-pattern">{item.pattern}</code>
              {item.is_tag === 1 && <span className="community-badge">tag</span>}
            </div>
            <button className="community-btn community-btn--danger community-btn--sm" onClick={() => removeMute(item.id)}>Unmute</button>
          </div>
        ))
      )}
    </div>
  );
}
