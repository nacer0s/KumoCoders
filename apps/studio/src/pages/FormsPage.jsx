import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function FormsPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [forms, setForms] = useState([]);
  const [view, setView] = useState('list'); // list | view | responses
  const [active, setActive] = useState(null);
  const [editFields, setEditFields] = useState([]);
  const [editTitle, setEditTitle] = useState('');
  const [responses, setResponses] = useState([]);

  function fetchForms() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/forms/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setForms(d); }).catch(() => {});
  }

  useEffect(() => { fetchForms(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  async function saveForm() {
    if (active) {
      await fetch(`/api/studio/apps/data/${active.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: { title: editTitle, fields: editFields } }) });
      fetchForms(); setView('list'); showToast('Form saved', 'success');
    }
  }

  async function createForm() {
    const res = await fetch(`/api/studio/teams/${teamId}/apps/forms/data`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itemKey: Date.now().toString(), data: { title: 'Untitled Form', fields: [] } }) });
    if (res.ok) { const item = await res.json(); setActive(item); setEditTitle('Untitled Form'); setEditFields([]); setView('view'); fetchForms(); showToast('Form created', 'success'); }
  }

  function addField() {
    setEditFields([...editFields, { id: Date.now(), type: 'text', label: '', required: false, options: [] }]);
  }

  function updateField(i, key, val) {
    const f = [...editFields]; f[i] = { ...f[i], [key]: val }; setEditFields(f);
  }

  function removeField(i) {
    setEditFields(editFields.filter((_, idx) => idx !== i));
  }

  function openForm(form) {
    setActive(form); const d = parse(form);
    setEditTitle(d.title || ''); setEditFields(d.fields || []); setView('view');
  }

  async function submitForm(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const answers = {};
    editFields.forEach(f => { answers[f.id] = fd.get(String(f.id)) || ''; });
    const res = await fetch(`/api/studio/teams/${teamId}/apps/forms/data`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itemKey: `response_${active.id}_${Date.now()}`, data: { type: 'response', formId: active.id, answers } }) });
    if (res.ok) { setView('list'); showToast('Response submitted', 'success'); }
  }

  async function viewResponses(form) {
    setActive(form); setView('responses');
    fetch(`/api/studio/teams/${teamId}/apps/forms/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => {
        if (Array.isArray(d)) setResponses(d.filter(i => parse(i).type === 'response' && parse(i).formId === form.id));
      }).catch(() => {});
  }

  if (view === 'view' && active) {
    return (
      <div className="studio-page">
        <div className="studio-page-header"><h1><span className="nf nf-fa-list" /> {editTitle}</h1><div className="studio-page-actions"><button className="studio-btn studio-btn--ghost" onClick={() => setView('list')}><span className="nf nf-fa-arrow_left" /> Back</button><button className="studio-btn studio-btn--primary" onClick={saveForm}>Save Form</button></div></div>
        {editFields.map((f, i) => (
          <div key={f.id} className="s-form-field">
            <input className="studio-input" placeholder="Field label" value={f.label} onChange={e => updateField(i, 'label', e.target.value)} style={{ fontWeight: 600, marginBottom: 4 }} />
            <select className="studio-input" value={f.type} onChange={e => updateField(i, 'type', e.target.value)} style={{ marginRight: 8 }}>
              <option value="text">Text</option><option value="textarea">Paragraph</option><option value="number">Number</option><option value="select">Dropdown</option><option value="checkbox">Checkbox</option>
            </select>
            <label><input type="checkbox" checked={f.required} onChange={e => updateField(i, 'required', e.target.checked)} /> Required</label>
            <button className="studio-btn studio-btn--icon" onClick={() => removeField(i)} style={{ marginLeft: 'auto' }}><span className="nf nf-fa-trash" /></button>
          </div>
        ))}
        <button className="studio-btn studio-btn--ghost" onClick={addField} style={{ marginTop: 8 }}><span className="nf nf-fa-plus" /> Add Field</button>
      </div>
    );
  }

  if (view === 'responses' && active) {
    const d = parse(active);
    return (
      <div className="studio-page">
        <div className="studio-page-header"><h1><span className="nf nf-fa-list" /> {d.title} — Responses</h1><button className="studio-btn studio-btn--ghost" onClick={() => setView('list')}><span className="nf nf-fa-arrow_left" /> Back</button></div>
        {responses.length === 0 ? <div className="studio-empty"><h3>No responses yet</h3></div> : (
          <table className="s-table"><thead><tr>{(d.fields || []).map(f => <th key={f.id}>{f.label}</th>)}</tr></thead><tbody>{responses.map(r => { const rd = parse(r); return <tr key={r.id}>{(d.fields || []).map(f => <td key={f.id}>{rd.answers?.[f.id] || ''}</td>)}</tr>; })}</tbody></table>
        )}
      </div>
    );
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-list" /> Forms</h1><button className="studio-btn studio-btn--primary" onClick={createForm}><span className="nf nf-fa-plus" /> New Form</button></div>
      {forms.filter(i => parse(i).type !== 'response').map(form => {
        const d = parse(form);
        return (
          <div key={form.id} className="s-list-item">
            <div className="s-list-item-info" onClick={() => openForm(form)}><strong>{d.title}</strong><span className="studio-text-muted">{form.author_name}</span></div>
            <div className="s-list-item-actions"><button className="studio-btn studio-btn--ghost" onClick={() => viewResponses(form)}>Responses</button><button className="studio-btn studio-btn--icon" onClick={async () => { await fetch(`/api/studio/apps/data/${form.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); fetchForms(); showToast('Form deleted', 'success'); }}><span className="nf nf-fa-trash" /></button></div>
          </div>
        );
      })}
    </div>
  );
}
