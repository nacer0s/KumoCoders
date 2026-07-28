import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function TimeTrackingPage({ teamId }) {
  const { token, user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [running, setRunning] = useState(null);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ description: '', hours: '', date: new Date().toISOString().slice(0, 10) });
  const timer = useRef(null);
  const [elapsed, setElapsed] = useState(0);

  function loadData() {
    if (!token) return;
    window.fetch(`/api/studio/teams/${teamId}/apps/timetracking/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setEntries(d); const r = d.find(i => parse(i).running); if (r) { setRunning(r); } }).catch(() => {});
  }
  useEffect(() => { loadData(); }, [teamId, token]);

  useEffect(() => {
    if (running) { timer.current = setInterval(() => { setElapsed(Math.floor((Date.now() - new Date(running.created_at).getTime()) / 1000)); }, 1000); }
    return () => clearInterval(timer.current);
  }, [running]);

  function parse(i) { return typeof i.data === 'string' ? JSON.parse(i.data) : (i.data || {}); }

  async function startTimer() {
    const res = await fetch(`/api/studio/teams/${teamId}/apps/timetracking/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { description: form.description || 'Untitled', running: true, startTime: new Date().toISOString(), userId: user?.id } }),
    });
    if (res.ok) loadData();
  }

  async function stopTimer() {
    if (!running) return;
    const d = parse(running);
    const start = new Date(d.startTime);
    const hours = (Date.now() - start.getTime()) / 3600000;
    await fetch(`/api/studio/apps/data/${running.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: { ...d, running: false, hours: Math.round(hours * 100) / 100 } }) });
    setRunning(null); setElapsed(0); loadData();
  }

  async function saveEntry(e) {
    e.preventDefault();
    await fetch(`/api/studio/teams/${teamId}/apps/timetracking/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { ...form, running: false, userId: user?.id } }),
    });
    setShow(false); setForm({ description: '', hours: '', date: new Date().toISOString().slice(0, 10) }); loadData();
  }

  function fmt(secs) {
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  const totalHours = entries.filter(i => !parse(i).running).reduce((s, i) => s + (parseFloat(parse(i).hours) || 0), 0);

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-clock" /> Time Tracking <span className="studio-text-muted" style={{ fontSize: 14, fontWeight: 400 }}>({totalHours.toFixed(1)}h total)</span></h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {running ? <><span className="s-timer">{fmt(elapsed)}</span><button className="studio-btn studio-btn--primary" onClick={stopTimer}><span className="nf nf-fa-stop" /> Stop</button></>
            : <button className="studio-btn studio-btn--ghost" onClick={() => setShow(true)}><span className="nf nf-fa-plus" /> Log Time</button>}
          {!running && <button className="studio-btn studio-btn--primary" onClick={startTimer}><span className="nf nf-fa-play" /> Start</button>}
        </div>
      </div>
      {running && <div className="s-running-card glass"><span className="nf nf-fa-play" style={{ color: '#4c6' }} /> Running: {parse(running).description} — {fmt(elapsed)}</div>}
      <div className="s-list">
        {entries.filter(i => !parse(i).running).map(e => {
          const d = parse(e);
          return <div key={e.id} className="s-list-item"><span className="nf nf-fa-clock" style={{ opacity: 0.5 }} /><div className="s-list-item-info"><strong>{d.description}</strong><span className="studio-text-muted">{d.hours ? `${d.hours}h` : ''} · {d.date || new Date(e.created_at).toLocaleDateString()}</span></div></div>;
        })}
      </div>
      {show && (
        <>
          <div className="studio-backdrop" onClick={() => setShow(false)} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>Log Time</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShow(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={saveEntry} className="studio-form">
              <label className="studio-label">Description <input className="studio-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required autoFocus /></label>
              <label className="studio-label">Hours <input type="number" className="studio-input" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} step="0.25" min="0" /></label>
              <label className="studio-label">Date <input type="date" className="studio-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Save</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
