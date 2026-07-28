import { useState, useEffect } from 'react';
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
    case 'like':    return { icon: 'nf-fa-heart',    color: '#EF4444', label: 'Like' };
    case 'comment': return { icon: 'nf-fa-comment',  color: '#3B82F6', label: 'Comment' };
    case 'badge':  return { icon: 'nf-fa-trophy',   color: '#F59E0B', label: 'Badge' };
    case 'mention': return { icon: 'nf-fa-at',       color: '#8B5CF6', label: 'Mention' };
    default:        return { icon: 'nf-fa-bell',     color: '#808080', label: 'System' };
  }
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'like', label: 'Likes' },
  { key: 'comment', label: 'Comments' },
  { key: 'badge', label: 'Badges' },
];

export default function NotificationsPage() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [count, setCount] = useState(0);

  // Fetch notifications
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '20');

    fetch(`/api/community/notifications?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : { notifications: [], total: 0 })
      .then((d) => {
        if (page === 1) {
          setNotifications(d.notifications || []);
        } else {
          setNotifications((prev) => [...prev, ...(d.notifications || [])]);
        }
        setHasMore(d.total > page * 20);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page]);

  // Fetch unread count for badge
  useEffect(() => {
    if (!token) return;
    fetch('/api/community/notifications/count', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : { count: 0 })
      .then((d) => setCount(d.count || 0))
      .catch(() => {});
  }, [token, notifications]);

  async function handleMarkRead(id) {
    try {
      await fetch(`/api/community/notifications/read/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
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
    if (n.link) {
      navigateTo(n.link.replace('/community', ''));
    }
  }

  const filtered = activeFilter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === activeFilter);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!user) {
    return (
      <div className="community-page-center">
        <p>Please sign in to view notifications.</p>
      </div>
    );
  }

  return (
    <div className="community-notif-page">
      {/* Header */}
      <div className="community-notif-page-header">
        <div>
          <h1>Notifications</h1>
          <p className="community-notif-page-subtitle">
            {count > 0
              ? `You have ${count} unread notification${count !== 1 ? 's' : ''}`
              : 'You\'re all caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="community-btn community-btn--ghost" onClick={handleMarkAllRead}>
            <span className="nf nf-fa-check_double" /> Mark All Read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="community-notif-page-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`community-notif-page-tab ${activeFilter === f.key ? 'community-notif-page-tab--active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Back button */}
      <button className="community-btn community-btn--ghost community-back-btn" onClick={() => navigateTo('/')}>
        <span className="nf nf-fa-arrow_left" /> Back to Feed
      </button>

      {/* Content */}
      {loading && page === 1 ? (
        <div className="community-loading">
          <div className="community-loading-spinner" />
          <p>Loading notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="community-empty">
          <span className="nf nf-fa-bell text-4xl opacity-40" />
          <h3>No notifications</h3>
          <p>
            {activeFilter === 'all'
              ? 'You have no notifications yet.'
              : `No ${activeFilter} notifications.`}
          </p>
        </div>
      ) : (
        <div className="community-notif-page-list">
          {filtered.map((n) => {
            const ni = getNotifIcon(n.type);
            return (
              <div
                key={n.id}
                className={`community-notif-page-item ${!n.is_read ? 'community-notif-page-item--unread' : ''}`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="community-notif-page-item-icon" style={{ background: `${ni.color}18` }}>
                  <span className={`nf ${ni.icon}`} style={{ color: ni.color }} />
                </div>
                <div className="community-notif-page-item-content">
                  <div className="community-notif-page-item-top">
                    <span className="community-notif-page-item-type">{ni.label}</span>
                    <span className="community-notif-page-item-time">{timeAgo(n.created_at)}</span>
                  </div>
                  <p>{n.message}</p>
                </div>
                {!n.is_read && <span className="community-notif-dot" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="community-pagination mt-space-lg">
          <button
            className="community-btn community-btn--ghost"
            onClick={() => setPage((p) => p + 1)}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
