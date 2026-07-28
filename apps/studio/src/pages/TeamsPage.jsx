import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../utils/navigate.js';

export default function TeamsPage() {
  const { token } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [error, setError] = useState('');

  function fetchTeams() {
    if (!token) { setLoading(false); return; }
    fetch('/api/studio/teams', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then((data) => { if (Array.isArray(data)) setTeams(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchTeams(); }, [token]);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/studio/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create team');
      }
      const team = await res.json();
      setShowCreate(false);
      setForm({ name: '', description: '', color: '#6366f1' });
      navigateTo(`/teams/${team.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="studio-page-center">
        <div className="studio-loading-spinner" />
      </div>
    );
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1>Studio</h1>
        <p className="studio-text-muted">Teams & Workspaces</p>
      </div>

      {teams.length === 0 ? (
        <div className="studio-empty">
          <span className="nf nf-fa-cubes studio-empty-icon" />
          <h3>No teams yet</h3>
          <p>Create your first team to get started</p>
          <button className="studio-btn studio-btn--primary" onClick={() => setShowCreate(true)}>
            <span className="nf nf-fa-plus" /> Create Team
          </button>
        </div>
      ) : (
        <div className="studio-teams-grid">
          {teams.map((team) => (
            <button
              key={team.id}
              className="studio-team-card glass"
              onClick={() => navigateTo(`/teams/${team.id}`)}
            >
              <div className="studio-team-card-icon" style={{ background: '#77720', color: '#777' }}>
                <span className={`nf ${team.icon || 'nf-fa-users'}`} />
              </div>
              <div className="studio-team-card-body">
                <h3>{team.name}</h3>
                {team.description && <p>{team.description}</p>}
              </div>
              <div className="studio-team-card-role">
                <span className={`studio-badge studio-badge--${team.membership_role}`}>
                  {team.membership_role}
                </span>
              </div>
            </button>
          ))}

          <button className="studio-team-card studio-team-card--new glass" onClick={() => setShowCreate(true)}>
            <span className="nf nf-fa-plus" />
            <span>Create Team</span>
          </button>
        </div>
      )}

      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal">
            <div className="studio-modal-header">
              <h2>Create Team</h2>
              <button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}>
                <span className="nf nf-fa-xmark" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="studio-form">
              {error && <div className="studio-error">{error}</div>}
              <label className="studio-label">
                Team Name
                <input
                  className="studio-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. Design Team"
                />
              </label>
              <label className="studio-label">
                Description
                <textarea
                  className="studio-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this team for?"
                  rows={3}
                />
              </label>
              <label className="studio-label">
                Color
                <input
                  type="color"
                  className="studio-color-input"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </label>
              <div className="studio-form-actions">
                <button type="button" className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="studio-btn studio-btn--primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
