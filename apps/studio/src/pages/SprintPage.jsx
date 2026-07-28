import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function SprintPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [sprints, setSprints] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [backlog, setBacklog] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStory, setNewStory] = useState('');
  const [newPoints, setNewPoints] = useState(1);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');

  function fetchAll() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/sprint/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) { setSprints(d.filter(i => parse(i).type !== 'story')); setBacklog(d.filter(i => parse(i).type === 'story' && !parse(i).sprintId)); } }).catch(() => {});
  }

  useEffect(() => { fetchAll(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  async function createSprint(e) {
    e.preventDefault();
    await fetch(`/api/studio/teams/${teamId}/apps/sprint/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { type: 'sprint', name: sprintName, goal: sprintGoal, status: 'active', stories: [] } }),
    });
    setShowSprintForm(false); setSprintName(''); setSprintGoal(''); fetchAll();
    showToast('Sprint created', 'success');
  }

  async function addStory(e) {
    e.preventDefault();
    await fetch(`/api/studio/teams/${teamId}/apps/sprint/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { type: 'story', title: newStory, points: newPoints, sprintId: null, status: 'backlog' } }),
    });
    setNewStory(''); setNewPoints(1); fetchAll();
    showToast('Story added', 'success');
  }

  async function moveToSprint(storyId, sprintId) {
    const story = backlog.find(i => i.id === storyId);
    if (!story) return;
    const d = parse(story);
    await fetch(`/api/studio/apps/data/${storyId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: { ...d, sprintId } }) });
    fetchAll();
    showToast('Story moved to sprint', 'success');
  }

  async function completeStory(storyId) {
    const all = [...sprints, ...backlog];
    const story = all.find(i => i.id === storyId);
    if (!story) return;
    const d = parse(story);
    await fetch(`/api/studio/apps/data/${storyId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: { ...d, status: 'done' } }) });
    fetchAll();
    showToast('Story completed', 'success');
  }

  const activeSprints = sprints.filter(s => parse(s).status === 'active');

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-sprint" /> Sprint Board</h1>
        <div className="studio-page-actions">
          <button className="studio-btn studio-btn--ghost" onClick={() => setShowSprintForm(true)}><span className="nf nf-fa-plus" /> New Sprint</button>
          <button className="studio-btn studio-btn--primary" onClick={() => setShowCreate(true)}><span className="nf nf-fa-plus" /> Add Story</button>
        </div>
      </div>
      <div className="s-sprint">
        <div className="s-sprint-col">
          <h3 className="s-sprint-col-header">Backlog ({backlog.length})</h3>
          {backlog.map(story => {
            const d = parse(story);
            return (
              <div key={story.id} className="s-sprint-card">
                <div><strong>{d.title}</strong><span className="studio-text-muted" style={{ marginLeft: 8 }}>{d.points}pt</span></div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  {activeSprints.map(s => <button key={s.id} className="studio-btn studio-btn--ghost" onClick={() => moveToSprint(story.id, s.id)} style={{ fontSize: 11, padding: '2px 6px' }}>→ {parse(s).name}</button>)}
                </div>
              </div>
            );
          })}
        </div>
        {activeSprints.map(sprint => {
          const sd = parse(sprint);
          const sprintStories = [...backlog, ...sprints].filter(i => parse(i).sprintId === sprint.id);
          const done = sprintStories.filter(s => parse(s).status === 'done');
          return (
            <div key={sprint.id} className="s-sprint-col s-sprint-col--active">
              <h3 className="s-sprint-col-header">{sd.name} <span className="studio-text-muted">({done.length}/{sprintStories.length})</span></h3>
              {sd.goal && <p className="studio-text-muted" style={{ fontSize: 12, marginBottom: 8 }}>Goal: {sd.goal}</p>}
              {sprintStories.filter(s => parse(s).status !== 'done').map(story => {
                const d = parse(story);
                return (
                  <div key={story.id} className="s-sprint-card">
                    <div><strong>{d.title}</strong><span className="studio-text-muted" style={{ marginLeft: 8 }}>{d.points}pt</span></div>
                    <button className="studio-btn studio-btn--ghost" onClick={() => completeStory(story.id)} style={{ fontSize: 11, padding: '2px 6px', marginTop: 4 }}>Complete</button>
                  </div>
                );
              })}
              {done.length > 0 && <details style={{ marginTop: 8 }}><summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--color-text-muted)' }}>Done ({done.length})</summary>{done.map(story => { const d = parse(story); return <div key={story.id} className="s-sprint-card" style={{ opacity: 0.6 }}><strong>{d.title}</strong><span className="studio-text-muted" style={{ marginLeft: 8 }}>{d.points}pt</span></div>; })}</details>}
            </div>
          );
        })}
      </div>
      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>Add Story</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={addStory} className="studio-form">
              <label className="studio-label">Title <input className="studio-input" value={newStory} onChange={e => setNewStory(e.target.value)} required autoFocus /></label>
              <label className="studio-label">Points <input type="number" className="studio-input" value={newPoints} onChange={e => setNewPoints(parseInt(e.target.value) || 1)} min={1} max={100} /></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Add</button></div>
            </form>
          </div>
        </>
      )}
      {showSprintForm && (
        <>
          <div className="studio-backdrop" onClick={() => setShowSprintForm(false)} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>New Sprint</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShowSprintForm(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={createSprint} className="studio-form">
              <label className="studio-label">Name <input className="studio-input" value={sprintName} onChange={e => setSprintName(e.target.value)} required autoFocus /></label>
              <label className="studio-label">Goal <input className="studio-input" value={sprintGoal} onChange={e => setSprintGoal(e.target.value)} /></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Create</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
