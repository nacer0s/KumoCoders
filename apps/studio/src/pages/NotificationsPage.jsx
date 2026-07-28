import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function NotificationsPage({ teamId }) {
  const { token } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);

  function loadData() {
    if (!token) return;
    fetch(`/api/studio/notifications/${teamId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setNotifs(d); }).catch(() => {});
    fetch(`/api/studio/notifications/${teamId}/unread`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : {}).then(d => setUnread(d.count || 0)).catch(() => {});
  }

  useEffect(() => { loadData(); }, [teamId, token]);

  async function markRead(id) {
    await fetch(`/api/studio/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    loadData();
  }

  async function markAllRead() {
    await fetch(`/api/studio/notifications/${teamId}/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    loadData();
  }

  const icons = { task: 'nf-fa-list_check', form: 'nf-fa-list', poll: 'nf-fa-chart_simple', mention: 'nf-fa-at', comment: 'nf-fa-comment', assignment: 'nf-fa-user_plus', info: 'nf-fa-info_circle' };

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-bell" /> Notifications {unread > 0 && <span className="s-badge">{unread}</span>}</h1>
        {unread > 0 && <button className="studio-btn studio-btn--ghost" onClick={markAllRead}><span className="nf nf-fa-check_double" /> Mark All Read</button>}
      </div>
      <div className="s-list">
        {notifs.map(n => (
          <div key={n.id} className={`s-notif ${!n.is_read ? 's-notif--unread' : ''}`} onClick={() => { if (!n.is_read) markRead(n.id); }}>
            <span className={`nf ${icons[n.type] || 'nf-fa-bell'}`} style={{ fontSize: 18, opacity: 0.6 }} />
            <div className="s-notif-body">
              <strong>{n.title}</strong>
              {n.body && <p className="studio-text-muted">{n.body}</p>}
              <span className="studio-text-muted" style={{ fontSize: 11 }}>{new Date(n.created_at).toLocaleString()}</span>
            </div>
            {n.link && <a href={n.link} className="studio-btn studio-btn--ghost" style={{ fontSize: 12 }}>View</a>}
          </div>
        ))}
        {notifs.length === 0 && <div className="studio-empty"><span className="nf nf-fa-bell studio-empty-icon" /><h3>No notifications</h3></div>}
      </div>
    </div>
  );
}
