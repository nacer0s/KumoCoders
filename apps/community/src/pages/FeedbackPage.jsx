import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';

const CATEGORIES = ['general', 'feature', 'bug', 'improvement'];
const STATUS_LABELS = { open: 'Open', planned: 'Planned', completed: 'Completed', declined: 'Declined' };

function timeAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
}

export default function FeedbackPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('new');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [fbCategory, setFbCategory] = useState('general');
  const [votedItems, setVotedItems] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    params.set('sort', sort);
    fetch(`/api/community/feedback?${params}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, sort]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const res = await fetch('/api/community/feedback', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), body: body.trim(), category: fbCategory }),
    });
    if (res.ok) {
      const item = (await res.json()).item;
      setItems((prev) => [item, ...prev]);
      setTitle(''); setBody(''); setShowForm(false);
      showToast('Feedback submitted!', 'success');
    }
  }

  async function handleVote(id) {
    if (!token) return showToast('Login to vote', 'error');
    const res = await fetch(`/api/community/feedback/${id}/vote`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const { voted } = await res.json();
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, vote_count: i.vote_count + (voted ? 1 : -1) } : i));
      setVotedItems((prev) => { const n = new Set(prev); voted ? n.add(id) : n.delete(id); return n; });
    }
  }

  return (
    <div className="community-page">
      <div className="community-page-header">
        <h1><span className="nf nf-fa-lightbulb" /> Feedback & Suggestions</h1>
        <p>Help shape the future of the platform</p>
      </div>

      <div className="community-feedback-toolbar">
        <div className="community-sort-tabs">
          <button className={`community-sort-tab ${!category ? 'community-sort-tab--active' : ''}`} onClick={() => setCategory('')}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c} className={`community-sort-tab ${category === c ? 'community-sort-tab--active' : ''}`} onClick={() => setCategory(c)}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
        <div className="community-feedback-actions">
          <button className={`community-btn community-btn--sm ${sort === 'new' ? 'community-btn--primary' : 'community-btn--ghost'}`} onClick={() => setSort('new')}>New</button>
          <button className={`community-btn community-btn--sm ${sort === 'top' ? 'community-btn--primary' : 'community-btn--ghost'}`} onClick={() => setSort('top')}>Top</button>
          {user && (
            <button className="community-btn community-btn--primary community-btn--sm" onClick={() => setShowForm(!showForm)}>
              <span className="nf nf-fa-plus" /> {showForm ? 'Cancel' : 'Submit Idea'}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="community-card community-feedback-form">
          <input className="community-input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea className="community-input community-textarea" placeholder="Describe your idea..." value={body} onChange={(e) => setBody(e.target.value)} required />
          <select className="community-select" value={fbCategory} onChange={(e) => setFbCategory(e.target.value)}>
            {CATEGORIES.map((c) => (<option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>))}
          </select>
          <button className="community-btn community-btn--primary">Submit</button>
        </form>
      )}

      {loading ? (
        <div className="community-loading"><div className="community-loading-spinner" /></div>
      ) : items.length === 0 ? (
        <div className="community-empty"><p>No feedback yet. Be the first!</p></div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="community-list-item community-feedback-item">
            <div className="community-feedback-vote">
              <button className={`community-btn community-btn--sm community-btn--icon ${votedItems.has(item.id) ? 'community-btn--primary' : 'community-btn--ghost'}`} onClick={() => handleVote(item.id)}>
                <span className="nf nf-fa-arrow_up" />
              </button>
              <span className="community-feedback-vote-count">{item.vote_count || 0}</span>
            </div>
            <div className="community-feedback-content">
              <div className="community-feedback-meta">
                <span className="community-badge">{item.category}</span>
                <span className={`community-status-badge community-status-badge--${item.status}`}>{STATUS_LABELS[item.status]}</span>
              </div>
              <h3 className="community-feedback-title">{item.title}</h3>
              <p className="community-feedback-body">{item.body?.replace(/<[^>]*>/g, '')}</p>
              <div className="community-feedback-author">
                {item.username && <><UserAvatar user={item} /><span>{item.display_name || item.username}</span></>}
                <span>{timeAgo(item.created_at)}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
