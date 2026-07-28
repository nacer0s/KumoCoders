import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';
import BadgeProgressBar from '../components/BadgeProgressBar.jsx';

export default function AchievementsPage() {
  const { user, token } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/community/badges/${user.id}/all`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
      .then((r) => r.ok ? r.json() : { badges: [] })
      .then((d) => setBadges(d.badges || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, token]);

  const earnedCount = badges.filter((b) => b.earned).length;
  const totalCount = badges.length;

  if (!user) {
    return (
      <div className="community-page-center">
        <p>Please sign in to view your achievements.</p>
        <button className="community-btn community-btn--primary" onClick={() => navigateTo('/login')}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="community-achievements-page">
      {/* Header */}
      <button className="community-btn community-btn--ghost community-back-btn" onClick={() => navigateTo('/')}>
        <span className="nf nf-fa-arrow_left" /> Back to Feed
      </button>

      <div className="community-achievements-header">
        <div className="community-achievements-header-content">
          <h1>Achievements</h1>
          <p>Badges you've earned by being active in the community</p>
        </div>
        <div className="community-achievements-stats">
          <div className="community-achievements-stat">
            <span className="community-achievements-stat-value">{earnedCount}/{totalCount}</span>
            <span className="community-achievements-stat-label">Earned</span>
          </div>
          <div className="community-achievements-stat">
            <span className="community-achievements-stat-value">{totalCount - earnedCount}</span>
            <span className="community-achievements-stat-label">Locked</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="community-loading">
          <div className="community-loading-spinner" />
          <p>Loading achievements...</p>
        </div>
      ) : (
        <div className="community-achievements-grid">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`community-achievement-card ${badge.earned ? 'community-achievement-card--earned' : 'community-achievement-card--locked'}`}
              onClick={() => setSelectedBadge(selectedBadge?.id === badge.id ? null : badge)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setSelectedBadge(selectedBadge?.id === badge.id ? null : badge); }}
            >
              <div className="community-achievement-card-icon">
                <span className={`nf ${badge.icon}`} />
                {badge.earned && <span className="community-achievement-card-check">✓</span>}
              </div>
              <div className="community-achievement-card-name">{badge.name}</div>
              <BadgeProgressBar progress={badge.progress} />
              {!badge.earned && (
                <div className="community-achievement-card-progress">
                  <div className="community-achievement-card-progress-bar">
                    <div
                      className="community-achievement-card-progress-fill"
                      style={{ width: `${(badge.progress.current / badge.progress.target) * 100}%` }}
                    />
                  </div>
                  <span className="community-achievement-card-progress-text">
                    {badge.progress.current}/{badge.progress.target}
                  </span>
                </div>
              )}
              {selectedBadge?.id === badge.id && (
                <div className="community-achievement-card-detail">
                  <p>{badge.description}</p>
                  {badge.earned && badge.awarded_at && (
                    <span className="community-achievement-card-date">
                      Earned {new Date(badge.awarded_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
