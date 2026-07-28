import { useState, useEffect } from 'react';
import { navigateTo } from '../App.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';
import SkeletonLeaderboard from '../components/skeletons/SkeletonLeaderboard.jsx';

export default function LeaderboardPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/community/leaderboard?period=${period}`)
      .then((r) => r.json())
      .then((d) => setRows(d.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const MEDALS = ['🥇', '🥈', '🥉'];

  return (
    <div className="community-page">
      <div className="community-page-header">
        <h1><span className="nf nf-fa-trophy" /> Leaderboard</h1>
        <p>Top contributors in the community</p>
      </div>

      <div className="community-sort-tabs">
        {[{ key: 'all', label: 'All Time' }, { key: 'month', label: 'This Month' }, { key: 'week', label: 'This Week' }].map((opt) => (
          <button key={opt.key} className={`community-sort-tab ${period === opt.key ? 'community-sort-tab--active' : ''}`} onClick={() => setPeriod(opt.key)}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="community-card community-leaderboard-card">
          <SkeletonLeaderboard count={10} />
        </div>
      ) : rows.length === 0 ? (
        <div className="community-empty"><p>No data yet</p></div>
      ) : (
        <div className="community-card community-leaderboard-card">
          {rows.map((row, i) => (
            <div
              key={row.id}
              className="community-list-item community-leaderboard-row"
              onClick={() => navigateTo(`/profile/${row.username}`)}
            >
              <div className="community-leaderboard-rank">
                {i < 3 ? MEDALS[i] : `#${i + 1}`}
              </div>
              <div className="community-avatar community-avatar--sm"><UserAvatar user={row} /></div>
              <span className="community-leaderboard-name">
                {row.display_name || row.username}
                {row.is_verified === 1 && (
                  <span className={`nf nf-md-check_decagram community-verified-badge${row.role_id !== 2 ? ' community-verified-badge--gold' : ''}`} />
                )}
              </span>
              <div className="community-leaderboard-stats">
                <span><span className="nf nf-fa-fire" /> {row.total_likes} likes</span>
                <span><span className="nf nf-fa-pen_to_square" /> {row.post_count} posts</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
