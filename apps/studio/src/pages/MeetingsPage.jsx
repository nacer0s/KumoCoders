import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';

export default function MeetingsPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [edit, setEdit] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editAttendees, setEditAttendees] = useState('');
  const [editAgenda, setEditAgenda] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editActions, setEditActions] = useState('');

  function fetchMeetings() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/meetings/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setMeetings(d); }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { fetchMeetings(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  function resetForm() {
    setEditTitle(''); setEditDate(new Date().toISOString().slice(0, 10)); setEditAttendees('');
    setEditAgenda(''); setEditNotes(''); setEditActions(''); setEdit(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    const body = { title: editTitle, date: editDate, attendees: editAttendees, agenda: editAgenda, notes: editNotes, actionItems: editActions };
    if (edit) {
      await fetch(`/api/studio/apps/data/${edit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: body }) });
    } else {
      await fetch(`/api/studio/teams/${teamId}/apps/meetings/data`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itemKey: Date.now().toString(), data: body }) });
    }
    setShowCreate(false); resetForm(); fetchMeetings();
    showToast(edit ? 'Meeting updated' : 'Meeting created', 'success');
  }

  function openMeeting(m) {
    const d = parse(m);
    setEdit(m); setEditTitle(d.title); setEditDate(d.date); setEditAttendees(d.attendees || '');
    setEditAgenda(d.agenda || ''); setEditNotes(d.notes || ''); setEditActions(d.actionItems || '');
    setShowCreate(true);
  }

  async function handleDelete(id) {
    await fetch(`/api/studio/apps/data/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchMeetings();
    showToast('Meeting deleted', 'success');
  }

  if (loading) return <LoadingSkeleton.Page />;

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-notes_medical" /> Meeting Notes</h1><button className="studio-btn studio-btn--primary" onClick={() => { resetForm(); setShowCreate(true); }}><span className="nf nf-fa-plus" /> New Notes</button></div>
      <div className="s-list">
        {meetings.map(m => {
          const d = parse(m);
          return (
            <div key={m.id} className="s-list-item" onClick={() => openMeeting(m)}>
              <div className="s-list-item-info"><strong>{d.title || 'Untitled'}</strong><span className="studio-text-muted">{d.date} — {m.author_name}</span></div>
              <div className="s-list-item-actions"><button className="studio-btn studio-btn--icon" onClick={e => { e.stopPropagation(); handleDelete(m.id); }}><span className="nf nf-fa-trash" /></button></div>
            </div>
          );
        })}
        {meetings.length === 0 && <div className="studio-empty"><span className="nf nf-fa-notes_medical studio-empty-icon" /><h3>No meeting notes</h3></div>}
      </div>
      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => { setShowCreate(false); resetForm(); }} />
          <div className="studio-modal s-modal-wide">
            <div className="studio-modal-header"><h2>{edit ? 'Edit Notes' : 'New Meeting Notes'}</h2><button className="studio-btn studio-btn--ghost" onClick={() => { setShowCreate(false); resetForm(); }}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleSave} className="studio-form">
              <label className="studio-label">Title <input className="studio-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} required autoFocus /></label>
              <div style={{ display: 'flex', gap: 8 }}><label className="studio-label" style={{ flex: 1 }}>Date <input type="date" className="studio-input" value={editDate} onChange={e => setEditDate(e.target.value)} /></label></div>
              <label className="studio-label">Attendees <input className="studio-input" value={editAttendees} onChange={e => setEditAttendees(e.target.value)} placeholder="Comma-separated names" /></label>
              <label className="studio-label">Agenda <textarea className="studio-input" rows={3} value={editAgenda} onChange={e => setEditAgenda(e.target.value)} placeholder="One item per line" /></label>
              <label className="studio-label">Notes <textarea className="studio-input" rows={5} value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Meeting notes..." /></label>
              <label className="studio-label">Action Items <textarea className="studio-input" rows={3} value={editActions} onChange={e => setEditActions(e.target.value)} placeholder="One item per line" /></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">{edit ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
