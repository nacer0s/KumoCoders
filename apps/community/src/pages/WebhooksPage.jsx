import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const EVENT_OPTIONS = [
  'post.created', 'post.liked', 'post.commented',
  'badge.earned', 'follow.received',
];

export default function WebhooksPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState(['post.created']);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/community/webhooks', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setWebhooks(d.webhooks || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  function toggleEvent(e) {
    setEvents((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);
  }

  async function createWebhook() {
    if (!url.trim() || events.length === 0) return;
    const res = await fetch('/api/community/webhooks', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim(), events }),
    });
    if (res.ok) {
      const wh = await res.json();
      setWebhooks((prev) => [...prev, wh]);
      setUrl(''); setEvents(['post.created']); setShowForm(false);
      showToast('Webhook created!', 'success');
    }
  }

  async function deleteWebhook(id) {
    if (!confirm('Delete this webhook?')) return;
    await fetch(`/api/community/webhooks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    showToast('Webhook deleted', 'info');
  }

  return (
    <div className="community-page">
      <div className="community-page-header">
        <h1><span className="nf nf-fa-plug" /> Webhooks</h1>
        <p>Send events to external services</p>
      </div>

      <div className="community-section-actions">
        <button className="community-btn community-btn--primary" onClick={() => setShowForm(!showForm)}>
          <span className="nf nf-fa-plus" /> {showForm ? 'Cancel' : 'New Webhook'}
        </button>
      </div>

      {showForm && (
        <div className="community-card community-form-card-inline">
          <input className="community-input" placeholder="https://example.com/webhook" value={url} onChange={(e) => setUrl(e.target.value)} />
          <div className="community-webhook-events">
            <span className="community-label">Events:</span>
            <div className="community-checkbox-group">
              {EVENT_OPTIONS.map((e) => (
                <label key={e} className="community-checkbox-label">
                  <input type="checkbox" checked={events.includes(e)} onChange={() => toggleEvent(e)} />
                  {e}
                </label>
              ))}
            </div>
          </div>
          <button className="community-btn community-btn--primary" onClick={createWebhook}>Create Webhook</button>
        </div>
      )}

      {loading ? (
        <div className="community-loading"><div className="community-loading-spinner" /></div>
      ) : webhooks.length === 0 ? (
        <div className="community-empty"><p>No webhooks configured</p></div>
      ) : (
        webhooks.map((wh) => (
          <div key={wh.id} className="community-list-item community-webhook-item">
            <div className="community-webhook-info">
              <code className="community-webhook-url">{wh.url}</code>
              <div className="community-badge-row">
                {(JSON.parse(wh.events) || []).map((ev) => (
                  <span key={ev} className="community-badge">{ev}</span>
                ))}
              </div>
            </div>
            <button className="community-btn community-btn--danger community-btn--sm" onClick={() => deleteWebhook(wh.id)}>Delete</button>
          </div>
        ))
      )}
    </div>
  );
}
