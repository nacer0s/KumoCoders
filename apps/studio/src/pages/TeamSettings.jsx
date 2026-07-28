import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';

export default function TeamSettings({ teamId }) {
  const { token, user } = useAuth();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [inviteError, setInviteError] = useState('');

  function fetchTeam() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then((data) => {
        setTeam(data);
        setMembers(data.members || []);
        setApps(data.apps || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchTeam(); }, [teamId, token]);

  async function handleSearch(q) {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/studio/users/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const existingIds = new Set(members.map((m) => m.user_id));
      setSearchResults(data.filter((u) => !existingIds.has(u.id)));
    } catch {
      setSearchResults([]);
    }
  }

  async function handleInvite(userId) {
    setInviteError('');
    try {
      const res = await fetch(`/api/studio/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, role: 'member' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to invite');
      }
      setSearchQuery('');
      setSearchResults([]);
      fetchTeam();
    } catch (err) {
      setInviteError(err.message);
    }
  }

  async function handleRoleChange(userId, role) {
    try {
      const res = await fetch(`/api/studio/teams/${teamId}/members/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      if (res.ok) fetchTeam();
    } catch {}
  }

  async function handleRemove(userId) {
    try {
      const res = await fetch(`/api/studio/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchTeam();
    } catch {}
  }

  async function handleToggleApp(appId, enabled) {
    try {
      const res = await fetch(`/api/studio/teams/${teamId}/apps/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) fetchTeam();
    } catch {}
  }

  if (loading) {
    return <div className="studio-page-center"><div className="studio-loading-spinner" /></div>;
  }

  if (!team) {
    return <div className="studio-page-center"><p>Team not found</p></div>;
  }

  const isOwner = team.membership_role === 'owner' || team.membership_role === 'admin';

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1>
          <span className={`nf ${team.icon}`} style={{ color: team.color }} />
          {' '}{team.name}
        </h1>
        <p className="studio-text-muted">{team.description || 'Team workspace'}</p>
      </div>

      {/* Apps */}
      <section className="studio-section">
        <h2>Apps</h2>
        <div className="studio-apps-grid">
          {apps.map((app) => (
            <label key={app.id} className="studio-app-toggle">
              <span className={`nf ${app.icon}`} style={{ color: app.color }} />
              <span>{app.name}</span>
              {isOwner && (
                <input
                  type="checkbox"
                  checked={app.enabled}
                  onChange={() => handleToggleApp(app.id, !app.enabled)}
                />
              )}
            </label>
          ))}
        </div>
      </section>

      {/* Members */}
      <section className="studio-section">
        <h2>Members ({members.length})</h2>

        {isOwner && (
          <div className="studio-invite-box">
            <input
              className="studio-input"
              placeholder="Search users by name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {inviteError && <div className="studio-error">{inviteError}</div>}
            {searchResults.length > 0 && (
              <div className="studio-search-results">
                {searchResults.map((u) => (
                  <div key={u.id} className="studio-search-result-item">
                    <div className="studio-avatar-sm">
                      <UserAvatar user={u} />
                    </div>
                    <span>{u.display_name || u.username}</span>
                    <button className="studio-btn studio-btn--sm" onClick={() => handleInvite(u.id)}>
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="studio-members-list">
          {members.map((m) => (
            <div key={m.user_id} className="studio-member-item">
              <div className="studio-avatar">
                <UserAvatar user={m} />
              </div>
              <div className="studio-member-info">
                <strong>{m.display_name || m.username}</strong>
                <span className="studio-text-muted">{m.email}</span>
              </div>
              <div className="studio-member-role">
                {isOwner && m.role !== 'owner' ? (
                  <select
                    className="studio-select"
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <span className="studio-badge">{(m.role || 'member').toUpperCase()}</span>
                )}
                {isOwner && m.role !== 'owner' && (
                  <button className="studio-btn studio-btn--ghost studio-btn--danger" onClick={() => handleRemove(m.user_id)}>
                    <span className="nf nf-fa-trash" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
