import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const TRIGGER_TYPES = [
  { key: 'task.status_changed', label: 'Task Status Changed', icon: 'nf-fa-list_check', configFields: [{ key: 'fromStatus', label: 'From Status' }, { key: 'toStatus', label: 'To Status' }] },
  { key: 'file.uploaded', label: 'File Uploaded', icon: 'nf-fa-upload', configFields: [{ key: 'fileType', label: 'File Type' }] },
  { key: 'event.created', label: 'Event Created', icon: 'nf-fa-calendar_plus', configFields: [] },
  { key: 'schedule.daily', label: 'Daily Schedule', icon: 'nf-fa_clock', configFields: [{ key: 'time', label: 'Time (HH:MM)' }] },
];

const ACTION_TYPES = [
  { key: 'notify.channel', label: 'Notify Channel', icon: 'nf-fa-bell', configFields: [{ key: 'channelId', label: 'Channel ID' }, { key: 'message', label: 'Message' }] },
  { key: 'task.create', label: 'Create Task', icon: 'nf-fa-plus_circle', configFields: [{ key: 'title', label: 'Title' }, { key: 'description', label: 'Description' }, { key: 'assigneeId', label: 'Assignee ID' }] },
  { key: 'email.send', label: 'Send Email', icon: 'nf-fa-envelope', configFields: [{ key: 'to', label: 'To' }, { key: 'subject', label: 'Subject' }, { key: 'body', label: 'Body' }] },
  { key: 'webhook.call', label: 'Call Webhook', icon: 'nf-fa_link', configFields: [{ key: 'url', label: 'URL' }, { key: 'method', label: 'Method' }, { key: 'body', label: 'Body' }] },
];

function getTrigger(t) { return TRIGGER_TYPES.find((x) => x.key === t); }
function getAction(a) { return ACTION_TYPES.find((x) => x.key === a); }

