import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const STAGES = ['applied', 'screened', 'interviewed', 'offered', 'hired', 'rejected'];
const STAGE_COLORS = { applied: '#888', screened: '#4af', interviewed: '#fa4', offered: '#48f', hired: '#4c6', rejected: '#f66' };

export default function RecruitmentPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [form, setForm] = useState({ title: '', department: '', location: '', description: '', status: 'open' });
  const [appForm, setAppForm] = useState({ name: '', email: '', stage: 'applied', resumeUrl: '', notes: '' });

  function loadData() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/recruitment/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setItems(d); }).catch(() => {});
  }
  useEffect(() => { loadData(); }, [teamId, token]);

  function parse(i) { return typeof i.data === 'string' ? JSON.parse(i.data) : (i.data || {}); }

  async function handleCreate(e) {
    e.preventDefault();
    await fetch(`/api/studio/teams/${teamId}/apps/recruitment/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { ...form, applicants: [] } }),
    });
    setShow(false); setForm({ title: '', department: '', location: '', description: '', status: 'open' }); loadData();
    showToast('Job created', 'success');
  }

  async function addApplicant(job) {
    if (!appForm.name.trim() || !appForm.email.trim()) return;
    const d = parse(job);
    d.applicants = [...(d.applicants || []), { ...appForm }];
    await fetch(`/api/studio/apps/data/${job.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    setAppForm({ name: '', email: '', stage: 'applied', resumeUrl: '', notes: '' });
    loadData();
    showToast('Applicant added', 'success');
  }

  async function moveApplicant(job, appIdx, newStage) {
    const d = parse(job);
    d.applicants[appIdx].stage = newStage;
    await fetch(`/api/studio/apps/data/${job.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    loadData();
  }

  const openJobs = items.filter(i => parse(i).status === 'open' || parse(i).status === 'paused');

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-users" /> Recruitment</h1><button className="studio-btn studio-btn--primary" onClick={() => setShow(true)}><span className="nf nf-fa-plus" /> New Job</button></div>
      {!activeJob ? (
        <div className="s-list">
          {items.map(item => {
            const d = parse(item);
            const counts = STAGES.map(s => (d.applicants || []).filter(a => a.stage === s).length);
            return (
              <div key={item.id} className="s-list-item" onClick={() => setActiveJob(item)} style={{ cursor: 'pointer' }}>
                <span className="nf nf-fa-briefcase" style={{ opacity: 0.5 }} />
                <div className="s-list-item-info"><strong>{d.title}</strong><span className="studio-text-muted">{d.department} · {d.location} · {d.status}</span></div>
                {counts.map((c, i) => c > 0 && <span key={i} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: (STAGE_COLORS[STAGES[i]] || '#888') + '22', color: STAGE_COLORS[STAGES[i]] || '#888' }}>{STAGES[i]}: {c}</span>)}
              </div>
            );
          })}
          {items.length === 0 && <div className="studio-empty"><span className="nf nf-fa-users studio-empty-icon" /><h3>No job postings</h3></div>}
        </div>
      ) : (
        <div>
          <button className="studio-btn studio-btn--ghost" onClick={() => setActiveJob(null)} style={{ marginBottom: 12 }}><span className="nf nf-fa-arrow_left" /> Back</button>
          {(() => { const d = parse(activeJob); return (
            <div>
              <div className="studio-page-header" style={{ marginBottom: 12 }}><h2 style={{ fontSize: 18 }}>{d.title} <span className="studio-text-muted" style={{ fontSize: 13, fontWeight: 400 }}>{d.department} · {d.location}</span></h2>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="studio-input" style={{ width: 160 }} value={appForm.name} onChange={e => setAppForm({ ...appForm, name: e.target.value })} placeholder="Name" />
                  <input className="studio-input" style={{ width: 180 }} value={appForm.email} onChange={e => setAppForm({ ...appForm, email: e.target.value })} placeholder="Email" />
                  <button className="studio-btn studio-btn--primary studio-btn--sm" onClick={() => addApplicant(activeJob)}>Add</button>
                </div>
              </div>
              <div className="s-kanban">
                {STAGES.map(stage => {
                  const apps = (d.applicants || []).filter(a => a.stage === stage);
                  return (
                    <div key={stage} className="s-kanban-col">
                      <div className="s-kanban-col-header">{stage} ({apps.length})</div>
                      <div className="s-kanban-cards">
                        {apps.map((app, i) => (
                          <div key={i} className="s-kanban-card">
                            <div className="s-kanban-card-top"><strong style={{ fontSize: 13 }}>{app.name}</strong>
                              <select className="studio-select" style={{ fontSize: 10, padding: '2px 4px' }} value={app.stage} onChange={e => moveApplicant(activeJob, (d.applicants || []).indexOf(app), e.target.value)}>
                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div className="studio-text-muted" style={{ fontSize: 11 }}>{app.email}</div>
                            {app.resumeUrl && <div style={{ fontSize: 11 }}><a href={app.resumeUrl} target="_blank" rel="noopener noreferrer">Resume</a></div>}
                            {app.notes && <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>{app.notes}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ); })()}
        </div>
      )}
      {show && (
        <>
          <div className="studio-backdrop" onClick={() => setShow(false)} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>New Job Posting</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShow(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleCreate} className="studio-form">
              <div className="studio-form-row">
                <label className="studio-label">Title <input className="studio-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus /></label>
                <label className="studio-label">Department <input className="studio-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></label>
              </div>
              <div className="studio-form-row">
                <label className="studio-label">Location <input className="studio-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></label>
                <label className="studio-label">Status <select className="studio-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="open">Open</option><option value="paused">Paused</option><option value="closed">Closed</option></select></label>
              </div>
              <label className="studio-label">Description <textarea className="studio-input" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Create</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
