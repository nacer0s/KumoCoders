import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function EmailPage({ teamId }) {
  const { token } = useAuth();
  const [config, setConfig] = useState({ host: '', port: '587', user: '', pass: '', from: '' });
  const [incoming, setIncoming] = useState([]);
  const [saved, setSaved] = useState(null);
  const [testStatus, setTestStatus] = useState('');

  function fetchAll() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/email/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => {
        if (!Array.isArray(d)) return;
        const cfg = d.find(i => i.itemKey === 'config' || !i.itemKey);
        if (cfg) { const data = typeof cfg.data === 'string' ? JSON.parse(cfg.data) : (cfg.data || {}); setConfig(prev => ({ ...prev, ...data })); setSaved(cfg); }
        const msgs = d.filter(i => (typeof i.data === 'string' ? JSON.parse(i.data) : i.data)?.type === 'incoming');
        setIncoming(msgs);
      }).catch(() => {});
  }

  useEffect(() => { fetchAll(); }, [teamId, token]);

  async function handleSave(e) {
    e.preventDefault();
    const body = { appData: { host: config.host, port: config.port, user: config.user, pass: config.pass, from: config.from } };
    let res;
    if (saved) {
      res = await fetch(`/api/studio/apps/data/${saved.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    } else {
      res = await fetch(`/api/studio/teams/${teamId}/apps/email/data`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itemKey: 'config', data: { host: config.host, port: config.port, user: config.user, pass: config.pass, from: config.from } }) });
    }
    if (res.ok) fetchAll();
  }

  async function handleTest() {
    setTestStatus('Sending...');
    try {
      const res = await fetch(`/api/studio/teams/${teamId}/apps/email/test`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ host: config.host, port: Number(config.port), user: config.user, pass: config.pass, from: config.from }) });
      const data = await res.json();
      setTestStatus(res.ok ? (data.message || 'Test email sent!') : (data.error || 'Failed'));
    } catch { setTestStatus('Network error'); }
  }

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-envelope" /> Email</h1></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="glass" style={{ padding: 20, borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 16px' }}>SMTP Configuration</h3>
          <form onSubmit={handleSave} className="studio-form">
            <div className="studio-form-row">
              <label className="studio-label">Host <input className="studio-input" value={config.host} onChange={e => setConfig({ ...config, host: e.target.value })} placeholder="smtp.example.com" /></label>
              <label className="studio-label">Port <input className="studio-input" value={config.port} onChange={e => setConfig({ ...config, port: e.target.value })} placeholder="587" /></label>
            </div>
            <label className="studio-label">Username <input className="studio-input" value={config.user} onChange={e => setConfig({ ...config, user: e.target.value })} /></label>
            <label className="studio-label">Password <input className="studio-input" type="password" value={config.pass} onChange={e => setConfig({ ...config, pass: e.target.value })} /></label>
            <label className="studio-label">From Address <input className="studio-input" type="email" value={config.from} onChange={e => setConfig({ ...config, from: e.target.value })} placeholder="noreply@example.com" /></label>
            <div className="studio-form-actions" style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="studio-btn studio-btn--primary">Save</button>
              <button type="button" className="studio-btn studio-btn--ghost" onClick={handleTest}>Send Test Email</button>
            </div>
            {testStatus && <div className="studio-text-muted" style={{ marginTop: 8, fontSize: 13 }}>{testStatus}</div>}
          </form>
        </div>
        <div>
          <h3 style={{ margin: '0 0 16px' }}>Incoming Emails</h3>
          <div className="s-list">
            {incoming.length === 0 ? (
              <div className="studio-empty" style={{ padding: 20 }}><span className="nf nf-fa-envelope studio-empty-icon" /><h3>No emails yet</h3></div>
            ) : (
              incoming.map(e => {
                const d = parse(e);
                return (
                  <div key={e.id} className="s-list-item glass" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
                    <strong>{d.subject || '(No subject)'}</strong>
                    <div className="studio-text-muted" style={{ fontSize: 12 }}>From: {d.from || 'Unknown'} · {e.created_at ? new Date(e.created_at).toLocaleString() : ''}</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>{d.body || d.text || ''}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