export default function AutomationsPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', description: '', triggerType: 'task.status_changed', triggerConfig: {}, actionType: 'notify.channel', actionConfig: {} });
  const [testing, setTesting] = useState(null);

  function fetchItems() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/automations/data`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setItems(d); })
      .catch(() => {});
  }

  useEffect(() => { fetchItems(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

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

  async function handleSave() {
    try {
      await fetch(`/api/studio/teams/${teamId}/apps/automations/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          itemKey: `auto_${Date.now()}`,
          data: { ...form, enabled: true, createdAt: new Date().toISOString() },
        }),
      });
      fetchItems();
      setModalOpen(false);
      setStep(1);
      setForm({ name: '', description: '', triggerType: 'task.status_changed', triggerConfig: {}, actionType: 'notify.channel', actionConfig: {} });
      showToast('Automation created', 'success');
    } catch {
      showToast('Failed to create', 'error');
    }
  }

  async function handleTest(item) {
    setTesting(item.id);
    try {
      const res = await fetch(`/api/studio/automations/${item.id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) showToast('Test run triggered', 'success');
      else showToast('Test run failed', 'error');
    } catch {
      showToast('Test run failed', 'error');
    }
    setTesting(null);
  }

  function updateConfig(section, key, val) {
    if (section === 'trigger') setForm({ ...form, triggerConfig: { ...form.triggerConfig, [key]: val } });
    else setForm({ ...form, actionConfig: { ...form.actionConfig, [key]: val } });
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-bolt" /> Automations</h1>
        <button className="studio-btn studio-btn--primary" onClick={() => { setModalOpen(true); setStep(1); }}>
          <span className="nf nf-fa-plus" /> New Automation
        </button>
      </div>

      {items.length === 0 ? (
        <div className="studio-empty"><span className="nf nf-fa-bolt studio-empty-icon" /><h3>No automations yet</h3></div>
      ) : (
        items.map((item) => {
          const d = parse(item);
          const trigger = getTrigger(d.triggerType);
          const action = getAction(d.actionType);
          return (
            <div key={item.id} className="glass" style={{ padding: 16, borderRadius: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong>{d.name}</strong>
                  <span className="studio-text-muted" style={{ fontSize: 11 }}>{d.description}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 13 }}>
                  <span><span className={`nf ${trigger?.icon || 'nf-fa-question'}`} style={{ marginRight: 4 }} /> {trigger?.label || d.triggerType}</span>
                  <span className="studio-text-muted" style={{ opacity: 0.5 }}>→</span>
                  <span><span className={`nf ${action?.icon || 'nf-fa-question'}`} style={{ marginRight: 4 }} /> {action?.label || d.actionType}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="studio-btn" style={{ fontSize: 12 }} onClick={() => handleTest(item)} disabled={testing === item.id}>
                  {testing === item.id ? '...' : <><span className="nf nf-fa-flask" /> Test</>}
                </button>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={d.enabled} onChange={(e) => handleToggle(item, e.target.checked)} />
                  {d.enabled ? 'On' : 'Off'}
                </label>
              </div>
            </div>
          );
        })
      )}

      {modalOpen && (
        <>
          <div className="studio-backdrop" onClick={() => setModalOpen(false)} />
          <div className="studio-modal s-modal-wide">
            <div className="studio-modal-header">
              <h2>New Automation <span className="studio-text-muted" style={{ fontSize: 13, fontWeight: 400 }}>(step {step}/4)</span></h2>
              <button className="studio-btn studio-btn--ghost" onClick={() => setModalOpen(false)}><span className="nf nf-fa-xmark" /></button>
            </div>
            <div className="studio-form">
              {step === 1 && (
                <>
                  <label className="studio-label">Name <input className="studio-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Notify on bug close" autoFocus /></label>
                  <label className="studio-label">Description <textarea className="studio-input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this automation do?" /></label>
                </>
              )}
              {step === 2 && (
                <>
                  <label className="studio-label">Trigger Type
                    <select className="studio-input" value={form.triggerType} onChange={(e) => setForm({ ...form, triggerType: e.target.value, triggerConfig: {} })}>
                      {TRIGGER_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  </label>
                  {getTrigger(form.triggerType)?.configFields.map((f) => (
                    <label key={f.key} className="studio-label">
                      {f.label}
                      <input className="studio-input" value={form.triggerConfig[f.key] || ''} onChange={(e) => updateConfig('trigger', f.key, e.target.value)} placeholder={f.label} />
                    </label>
                  ))}
                </>
              )}
              {step === 3 && (
                <>
                  <label className="studio-label">Action Type
                    <select className="studio-input" value={form.actionType} onChange={(e) => setForm({ ...form, actionType: e.target.value, actionConfig: {} })}>
                      {ACTION_TYPES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                    </select>
                  </label>
                  {getAction(form.actionType)?.configFields.map((f) => (
                    <label key={f.key} className="studio-label">
                      {f.label}
                      {f.key === 'body' || f.key === 'description' || f.key === 'message' ? (
                        <textarea className="studio-input" rows={2} value={form.actionConfig[f.key] || ''} onChange={(e) => updateConfig('action', f.key, e.target.value)} placeholder={f.label} />
                      ) : (
                        <input className="studio-input" value={form.actionConfig[f.key] || ''} onChange={(e) => updateConfig('action', f.key, e.target.value)} placeholder={f.label} />
                      )}
                    </label>
                  ))}
                </>
              )}
              {step === 4 && (
                <div className="glass" style={{ padding: 16, borderRadius: 8 }}>
                  <h4 style={{ margin: '0 0 8px' }}>{form.name || 'Untitled Automation'}</h4>
                  <p className="studio-text-muted" style={{ margin: '0 0 12px', fontSize: 13 }}>{form.description}</p>
                  <div style={{ fontSize: 13 }}>
                    <div><span className={`nf ${getTrigger(form.triggerType)?.icon || 'nf-fa-question'}`} /> Trigger: {getTrigger(form.triggerType)?.label}</div>
                    <div style={{ marginLeft: 20, fontSize: 12, opacity: 0.7 }}>{JSON.stringify(form.triggerConfig)}</div>
                    <div style={{ marginTop: 4 }}><span className={`nf ${getAction(form.actionType)?.icon || 'nf-fa-question'}`} /> Action: {getAction(form.actionType)?.label}</div>
                    <div style={{ marginLeft: 20, fontSize: 12, opacity: 0.7 }}>{JSON.stringify(form.actionConfig)}</div>
                  </div>
                </div>
              )}
              <div className="studio-form-actions" style={{ justifyContent: 'space-between' }}>
                <div>
                  {step > 1 && <button type="button" className="studio-btn" onClick={() => setStep(step - 1)}><span className="nf nf-fa-arrow_left" /> Back</button>}
                </div>
                <div>
                  {step < 4 ? (
                    <button type="button" className="studio-btn studio-btn--primary" onClick={() => setStep(step + 1)} disabled={step === 1 && !form.name.trim()}>
                      Next <span className="nf nf-fa-arrow_right" />
                    </button>
                  ) : (
                    <button type="button" className="studio-btn studio-btn--primary" onClick={handleSave}>
                      <span className="nf nf-fa-floppy_disk" /> Save Automation
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
