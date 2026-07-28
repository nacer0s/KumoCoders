import { useState, useEffect } from 'react';
import { navigateTo } from '../App.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';

export default function FollowList({ type, userId, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const endpoint = type === 'followers'
      ? `/api/community/users/${userId}/followers`
      : `/api/community/users/${userId}/following`;

    fetch(endpoint)
      .then((r) => r.ok ? r.json() : { followers: [], following: [] })
      .then((d) => {
        const list = d.followers || d.following || [];
        setUsers(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type, userId]);

  function handleUserClick(u) {
    onClose();
    navigateTo(`/profile/${u.username}`);
  }

  return (
    <div className="community-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="community-modal glass">
        <div className="community-modal-header">
          <h3>{type === 'followers' ? 'Followers' : 'Following'}</h3>
          <button className="community-btn community-btn--icon" onClick={onClose} aria-label="Close">
            <span className="nf nf-fa-xmark" />
          </button>
        </div>
        <div className="community-modal-body">
          {loading ? (
            <div className="community-loading p-8">
              <div className="community-loading-spinner" />
            </div>
          ) : users.length === 0 ? (
            <p className="community-empty p-8 text-text-muted text-center">
              {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </p>
          ) : (
            <div className="community-follow-list">
              {users.map((u) => (
                <button
                  key={u.id}
                  className="community-follow-item"
                  onClick={() => handleUserClick(u)}
                >
                  <div className="community-avatar community-avatar--sm">
                    <UserAvatar user={u} />
                  </div>
                  <div className="community-follow-item-info">
                    <span className="community-follow-item-name">
                      {u.display_name || u.username || 'Unknown'}
                      {u.is_verified === 1 && (
                        <span className={`nf nf-md-check_decagram community-verified-badge${u.role_id !== 2 ? ' community-verified-badge--gold' : ''}`} title={u.role_id !== 2 ? 'Member Verified Account' : 'Community Verified Account'} />
                      )}
                    </span>
                    {u.display_name && u.username && (
                      <span className="community-follow-item-username">@{u.username}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
