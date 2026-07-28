import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function PerformanceReviewsPage({ teamId }) {
  const { token } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [members, setMembers] = useState([]);
  const [show, setShow] = useState(false);
  const [openCycle, setOpenCycle] = useState(null);
  const [reviewForm, setReviewForm] = useState({ userId: '', selfAssessment: '', peerFeedback: '', managerReview: '', overallRating: 5 });

  function load() {
    if (!token) return;
    Promise.all([
      fetch(`/api/studio/teams/${teamId}/members`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch(`/api/studio/teams/${teamId}/apps/performancereviews/data`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
    ]).then(([m, c]) => { if (Array.isArray(m)) setMembers(m); if (Array.isArray(c)) setCycles(c); }).catch(() => {});
  }
  useEffect(() => { load(); }, [teamId, token]);

  function parse(i) { return typeof i.data === 'string' ? JSON.parse(i.data) : (i.data || {}); }

  async function createCycle() {
    const name = prompt('Cycle name (e.g. Q1 2026):');
    if (!name) return;
    await fetch(`/api/studio/teams/${teamId}/apps/performancereviews/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { name, status: 'active', reviewees: [] } }),
    });
    load();
  }

  async function addReviewee(cycle) {
    const userId = prompt('Enter user ID to add as reviewee:');
    if (!userId) return;
    const d = parse(cycle);
    d.reviewees = [...(d.reviewees || []), { userId: parseInt(userId), selfAssessment: '', peerFeedback: '', managerReview: '', overallRating: 0, status: 'draft' }];
    await fetch(`/api/studio/apps/data/${cycle.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    load();
  }

  async function saveReview(cycle) {
    const d = parse(cycle);
    const idx = d.reviewees.findIndex(r => r.userId == reviewForm.userId);
    if (idx >= 0) d.reviewees[idx] = { ...d.reviewees[idx], ...reviewForm, status: 'completed' };
    await fetch(`/api/studio/apps/data/${cycle.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    setShow(false); load();
  }

  function memberName(id) { const m = members.find(x => x.user_id == id); return m?.display_name || m?.username || `User #${id}`; }

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-star" /> Performance Reviews</h1>
        <button className="studio-btn studio-btn--primary" onClick={createCycle}><span className="nf nf-fa-plus" /> New Cycle</button>
      </div>
      {cycles.map(c => {
        const d = parse(c);
        const isOpen = openCycle === c.id;
        const completed = d.reviewees?.filter(r => r.status === 'completed').length || 0;
        const total = d.reviewees?.length || 0;
        return (
          <div key={c.id} className="s-review-cycle glass" style={{ marginBottom: 12 }}>
            <div className="s-review-header" onClick={() => setOpenCycle(isOpen ? null : c.id)} style={{ cursor: 'pointer' }}>
              <div><strong>{d.name}</strong> <span className="studio-text-muted" style={{ fontSize: 12 }}>({completed}/{total} completed)</span></div>
              <span className={`nf nf-fa-chevron_down ${isOpen ? '' : 'studio-category-chevron--closed'}`} />
            </div>
            {isOpen && (
              <div style={{ padding: 'var(--space-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {d.reviewees?.map(r => (
                    <div key={r.userId} className="s-review-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm)', background: 'var(--color-bg)', borderRadius: 8 }}>
                      <div><strong>{memberName(r.userId)}</strong> <span className="studio-badge" style={{ fontSize: 10 }}>{r.status}</span> {r.overallRating > 0 && <span style={{ marginLeft: 8, fontWeight: 600, color: r.overallRating >= 4 ? '#4c6' : r.overallRating >= 3 ? '#fa4' : '#f66' }}>{r.overallRating}/5</span>}</div>
                      <button className="studio-btn studio-btn--ghost" style={{ fontSize: 12 }} onClick={() => { setReviewForm({ userId: r.userId, selfAssessment: r.selfAssessment || '', peerFeedback: r.peerFeedback || '', managerReview: r.managerReview || '', overallRating: r.overallRating || 5 }); setShow(true); }}>{r.status === 'completed' ? 'Edit' : 'Review'}</button>
                    </div>
                  ))}
                </div>
                <button className="studio-btn studio-btn--ghost" style={{ marginTop: 8, fontSize: 12 }} onClick={() => addReviewee(c)}><span className="nf nf-fa-plus" /> Add Reviewee</button>
              </div>
            )}
          </div>
        );
      })}
      {cycles.length === 0 && <div className="studio-empty"><span className="nf nf-fa-star studio-empty-icon" /><h3>No review cycles</h3></div>}
      {show && (
        <>
          <div className="studio-backdrop" onClick={() => setShow(false)} />
          <div className="studio-modal s-modal-wide"><div className="studio-modal-header"><h2>Review: {memberName(reviewForm.userId)}</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShow(false)}><span className="nf nf-fa-xmark" /></button></div>
            <div className="studio-form" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
              <label className="studio-label">Self Assessment <textarea className="studio-input" rows={4} value={reviewForm.selfAssessment} onChange={e => setReviewForm({ ...reviewForm, selfAssessment: e.target.value })} placeholder="Employee's self-evaluation..." /></label>
              <label className="studio-label">Peer Feedback <textarea className="studio-input" rows={4} value={reviewForm.peerFeedback} onChange={e => setReviewForm({ ...reviewForm, peerFeedback: e.target.value })} placeholder="Feedback from peers..." /></label>
              <label className="studio-label">Manager Review <textarea className="studio-input" rows={4} value={reviewForm.managerReview} onChange={e => setReviewForm({ ...reviewForm, managerReview: e.target.value })} placeholder="Manager's assessment..." /></label>
              <label className="studio-label">Overall Rating (1-5) <input type="number" className="studio-input" min="1" max="5" value={reviewForm.overallRating} onChange={e => setReviewForm({ ...reviewForm, overallRating: Math.min(5, Math.max(1, parseInt(e.target.value) || 0)) })} /></label>
              <div className="studio-form-actions"><button className="studio-btn studio-btn--primary" onClick={() => saveReview(openCycle ? cycles.find(c => c.id === openCycle) : null)}>Save</button></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
