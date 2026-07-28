import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function NPSPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: '', question: 'How likely are you to recommend us?', targetAudience: '' });
  const [responses, setResponses] = useState([]);

  function loadData() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/nps/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setItems(d); }).catch(() => {});
  }
  useEffect(() => { loadData(); }, [teamId, token]);

  function parse(i) { return typeof i.data === 'string' ? JSON.parse(i.data) : (i.data || {}); }

  useEffect(() => {
    const all = [];
    items.forEach(item => {
      const d = parse(item);
      (d.responses || []).forEach(r => all.push({ ...r, surveyTitle: d.title, surveyId: item.id }));
    });
    setResponses(all);
  }, [items]);

  async function handleCreate(e) {
    e.preventDefault();
    await fetch(`/api/studio/teams/${teamId}/apps/nps/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { ...form, responses: [] } }),
    });
    setShow(false); setForm({ title: '', question: 'How likely are you to recommend us?', targetAudience: '' }); loadData();
    showToast('Survey created', 'success');
  }

  function calcNps(responses) {
    if (responses.length === 0) return { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
    const promoters = responses.filter(r => r.score >= 9).length;
    const passives = responses.filter(r => r.score >= 7 && r.score <= 8).length;
    const detractors = responses.filter(r => r.score <= 6).length;
    const total = responses.length;
    const score = Math.round(((promoters / total) - (detractors / total)) * 100);
    return { score, promoters, passives, detractors, total };
  }

  const nps = calcNps(responses);

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-star" /> NPS & Feedback</h1><button className="studio-btn studio-btn--primary" onClick={() => setShow(true)}><span className="nf nf-fa-plus" /> New Survey</button></div>
      <div className="s-analytics-grid">
        <div className="s-analytics-card"><div className="s-analytics-number" style={{ color: nps.score >= 50 ? '#4c6' : nps.score >= 0 ? '#fa4' : '#f66' }}>{nps.score}</div><div className="s-analytics-label">NPS Score</div></div>
        <div className="s-analytics-card"><div className="s-analytics-number">{nps.total}</div><div className="s-analytics-label">Responses</div></div>
        <div className="s-analytics-card"><div className="s-analytics-number" style={{ color: '#4c6' }}>{nps.promoters}</div><div className="s-analytics-label">Promoters (9-10)</div></div>
        <div className="s-analytics-card"><div className="s-analytics-number" style={{ color: '#888' }}>{nps.passives}</div><div className="s-analytics-label">Passives (7-8)</div></div>
        <div className="s-analytics-card"><div className="s-analytics-number" style={{ color: '#f66' }}>{nps.detractors}</div><div className="s-analytics-label">Detractors (0-6)</div></div>
      </div>
      <div className="studio-section">
        <h2><span className="nf nf-fa-chart_bar" /> NPS Trend</h2>
        <div className="s-analytics-card" style={{ padding: '12px 16' }}>
          {nps.total > 0 && (
            <div style={{ display: 'flex', gap: 0, height: 24, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ flex: nps.detractors, background: '#f6622', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', minWidth: nps.detractors > 0 ? 20 : 0 }}>{nps.detractors > 0 ? `${Math.round(nps.detractors / nps.total * 100)}%` : ''}</div>
              <div style={{ flex: nps.passives, background: '#fa42', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', minWidth: nps.passives > 0 ? 20 : 0 }}>{nps.passives > 0 ? `${Math.round(nps.passives / nps.total * 100)}%` : ''}</div>
              <div style={{ flex: nps.promoters, background: '#4c62', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', minWidth: nps.promoters > 0 ? 20 : 0 }}>{nps.promoters > 0 ? `${Math.round(nps.promoters / nps.total * 100)}%` : ''}</div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4, color: 'var(--color-text-muted)' }}><span>Detractors</span><span>Passives</span><span>Promoters</span></div>
        </div>
      </div>
      <div className="studio-section">
        <h2><span className="nf nf-fa-message" /> Recent Responses</h2>
        <div className="s-list">
          {responses.slice(-20).reverse().map((r, i) => (
            <div key={i} className="s-list-item">
              <span className="nf nf-fa-user" style={{ opacity: 0.5 }} />
              <div className="s-list-item-info">
                <strong>Score: {r.score}/10</strong>
                <span className="studio-text-muted">{r.surveyTitle} · {r.respondentEmail || 'Anonymous'} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
              </div>
              {r.comment && <span style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.6 }}>"{r.comment}"</span>}
            </div>
          ))}
          {responses.length === 0 && <div className="studio-empty"><span className="nf nf-fa-message studio-empty-icon" /><h3>No responses yet</h3></div>}
        </div>
      </div>
      <div className="studio-section">
        <h2><span className="nf nf-fa-poll" /> Surveys ({items.length})</h2>
        <div className="s-list">
          {items.map(item => {
            const d = parse(item);
            const surveyResponses = d.responses || [];
            const sNps = calcNps(surveyResponses);
            return (
              <div key={item.id} className="s-list-item">
                <span className="nf nf-fa-poll" style={{ opacity: 0.5 }} />
                <div className="s-list-item-info"><strong>{d.title}</strong><span className="studio-text-muted">{sNps.total} responses · NPS: {sNps.score}</span></div>
              </div>
            );
          })}
        </div>
      </div>
      {show && (
        <>
          <div className="studio-backdrop" onClick={() => setShow(false)} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>New Survey</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShow(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleCreate} className="studio-form">
              <label className="studio-label">Title <input className="studio-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus /></label>
              <label className="studio-label">Question <input className="studio-input" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} /></label>
              <label className="studio-label">Target Audience <input className="studio-input" value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value })} placeholder="e.g. All customers, Beta users" /></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Create</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
