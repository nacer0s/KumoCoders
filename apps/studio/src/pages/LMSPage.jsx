import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function LMSPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);
  const [activeCourse, setActiveCourse] = useState(null);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', difficulty: 'beginner', status: 'draft', modules: [] });
  const [modForm, setModForm] = useState({ title: '', content: '', type: 'text', duration: '' });

  function loadData() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/lms/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setItems(d); }).catch(() => {});
  }
  useEffect(() => { loadData(); }, [teamId, token]);

  function parse(i) { return typeof i.data === 'string' ? JSON.parse(i.data) : (i.data || {}); }

  async function handleSave(e) {
    e.preventDefault();
    if (editCourse) {
      await fetch(`/api/studio/apps/data/${editCourse.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: form }) });
      showToast('Course updated', 'success');
    } else {
      await fetch(`/api/studio/teams/${teamId}/apps/lms/data`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itemKey: Date.now().toString(), data: form }) });
      showToast('Course created', 'success');
    }
    setShow(false); setEditCourse(null); setForm({ title: '', description: '', category: '', difficulty: 'beginner', status: 'draft', modules: [] }); loadData();
  }

  function addModule() {
    if (!modForm.title.trim()) return;
    setForm({ ...form, modules: [...form.modules, { ...modForm, completed: false }] });
    setModForm({ title: '', content: '', type: 'text', duration: '' });
  }

  async function toggleModule(course, modIdx) {
    const d = parse(course);
    d.modules[modIdx].completed = !d.modules[modIdx].completed;
    await fetch(`/api/studio/apps/data/${course.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    loadData();
  }

  function openEdit(course) {
    setEditCourse(course);
    setForm(parse(course));
    setShow(true);
  }

  function progress(d) {
    const mods = d.modules || [];
    return mods.length > 0 ? Math.round(mods.filter(m => m.completed).length / mods.length * 100) : 0;
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-graduation_cap" /> Learning Management</h1><button className="studio-btn studio-btn--primary" onClick={() => { setEditCourse(null); setForm({ title: '', description: '', category: '', difficulty: 'beginner', status: 'draft', modules: [] }); setShow(true); }}><span className="nf nf-fa-plus" /> New Course</button></div>
      {!activeCourse ? (
        <div className="s-list">
          {items.map(item => {
            const d = parse(item);
            const pct = progress(d);
            return (
              <div key={item.id} className="s-list-item" style={{ cursor: 'pointer' }}>
                <span className="nf nf-fa-book" style={{ opacity: 0.5 }} />
                <div className="s-list-item-info" onClick={() => setActiveCourse(item)}><strong>{d.title}</strong><span className="studio-text-muted">{d.category} · {d.difficulty} · {d.status}</span></div>
                <div style={{ width: 120, marginRight: 12 }}>
                  <div style={{ height: 6, background: 'var(--color-bg)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-text)', borderRadius: 3, transition: 'width .3s ease' }} /></div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'right' }}>{pct}%</div>
                </div>
                <button className="studio-btn studio-btn--ghost" onClick={e => { e.stopPropagation(); openEdit(item); }}><span className="nf nf-fa-pen" /></button>
              </div>
            );
          })}
          {items.length === 0 && <div className="studio-empty"><span className="nf nf-fa-graduation_cap studio-empty-icon" /><h3>No courses yet</h3></div>}
        </div>
      ) : (
        <div>
          <button className="studio-btn studio-btn--ghost" onClick={() => setActiveCourse(null)} style={{ marginBottom: 12 }}><span className="nf nf-fa-arrow_left" /> Back</button>
          {(() => { const d = parse(activeCourse); const pct = progress(d); const mods = d.modules || []; return (
            <div>
              <div className="glass" style={{ padding: 16, marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, marginBottom: 4 }}>{d.title}</h2>
                <div className="studio-text-muted" style={{ marginBottom: 8 }}>{d.category} · {d.difficulty} · {d.status}</div>
                <p style={{ fontSize: 14, marginBottom: 8 }}>{d.description}</p>
                <div style={{ height: 8, background: 'var(--color-bg)', borderRadius: 4, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-text)', borderRadius: 4, transition: 'width .3s ease' }} /></div>
                <div style={{ fontSize: 12, marginTop: 4, color: 'var(--color-text-muted)' }}>{mods.filter(m => m.completed).length}/{mods.length} modules completed ({pct}%)</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {mods.map((mod, i) => (
                  <label key={i} className="studio-label--checkbox" style={{ padding: '8px 12', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', fontSize: 14 }}>
                    <input type="checkbox" checked={mod.completed} onChange={() => toggleModule(activeCourse, i)} />
                    <span style={{ flex: 1, textDecoration: mod.completed ? 'line-through' : 'none', opacity: mod.completed ? 0.5 : 1 }}>{mod.title}</span>
                    <span className="studio-text-muted" style={{ fontSize: 11 }}>{mod.type} {mod.duration ? `· ${mod.duration}min` : ''}</span>
                  </label>
                ))}
              </div>
            </div>
          ); })()}
        </div>
      )}
      {show && (
        <>
          <div className="studio-backdrop" onClick={() => setShow(false)} />
          <div className="studio-modal s-modal-wide"><div className="studio-modal-header"><h2>{editCourse ? 'Edit' : 'New'} Course</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShow(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleSave} className="studio-form">
              <div className="studio-form-row">
                <label className="studio-label">Title <input className="studio-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus /></label>
                <label className="studio-label">Category <input className="studio-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></label>
              </div>
              <div className="studio-form-row">
                <label className="studio-label">Difficulty <select className="studio-input" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
                <label className="studio-label">Status <select className="studio-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="published">Published</option></select></label>
              </div>
              <label className="studio-label">Description <textarea className="studio-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
              <div><strong style={{ fontSize: 13 }}>Modules</strong>
                {form.modules.map((m, i) => (
                  <div key={i} className="s-form-field">
                    <span className="nf nf-fa-{m.type === 'video' ? 'video' : m.type === 'quiz' ? 'question' : 'file_lines'}" style={{ opacity: 0.5 }} />
                    <span style={{ flex: 1 }}>{m.title}</span>
                    <span className="studio-text-muted" style={{ fontSize: 11 }}>{m.type}{m.duration ? ` · ${m.duration}m` : ''}</span>
                    <button type="button" className="studio-btn studio-btn--icon" style={{ width: 24, height: 24, fontSize: 11 }} onClick={() => setForm({ ...form, modules: form.modules.filter((_, j) => j !== i) })}><span className="nf nf-fa-xmark" /></button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  <input className="studio-input" style={{ flex: 1, minWidth: 120 }} value={modForm.title} onChange={e => setModForm({ ...modForm, title: e.target.value })} placeholder="Module title" />
                  <select className="studio-input" style={{ width: 100 }} value={modForm.type} onChange={e => setModForm({ ...modForm, type: e.target.value })}><option value="text">Text</option><option value="video">Video</option><option value="quiz">Quiz</option></select>
                  <input className="studio-input" style={{ width: 80 }} value={modForm.duration} onChange={e => setModForm({ ...modForm, duration: e.target.value })} placeholder="Min" />
                  <button type="button" className="studio-btn studio-btn--ghost" onClick={addModule}><span className="nf nf-fa-plus" /></button>
                </div>
              </div>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">{editCourse ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
