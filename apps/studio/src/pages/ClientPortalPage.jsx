import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const APP_SCOPES = [
  { key: 'communicate', label: 'Chat & Calls', icon: 'nf-fa-comments' },
  { key: 'organize', label: 'Tasks & Planning', icon: 'nf-fa-list_check' },
  { key: 'create', label: 'Docs & Files', icon: 'nf-fa-file_lines' },
  { key: 'explore', label: 'Data & Analytics', icon: 'nf-fa-chart_pie' },
  { key: 'people', label: 'People & CRM', icon: 'nf-fa-address_book' },
  { key: 'manage', label: 'Finance', icon: 'nf-fa-money_bill' },
  { key: 'operate', label: 'Operations', icon: 'nf-fa-gears' },
];

export default function ClientPortalPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', scopes: [] });

  function fetchItems() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/clientportal/data`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setItems(d); })
      .catch(() => {});
  }

  useEffect(() => { fetchItems(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  const settingsItem = items.find((i) => i.item_key === 'settings');
  const settings = settingsItem ? parse(settingsItem) : { name: 'Client Portal', welcomeMessage: 'Welcome to our portal!', enabled: false };
  const clients = items.filter((i) => i.item_key?.startsWith('client:'));

  async function saveSettings(updates) {
    const newSettings = { ...settings, ...updates };
    try {
      if (settingsItem) {
        await fetch(`/api/studio/apps/data/${settingsItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ appData: newSettings }),
        });
      } else {
        await fetch(`/api/studio/teams/${teamId}/apps/clientportal/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ itemKey: 'settings', data: newSettings }),
        });
      }
      fetchItems();
      showToast('Settings saved', 'success');
    } catch {
      showToast('Failed to save settings', 'error');
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    try {
      await fetch(`/api/studio/teams/${teamId}/apps/clientportal/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          itemKey: `client:${Date.now()}`,
          data: { name: inviteForm.name, email: inviteForm.email, scopes: inviteForm.scopes, status: 'invited', lastAccess: null },
        }),
      });
      fetchItems();
      setInviteOpen(false);
      setInviteForm({ name: '', email: '', scopes: [] });
      showToast('Client invited', 'success');
    } catch {
      showToast('Failed to invite', 'error');
    }
  }

  async function revokeClient(item) {
    const d = parse(item);
    d.status = 'revoked';
    await fetch(`/api/studio/apps/data/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ appData: d }),
    });
    fetchItems();
    showToast('Access revoked', 'info');
  }

  function toggleScope(scope) {
    setInviteForm((f) => ({
      ...f,
      scopes: f.scopes.includes(scope) ? f.scopes.filter((s) => s !== scope) : [...f.scopes, scope],
    }));
  }

  const statusColors = { invited: '#fa4', active: '#4c6', revoked: '#f66' };

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-user_group" /> Client Portal</h1>
      </div>

      <div className="glass" style={{ padding: 20, borderRadius: 12, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px' }}>Portal Settings</h3>
        <div className="studio-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label className="studio-label">
            Portal Name
            <input className="studio-input" value={settings.name} onChange={(e) => saveSettings({ name: e.target.value })} />
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <label className="studio-label" style={{ flex: 1 }}>
              Enabled
              <input type="checkbox" checked={settings.enabled} onChange={(e) => saveSettings({ enabled: e.target.checked })} />
            </label>
            {settings.enabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 8px' }}>
                <span className="nf nf-fa-share" style={{ color: 'var(--color-text-muted)' }} />
                <code style={{ fontSize: 12 }}>/portal/{teamId}</code>
              </div>
            )}
          </div>
        </div>
        <label className="studio-label" style={{ marginTop: 8 }}>
          Welcome Message
          <textarea className="studio-input" rows={2} value={settings.welcomeMessage} onChange={(e) => saveSettings({ welcomeMessage: e.target.value })} />
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Clients</h3>
        <button className="studio-btn studio-btn--primary" onClick={() => setInviteOpen(true)}>
          <span className="nf nf-fa-user_plus" /> Invite Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="studio-empty"><h3>No clients invited yet</h3></div>
      ) : (
        clients.map((c) => {
          const d = parse(c);
          return (
            <div key={c.id} className="s-list-item" style={{ alignItems: 'center' }}>
              <div className="s-list-item-info" style={{ flex: 1 }}>
                <strong>{d.name}</strong>
                <span className="studio-text-muted">{d.email}</span>
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  {(d.scopes || []).map((s) => {
                    const scope = APP_SCOPES.find((a) => a.key === s);
                    return scope ? <span key={s} className="studio-btn" style={{ fontSize: 10, padding: '2px 6px', opacity: 0.7 }}>{scope.label}</span> : null;
                  })}
                </div>
              </div>
              <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: statusColors[d.status] + '22', color: statusColors[d.status] }}>
                {d.status}
              </span>
              {d.lastAccess && <span className="studio-text-muted" style={{ fontSize: 11, marginLeft: 8 }}>{new Date(d.lastAccess).toLocaleDateString()}</span>}
              {d.status === 'active' && (
                <button className="studio-btn" style={{ fontSize: 12, marginLeft: 8 }} onClick={() => revokeClient(c)}>
                  <span className="nf nf-fa_xmark" /> Revoke
                </button>
              )}
            </div>
          );
        })
      )}

      {inviteOpen && (
        <>
          <div className="studio-backdrop" onClick={() => setInviteOpen(false)} />
          <div className="studio-modal s-modal-wide">
            <div className="studio-modal-header">
              <h2>Invite Client</h2>
              <button className="studio-btn studio-btn--ghost" onClick={() => setInviteOpen(false)}><span className="nf nf-fa-xmark" /></button>
            </div>
            <form onSubmit={handleInvite} className="studio-form">
              <label className="studio-label">Name <input className="studio-input" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} required /></label>
              <label className="studio-label">Email <input className="studio-input" type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} required /></label>
              <div className="studio-label">App Access</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                {APP_SCOPES.map((s) => (
                  <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={inviteForm.scopes.includes(s.key)} onChange={() => toggleScope(s.key)} />
                    <span className={`nf ${s.icon}`} />
                    {s.label}
                  </label>
                ))}
              </div>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Send Invite</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
