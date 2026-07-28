import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const INTEGRATIONS = [
  { type: 'github', label: 'GitHub', icon: 'nf-fa-github', desc: 'Sync issues, PRs, and commits' },
  { type: 'slack', label: 'Slack', icon: 'nf-fa-slack', desc: 'Notifications and messaging' },
  { type: 'google_drive', label: 'Google Drive', icon: 'nf-fa-google_drive', desc: 'File storage and sharing' },
  { type: 'figma', label: 'Figma', icon: 'nf-fa-figma', desc: 'Design file collaboration' },
  { type: 'stripe', label: 'Stripe', icon: 'nf-fa-stripe', desc: 'Payments and invoicing' },
];

export default function IntegrationsPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [showConfig, setShowConfig] = useState(null);
  const [form, setForm] = useState({ name: '', apiKey: '', webhookUrl: '' });
  const [testing, setTesting] = useState(null);

  function fetchItems() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/integrations/data`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setItems(d); })
      .catch(() => {});
  }

  useEffect(() => { fetchItems(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  function getIntegration(type) {
    return items.find((i) => parse(i).type === type);
  }

  function openConnect(int) {
    setShowConfig(int);
    const existing = getIntegration(int.type);
    if (existing) {
      const d = parse(existing);
      setForm({ name: d.name || '', apiKey: d.config?.apiKey || '', webhookUrl: d.config?.webhookUrl || '' });
    } else {
      setForm({ name: int.label, apiKey: '', webhookUrl: '' });
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!showConfig) return;
    const existing = getIntegration(showConfig.type);
    const payload = { type: showConfig.type, name: form.name, config: { apiKey: form.apiKey, webhookUrl: form.webhookUrl }, enabled: true, lastSync: null };
    try {
      if (existing) {
        await fetch(`/api/studio/apps/data/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ appData: payload }),
        });
      } else {
        await fetch(`/api/studio/teams/${teamId}/apps/integrations/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ itemKey: `int_${showConfig.type}`, data: payload }),
        });
      }
      fetchItems();
      setShowConfig(null);
      showToast(`${showConfig.label} saved`, 'success');
    } catch {
      showToast('Failed to save', 'error');
    }
  }

  async function handleToggle(item, enabled) {
    const d = parse(item);
    d.enabled = enabled;
    await fetch(`/api/studio/apps/data/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ appData: d }),
    });
    fetchItems();
  }

  async function handleDisconnect(item) {
    await fetch(`/api/studio/apps/data/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
    showToast('Integration disconnected', 'info');
  }

  async function handleTest(item) {
    setTesting(item.id);
    try {
      const res = await fetch(`/api/studio/integrations/${item.id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) showToast('Connection successful', 'success');
      else showToast('Connection failed', 'error');
    } catch {
      showToast('Connection failed', 'error');
    }
    setTesting(null);
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-plug" /> Integrations</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {INTEGRATIONS.map((int) => {
          const item = getIntegration(int.type);
          const d = item ? parse(item) : null;
          const connected = !!d?.enabled;
          return (
            <div key={int.type} className="glass" style={{ padding: 20, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`nf ${int.icon}`} style={{ fontSize: 28, color: 'var(--color-primary)' }} />
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 15 }}>{int.label}</strong>
                  <div className="studio-text-muted" style={{ fontSize: 12 }}>{int.desc}</div>
                </div>
                {connected && (
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4c6', flexShrink: 0 }} title="Connected" />
                )}
              </div>
              {connected ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="studio-btn" style={{ flex: 1, fontSize: 12 }} onClick={() => openConnect(int)}>
                    <span className="nf nf-fa-gear" /> Configure
                  </button>
                  <button className="studio-btn" style={{ flex: 1, fontSize: 12 }} onClick={() => handleTest(item)} disabled={testing === item?.id}>
                    {testing === item?.id ? 'Testing...' : <><span className="nf nf-fa-flask" /> Test</>}
                  </button>
                  <button className="studio-btn studio-btn--danger" style={{ fontSize: 12 }} onClick={() => handleDisconnect(item)}>
                    <span className="nf nf-fa-plug_circle_xmark" />
                  </button>
                </div>
              ) : (
                <button className="studio-btn studio-btn--primary" style={{ marginTop: 8 }} onClick={() => openConnect(int)}>
                  <span className="nf nf-fa-link" /> Connect
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showConfig && (
        <>
          <div className="studio-backdrop" onClick={() => setShowConfig(null)} />
          <div className="studio-modal">
            <div className="studio-modal-header">
              <h2><span className={`nf ${showConfig.icon}`} /> {showConfig.label}</h2>
              <button className="studio-btn studio-btn--ghost" onClick={() => setShowConfig(null)}>
                <span className="nf nf-fa-xmark" />
              </button>
            </div>
            <form onSubmit={handleSave} className="studio-form">
              <label className="studio-label">
                Integration Name
                <input className="studio-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label className="studio-label">
                API Key
                <input className="studio-input" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="sk-..." />
              </label>
              <label className="studio-label">
                Webhook URL
                <input className="studio-input" value={form.webhookUrl} onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })} placeholder="https://..." />
              </label>
              <div className="studio-form-actions">
                <button type="submit" className="studio-btn studio-btn--primary">Save</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
