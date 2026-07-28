import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function OKRPage({ teamId }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [showObjective, setShowObjective] = useState(false);
  const [showKr, setShowKr] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [objForm, setObjForm] = useState({ title: '', quarter: 'Q1', year: new Date().getFullYear().toString() });
  const [krForm, setKrForm] = useState({ description: '', target: '', current: '' });

  function fetchAll() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/okr/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setItems(d); }).catch(() => {});
  }

  useEffect(() => { fetchAll(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  const objectives = items.filter(i => parse(i).type === 'objective');

  function getKR(objId) {
    return items.filter(i => {
      const d = parse(i);
      return d.type === 'kr' && d.objectiveId === objId;
    });
  }

  async function handleCreateObjective(e) {
    e.preventDefault();
    const res = await fetch(`/api/studio/teams/${teamId}/apps/okr/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { type: 'objective', title: objForm.title, quarter: objForm.quarter, year: objForm.year } }),
    });
    if (res.ok) { setShowObjective(false); setObjForm({ title: '', quarter: 'Q1', year: new Date().getFullYear().toString() }); fetchAll(); }
  }

  async function handleCreateKR(e) {
    e.preventDefault();
    const res = await fetch(`/api/studio/teams/${teamId}/apps/okr/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { type: 'kr', objectiveId: showKr, description: krForm.description, target: Number(krForm.target), current: Number(krForm.current) } }),
    });
    if (res.ok) { setShowKr(null); setKrForm({ description: '', target: '', current: '' }); fetchAll(); }
  }

  async function updateKR(item, current) {
    const d = parse(item);
    await fetch(`/api/studio/apps/data/${item.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ appData: { ...d, current: Number(current) } }),
    });
    fetchAll();
  }

  async function handleDelete(id) {
    await fetch(`/api/studio/apps/data/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  }

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-bullseye" /> OKRs</h1>
        <button className="studio-btn studio-btn--primary" onClick={() => setShowObjective(true)}><span className="nf nf-fa-plus" /> New Objective</button>
      </div>
      <div className="s-list">
        {objectives.map(obj => {
          const d = parse(obj);
          const krs = getKR(obj.id);
          const isOpen = expanded[obj.id];
          return (
            <div key={obj.id} className="s-list-item glass" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="studio-btn studio-btn--icon" onClick={() => setExpanded({ ...expanded, [obj.id]: !isOpen })} style={{ minWidth: 'auto', padding: 2 }}>
                    <span className={`nf nf-fa-chevron_${isOpen ? 'down' : 'right'}`} />
                  </button>
                  <strong>{d.title}</strong>
                  <span className="studio-badge">{d.quarter} {d.year}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="studio-btn studio-btn--ghost" style={{ fontSize: 12, padding: '2px 8px' }} onClick={() => { setShowKr(obj.id); setKrForm({ description: '', target: '', current: '' }); }}>+ KR</button>
                  <button className="studio-btn studio-btn--icon" onClick={() => handleDelete(obj.id)} style={{ minWidth: 'auto', padding: 2, opacity: 0.6 }}><span className="nf nf-fa-trash" /></button>
                </div>
              </div>
              {isOpen && krs.map(kr => {
                const kd = parse(kr);
                const pct = kd.target > 0 ? Math.min(100, Math.round((kd.current || 0) / kd.target * 100)) : 0;
                return (
                  <div key={kr.id} style={{ paddingLeft: 36, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span>{kd.description}</span>
                        <span>{kd.current || 0} / {kd.target}</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden', marginTop: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#4c6' : '#4af', borderRadius: 4, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                    <input className="studio-input" type="number" style={{ width: 60, padding: '2px 6px', fontSize: 12 }} value={kd.current || 0} onChange={e => updateKR(kr, e.target.value)} />
                    <button className="studio-btn studio-btn--icon" onClick={() => handleDelete(kr.id)} style={{ minWidth: 'auto', padding: 2, opacity: 0.6 }}><span className="nf nf-fa-trash" /></button>
                  </div>
                );
              })}
            </div>
          );
        })}
        {objectives.length === 0 && (
          <div className="studio-empty"><span className="nf nf-fa-bullseye studio-empty-icon" /><h3>No objectives yet</h3></div>
        )}
      </div>
      {showObjective && (
        <>
          <div className="studio-backdrop" onClick={() => setShowObjective(false)} />
          <div className="studio-modal">
            <div className="studio-modal-header"><h2>New Objective</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShowObjective(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleCreateObjective} className="studio-form">
              <label className="studio-label">Title <input className="studio-input" value={objForm.title} onChange={e => setObjForm({ ...objForm, title: e.target.value })} required autoFocus /></label>
              <div className="studio-form-row">
                <label className="studio-label">Quarter <select className="studio-input" value={objForm.quarter} onChange={e => setObjForm({ ...objForm, quarter: e.target.value })}>{['Q1','Q2','Q3','Q4'].map(q => <option key={q} value={q}>{q}</option>)}</select></label>
                <label className="studio-label">Year <select className="studio-input" value={objForm.year} onChange={e => setObjForm({ ...objForm, year: e.target.value })}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></label>
              </div>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Create</button></div>
            </form>
          </div>
        </>
      )}
      {showKr && (
        <>
          <div className="studio-backdrop" onClick={() => setShowKr(null)} />
          <div className="studio-modal">
            <div className="studio-modal-header"><h2>Add Key Result</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShowKr(null)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleCreateKR} className="studio-form">
              <label className="studio-label">Description <input className="studio-input" value={krForm.description} onChange={e => setKrForm({ ...krForm, description: e.target.value })} required autoFocus /></label>
              <div className="studio-form-row">
                <label className="studio-label">Target <input className="studio-input" type="number" value={krForm.target} onChange={e => setKrForm({ ...krForm, target: e.target.value })} required /></label>
                <label className="studio-label">Current <input className="studio-input" type="number" value={krForm.current} onChange={e => setKrForm({ ...krForm, current: e.target.value })} /></label>
              </div>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Add</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
