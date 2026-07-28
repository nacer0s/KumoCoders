import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function CalendarPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', eventDate: '', startTime: '', endTime: '', allDay: false });

  function fetchEvents() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/events?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then((data) => { if (Array.isArray(data)) setEvents(data); })
      .catch(() => {});
  }

  useEffect(() => { fetchEvents(); }, [teamId, month, year, token]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/studio/teams/${teamId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ title: '', description: '', eventDate: '', startTime: '', endTime: '', allDay: false });
        fetchEvents();
        showToast('Event created', 'success');
      }
    } catch { showToast('Failed to create event', 'error'); }
  }

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  function getEventsForDay(day) {
    if (!day) return [];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => {
      const eDate = e.event_date instanceof Date
        ? e.event_date.toISOString().slice(0, 10)
        : String(e.event_date).slice(0, 10);
      return eDate === dateStr;
    });
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-calendar_days" style={{ color: '#777' }} /> Calendar</h1>
        <button className="studio-btn studio-btn--primary" onClick={() => {
          const today = new Date().toISOString().slice(0, 10);
          setForm({ ...form, eventDate: today });
          setShowCreate(true);
        }}>
          <span className="nf nf-fa-plus" /> Add Event
        </button>
      </div>

      <div className="studio-calendar">
        <div className="studio-calendar-header">
          <button className="studio-btn studio-btn--icon" onClick={prevMonth}>
            <span className="nf nf-fa-chevron_left" />
          </button>
          <h2>{MONTHS[month - 1]} {year}</h2>
          <button className="studio-btn studio-btn--icon" onClick={nextMonth}>
            <span className="nf nf-fa-chevron_right" />
          </button>
        </div>

        <div className="studio-calendar-grid">
          {DAYS.map((d) => (
            <div key={d} className="studio-calendar-day-header">{d}</div>
          ))}
          {calendarDays.map((day, i) => (
            <div key={i} className={`studio-calendar-day ${day ? '' : 'studio-calendar-day--empty'}`}>
              {day && (
                <>
                  <span className="studio-calendar-day-num">{day}</span>
                  <div className="studio-calendar-events">
                    {getEventsForDay(day).map((e) => (
                      <div key={e.id} className="studio-calendar-event" title={e.title}>
                        {e.title}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal">
            <div className="studio-modal-header">
              <h2>Add Event</h2>
              <button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}>
                <span className="nf nf-fa-xmark" /></button>
            </div>
            <form onSubmit={handleCreate} className="studio-form">
              <label className="studio-label">Title <input className="studio-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
              <label className="studio-label">Description <textarea className="studio-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></label>
              <label className="studio-label">Date <input type="date" className="studio-input" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} required /></label>
              <div className="studio-form-row">
                <label className="studio-label">Start <input type="time" className="studio-input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></label>
                <label className="studio-label">End <input type="time" className="studio-input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></label>
              </div>
              <label className="studio-label studio-label--checkbox">
                <input type="checkbox" checked={form.allDay} onChange={(e) => setForm({ ...form, allDay: e.target.checked })} />
                All Day
              </label>
              <div className="studio-form-actions">
                <button type="submit" className="studio-btn studio-btn--primary">Add Event</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}