import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function CRMPage({ teamId }) {
  const { token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', stage: 'lead', notes: '' });

  function loadData() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/crm/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setContacts(d); }).catch(() => {});
  }
  useEffect(() => { loadData(); }, [teamId, token]);

  function parse(i) { return typeof i.data === 'string' ? JSON.parse(i.data) : (i.data || {}); }

  function reset() { setForm({ name: '', email: '', phone: '', company: '', stage: 'lead', notes: '' }); setEdit(null); }

  async function save(e) {
    e.preventDefault();
    if (edit) {
      await fetch(`/api/studio/apps/data/${edit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: form }) });
    } else {
      await fetch(`/api/studio/teams/${teamId}/apps/crm/data`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itemKey: Date.now().toString(), data: form }) });
    }
    setShow(false); reset(); loadData();
  }

  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
  const stageColors = { lead: '#4af', qualified: '#84f', proposal: '#fa4', negotiation: '#f84', 'closed-won': '#4c6', 'closed-lost': '#f66' };

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-users" /> CRM / Contacts</h1>
        <button className="studio-btn studio-btn--primary" onClick={() => { reset(); setShow(true); }}><span className="nf nf-fa-plus" /> Add Contact</button>
      </div>
      <div className="s-kanban" style={{ paddingBottom: 0 }}>
        {stages.map(stage => (
          <div key={stage} className="s-kanban-col" style={{ minWidth: 180 }}>
            <div className="s-kanban-col-header" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: stageColors[stage], marginRight: 4 }} />{stage} ({contacts.filter(c => parse(c).stage === stage).length})</div>
            <div className="s-kanban-cards">
              {contacts.filter(c => parse(c).stage === stage).map(c => {
                const d = parse(c);
                return (
                  <div key={c.id} className="s-kanban-card" style={{ borderLeftColor: stageColors[stage] }}
                    onClick={() => { setEdit(c); setForm({ name: d.name, email: d.email || '', phone: d.phone || '', company: d.company || '', stage: d.stage, notes: d.notes || '' }); setShow(true); }}>
                    <strong style={{ fontSize: 13 }}>{d.name}</strong>
                    {d.email && <span className="studio-text-muted" style={{ fontSize: 11 }}>{d.email}</span>}
                    {d.company && <span className="studio-text-muted" style={{ fontSize: 11 }}>{d.company}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {show && (
        <>
          <div className="studio-backdrop" onClick={() => { setShow(false); reset(); }} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>{edit ? 'Edit' : 'New'} Contact</h2><button className="studio-btn studio-btn--ghost" onClick={() => { setShow(false); reset(); }}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={save} className="studio-form">
              <label className="studio-label">Name <input className="studio-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus /></label>
              <label className="studio-label">Email <input className="studio-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
              <label className="studio-label">Phone <input className="studio-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
              <label className="studio-label">Company <input className="studio-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></label>
              <label className="studio-label">Stage <select className="studio-input" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>{stages.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
              <label className="studio-label">Notes <textarea className="studio-input" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">{edit ? 'Update' : 'Create'}</button>
                {edit && <button type="button" className="studio-btn studio-btn--ghost" onClick={async () => { await fetch(`/api/studio/apps/data/${edit.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); setShow(false); reset(); loadData(); }}>Delete</button>}
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
