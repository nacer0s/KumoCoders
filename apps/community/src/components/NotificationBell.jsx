import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getNotifIcon(type) {
  switch (type) {
    case 'like':    return { icon: 'nf-fa-heart',    color: '#EF4444' };
    case 'comment': return { icon: 'nf-fa-comment',  color: '#3B82F6' };
    case 'badge':  return { icon: 'nf-fa-trophy',   color: '#F59E0B' };
    case 'mention': return { icon: 'nf-fa-at',       color: '#8B5CF6' };
    default:        return { icon: 'nf-fa-bell',     color: '#808080' };
  }
}

export default function NotificationBell() {
  const { user, token } = useAuth();
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Poll unread count
  useEffect(() => {
    if (!token) return;
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);

    async function fetchCount() {
      try {
        const res = await fetch('/api/community/notifications/count', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCount(data.count || 0);
        }
      } catch { /* ignore */ }
    }
  }, [token]);

  // Fetch notifications on open
  useEffect(() => {
    if (!open || !token) return;
    fetch('/api/community/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications || []))
      .catch(() => {});
  }, [open, token]);

  // Outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function handleMarkRead(id) {
    try {
      await fetch(`/api/community/notifications/read/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  }

  async function handleMarkAllRead() {
    try {
      await fetch('/api/community/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setCount(0);
    } catch { /* ignore */ }
  }

  function handleNotificationClick(n) {
    if (!n.is_read) handleMarkRead(n.id);
    setOpen(false);
    if (n.link) {
      navigateTo(n.link.replace('/community', ''));
    }
  }

  if (!user) return null;

  return (
    <div className="community-notif-bell" ref={dropdownRef}>
      <button
        className="community-btn community-btn--icon"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <span className="nf nf-fa-bell" />
        {count > 0 && <span className="community-notif-badge">{count > 99 ? '99+' : count}</span>}
      </button>

      {open && (
        <div className="community-notif-dropdown">
          <div className="community-notif-dropdown-header">
            <span className="community-notif-dropdown-title">Notifications</span>
            {count > 0 && (
              <button className="community-link-btn community-notif-mark-all" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="community-notif-empty">
              <span className="nf nf-fa-bell text-3xl opacity-30" />
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div className="community-notif-list">
              {notifications.map((n) => {
                const ni = getNotifIcon(n.type);
                return (
                  <div
                    key={n.id}
                    className={`community-notif-item ${!n.is_read ? 'community-notif-item--unread' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="community-notif-item-icon" style={{ background: `${ni.color}18` }}>
                      <span className={`nf ${ni.icon}`} style={{ color: ni.color }} />
                    </div>
                    <div className="community-notif-item-content">
                      <p>{n.message}</p>
                      <span className="community-notif-item-time">{timeAgo(n.created_at)}</span>
                    </div>
                    {!n.is_read && <span className="community-notif-dot" />}
                  </div>
                );
              })}
            </div>
          )}

          <div className="community-notif-dropdown-footer">
            <button
              className="community-notif-view-all"
              onClick={() => { setOpen(false); navigateTo('/notifications'); }}
            >
              <span className="nf nf-fa-eye" /> View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
