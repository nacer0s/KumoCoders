import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const OUTCOME_COLORS = { accepted: '#4c6', rejected: '#f66', deferred: '#fa4' };

const INITIAL_FORM = {
  title: '', description: '', date: new Date().toISOString().slice(0, 10),
  decidedBy: '', alternatives: '', outcome: 'accepted', tags: '', impact: '',
};

export default function DecisionLogPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [decisions, setDecisions] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  function fetchAll() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/decisionlog/data`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (Array.isArray(d)) setDecisions(d); })
      .catch(() => {});
  }

  useEffect(() => { fetchAll(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  async function handleCreate(e) {
    e.preventDefault();
    const data = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    };
    const res = await fetch(`/api/studio/teams/${teamId}/apps/decisionlog/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data }),
    });
    if (res.ok) {
      setShowCreate(false); setForm({ ...INITIAL_FORM }); fetchAll();
      showToast('Decision logged', 'success');
    } else showToast('Failed to save decision', 'error');
  }

  async function handleDelete(id) {
    await fetch(`/api/studio/apps/data/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    if (showDetail?.id === id) setShowDetail(null);
    fetchAll(); showToast('Decision removed', 'info');
  }

  const filtered = decisions
    .map(d => ({ ...d, parsed: parse(d) }))
    .filter(({ parsed }) => !filter || parsed.outcome === filter)
    .filter(({ parsed }) => !search || parsed.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-scale_balanced" /> Decision Log</h1>
        <button className="studio-btn studio-btn--primary" onClick={() => setShowCreate(true)}>
          <span className="nf nf-fa-plus" /> New Decision
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="studio-input" placeholder="Search decisions..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {['', 'accepted', 'rejected', 'deferred'].map(o => (
            <button key={o} className={`studio-btn ${filter === o ? 'studio-btn--primary' : 'studio-btn--ghost'}`} onClick={() => setFilter(o)} style={{ fontSize: 12, padding: '4px 10px' }}>
              {o || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="s-list">
        {filtered.length === 0 ? (
          <div className="studio-empty">
            <span className="nf nf-fa-scale_balanced studio-empty-icon" />
            <h3>No decisions logged</h3>
            <p className="studio-text-muted">Track key team decisions here</p>
          </div>
        ) : (
          filtered.map(({ id, parsed }) => (
            <div key={id} className="s-list-item" style={{ cursor: 'pointer' }} onClick={() => setShowDetail({ id, parsed })}>
              <div className="s-list-item-info" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <strong>{parsed.title}</strong>
                  <span className="studio-badge" style={{
                    background: `${OUTCOME_COLORS[parsed.outcome]}22`,
                    color: OUTCOME_COLORS[parsed.outcome],
                    border: `1px solid ${OUTCOME_COLORS[parsed.outcome]}44`,
                    fontSize: 11,
                  }}>
                    {parsed.outcome}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="studio-text-muted" style={{ fontSize: 12 }}>
                    <span className="nf nf-fa-user" /> {parsed.decidedBy} — {parsed.date}
                  </span>
                  {(parsed.tags || []).map((tag, i) => (
                    <span key={i} className="studio-badge" style={{ fontSize: 10, background: 'var(--color-surface-hover)', border: 'none' }}>{tag}</span>
                  ))}
                </div>
              </div>
              <span className="nf nf-fa-chevron_right" style={{ opacity: 0.4 }} />
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal" style={{ maxWidth: 560 }}>
            <div className="studio-modal-header">
              <h2>Log Decision</h2>
              <button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}><span className="nf nf-fa-xmark" /></button>
            </div>
            <form onSubmit={handleCreate} className="studio-form">
              <div className="studio-form-row">
                <label className="studio-label">Title <input className="studio-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus /></label>
                <label className="studio-label">Date <input className="studio-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></label>
              </div>
              <label className="studio-label">Description <textarea className="studio-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></label>
              <div className="studio-form-row">
                <label className="studio-label">Decided By <input className="studio-input" value={form.decidedBy} onChange={e => setForm({ ...form, decidedBy: e.target.value })} required /></label>
                <label className="studio-label">Outcome
                  <select className="studio-input" value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="deferred">Deferred</option>
                  </select>
                </label>
              </div>
              <label className="studio-label">Alternatives Considered <textarea className="studio-input" value={form.alternatives} onChange={e => setForm({ ...form, alternatives: e.target.value })} rows={2} placeholder="List alternatives..." /></label>
              <label className="studio-label">Tags <input className="studio-input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="comma, separated" /></label>
              <label className="studio-label">Impact <textarea className="studio-input" value={form.impact} onChange={e => setForm({ ...form, impact: e.target.value })} rows={2} placeholder="Expected impact of this decision" /></label>
              <div className="studio-form-actions">
                <button type="submit" className="studio-btn studio-btn--primary">Save Decision</button>
              </div>
            </form>
          </div>
        </>
      )}

      {showDetail && (
        <>
          <div className="studio-backdrop" onClick={() => setShowDetail(null)} />
          <div className="studio-modal" style={{ maxWidth: 540 }}>
            <div className="studio-modal-header">
              <h2>{showDetail.parsed.title}</h2>
              <button className="studio-btn studio-btn--ghost" onClick={() => setShowDetail(null)}><span className="nf nf-fa-xmark" /></button>
            </div>
            <div style={{ padding: '0 4px' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <div><span className="studio-text-muted">Date:</span> <strong>{showDetail.parsed.date}</strong></div>
                <div><span className="studio-text-muted">Decided by:</span> <strong>{showDetail.parsed.decidedBy}</strong></div>
                <div>
                  <span className="studio-badge" style={{
                    background: `${OUTCOME_COLORS[showDetail.parsed.outcome]}22`,
                    color: OUTCOME_COLORS[showDetail.parsed.outcome],
                    border: `1px solid ${OUTCOME_COLORS[showDetail.parsed.outcome]}44`,
                  }}>
                    {showDetail.parsed.outcome}
                  </span>
                </div>
              </div>
              {showDetail.parsed.description && (
                <div style={{ marginBottom: 12 }}>
                  <div className="studio-text-muted" style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Description</div>
                  <p style={{ margin: 0, fontSize: 14 }}>{showDetail.parsed.description}</p>
                </div>
              )}
              {showDetail.parsed.alternatives && (
                <div style={{ marginBottom: 12 }}>
                  <div className="studio-text-muted" style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Alternatives Considered</div>
                  <p style={{ margin: 0, fontSize: 14 }}>{showDetail.parsed.alternatives}</p>
                </div>
              )}
              {showDetail.parsed.impact && (
                <div style={{ marginBottom: 12 }}>
                  <div className="studio-text-muted" style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Impact</div>
                  <p style={{ margin: 0, fontSize: 14 }}>{showDetail.parsed.impact}</p>
                </div>
              )}
              {(showDetail.parsed.tags || []).length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div className="studio-text-muted" style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Tags</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {showDetail.parsed.tags.map((tag, i) => (
                      <span key={i} className="studio-badge" style={{ background: 'var(--color-surface-hover)', border: 'none' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ fontSize: 11 }} className="studio-text-muted">Created: {new Date(showDetail.parsed.createdAt).toLocaleString()}</div>
              <div className="studio-form-actions">
                <button className="studio-btn studio-btn--danger" onClick={() => handleDelete(showDetail.id)}>
                  <span className="nf nf-fa-trash" /> Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}