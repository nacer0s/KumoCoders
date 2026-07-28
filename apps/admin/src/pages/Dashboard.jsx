import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';
import AdminLayout from '../components/AdminLayout.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatNumber(n) {
  if (n === undefined || n === null) return '—';
  const num = Number(n);
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ─── Mini bar chart ─────────────────────────────────
function MiniBarChart({ data, labelKey = 'date', valueKey = 'count' }) {
  if (!data || data.length === 0) {
    return <div className="admin-text-muted py-space-2xl text-center text-font-size-xs">No data yet</div>;
  }

  const maxVal = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="admin-chart-bars">
      {data.map((d, i) => {
        const val = d[valueKey] || 0;
        const pct = (val / maxVal) * 100;
        const isToday = String(d[labelKey]).slice(0, 10) === todayStr;
        return (
          <div key={i} className="admin-chart-bar-wrapper" title={`${d[labelKey]}: ${val}`}>
            <div
              className={`admin-chart-bar ${isToday ? 'admin-chart-bar--today' : ''}`}
              style={{ height: `${Math.max(pct, 3)}%` }}
            />
            <span className="admin-chart-bar-label">
              {data.length <= 8 ? formatDateLabel(d[labelKey]) : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────
function StatCard({ icon, value, label, trend, footer, onClick }) {
  return (
    <div
      className="admin-stat-card--extended glass"
      onClick={onClick}
      className={`admin-stat-card--extended glass ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="admin-stat-header">
        <div className="admin-stat-icon-lg">
          <span className={`nf ${icon}`} />
        </div>
        {trend !== undefined && (
          <span className={`admin-stat-trend ${trend > 0 ? 'admin-stat-trend--up' : 'admin-stat-trend--neutral'}`}>
            {trend > 0 ? `+${trend}` : trend} this week
          </span>
        )}
      </div>
      <div>
        <div className="admin-stat-value-lg">{formatNumber(value)}</div>
        <div className="admin-stat-label">{label}</div>
      </div>
      {footer && <div className="admin-stat-footer">{footer}</div>}
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────
export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  function fetchStats() {
    if (!token) return;
    setRefreshing(true);

    fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch platform stats');
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    fetchStats();
  }, [token]);

  function handleRefresh() {
    if (!refreshing) fetchStats();
  }

  return (
    <AdminLayout title="Platform Dashboard">
      {/* ─── Error + Refresh ─── */}
      {error && (
        <div className="admin-error flex items-center justify-between">
          <span>{error}</span>
          <button className="admin-btn admin-btn--ghost px-3 py-1 text-font-size-xs" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading platform statistics...</p>
        </div>
      ) : stats ? (
        <>
          {/* ─── Primary Stats Grid ─── */}
          <div className="admin-stats-grid--extended">
            <StatCard
              icon="nf-fa-users"
              value={stats.users.active}
              label="Active Users"
              trend={stats.users.newThisWeek}
              footer={`${formatNumber(stats.users.total)} total · ${stats.users.admins} admin${stats.users.admins !== 1 ? 's' : ''}`}
              onClick={() => navigateTo('/admin/users')}
            />
            <StatCard
              icon="nf-fa-newspaper"
              value={stats.posts.total}
              label="Community Posts"
              trend={stats.posts.thisWeek}
              footer={`${stats.posts.pinned} pinned · avg ${stats.posts.avgLikes} likes, ${stats.posts.avgComments} comments`}
            />
            <StatCard
              icon="nf-fa-message"
              value={stats.comments.total}
              label="Comments"
              trend={stats.comments.thisWeek}
            />
            <StatCard
              icon="nf-fa-heart"
              value={stats.likes.total}
              label="Total Likes"
              trend={stats.likes.thisWeek}
            />
            <StatCard
              icon="nf-fa-bookmark"
              value={stats.bookmarks.total}
              label="Bookmarks"
              footer={`${formatNumber(stats.bookmarks.uniqueUsers)} unique users bookmarking`}
            />
            <StatCard
              icon="nf-fa-bell"
              value={stats.notifications.total}
              label="Notifications Sent"
              footer={`${formatNumber(stats.notifications.unread)} unread`}
            />
          </div>

          {/* ─── Charts Row ─── */}
          <div className="admin-charts-grid">
            <div className="admin-chart-card glass">
              <h3><span className="nf nf-fa-newspaper" /> Posts</h3>
              <MiniBarChart data={stats.activity.postsPerDay} />
            </div>
            <div className="admin-chart-card glass">
              <h3><span className="nf nf-fa-heart" /> Likes</h3>
              <MiniBarChart data={stats.activity.likesPerDay} />
            </div>
            <div className="admin-chart-card glass">
              <h3><span className="nf nf-fa-user_plus" /> New Users</h3>
              <MiniBarChart data={stats.activity.usersPerDay} />
            </div>
          </div>

          {/* ─── Sub-grid: Badges, Polls, Popular Posts, Active Commenters ─── */}
          <div className="admin-sub-grid">
            {/* Left column */}
            <div>
              {/* Badges Card */}
              <div className="admin-card glass">
                <div className="admin-card-header">
                  <h2><span className="nf nf-fa-award" /> Badges</h2>
                </div>
                <div className="admin-detail-stat">
                  <span className="admin-detail-stat-label"><span className="nf nf-fa-trophy" /> Badge Definitions</span>
                  <span className="admin-detail-stat-value">{stats.badges.totalDefinitions}</span>
                </div>
                <div className="admin-detail-stat">
                  <span className="admin-detail-stat-label"><span className="nf nf-fa-medal" /> Total Awarded</span>
                  <span className="admin-detail-stat-value">{formatNumber(stats.badges.totalAwarded)}</span>
                </div>
                <div className="admin-detail-stat">
                  <span className="admin-detail-stat-label"><span className="nf nf-fa-users" /> Users with Badges</span>
                  <span className="admin-detail-stat-value">{formatNumber(stats.badges.usersWithBadges)}</span>
                </div>
                {stats.badges.breakdown && stats.badges.breakdown.length > 0 && (
                  <div className="mt-space-md">
                    <p className="admin-text-muted text-font-size-xs mb-space-sm">
                      Badge breakdown:
                    </p>
                    <div className="admin-badge-breakdown">
                      {stats.badges.breakdown.map((b, i) => (
                        <span key={i} className="admin-badge-pill">
                          {b.icon ? <span className={`nf ${b.icon}`} /> : '🏅'} {b.name} <span className="admin-badge-count">{b.awarded_count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Polls Card */}
              <div className="admin-card glass">
                <div className="admin-card-header">
                  <h2><span className="nf nf-fa-chart_bar" /> Polls</h2>
                </div>
                <div className="admin-detail-stat">
                  <span className="admin-detail-stat-label"><span className="nf nf-fa-chart_bar" /> Total Polls</span>
                  <span className="admin-detail-stat-value">{formatNumber(stats.polls.total)}</span>
                </div>
                <div className="admin-detail-stat">
                  <span className="admin-detail-stat-label"><span className="nf nf-fa-check_double" /> Total Votes Cast</span>
                  <span className="admin-detail-stat-value">{formatNumber(stats.polls.totalVotes)}</span>
                </div>
              </div>

              {/* Content Card */}
              <div className="admin-card glass">
                <div className="admin-card-header">
                  <h2><span className="nf nf-fa-file_lines" /> Landing Page Content</h2>
                </div>
                <div className="admin-detail-stat">
                  <span className="admin-detail-stat-label"><span className="nf nf-fa-file_lines" /> Sections</span>
                  <span className="admin-detail-stat-value">{formatNumber(stats.content.totalSections)}</span>
                </div>
                <div className="mt-space-md flex gap-space-sm">
                  <button className="admin-btn admin-btn--glass w-full" onClick={() => navigateTo('/admin/content')}>
                    <span className="nf nf-fa-edit" /> Manage Content
                  </button>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div>
              {/* Most Liked Posts */}
              <div className="admin-card glass">
                <div className="admin-card-header">
                  <h2><span className="nf nf-fa-fire" /> Most Liked Posts</h2>
                </div>
                {stats.posts.popularPosts && stats.posts.popularPosts.length > 0 ? (
                  <div className="admin-popular-list">
                    {stats.posts.popularPosts.map((post, i) => (
                      <div key={post.id} className="admin-popular-item">
                        <span className="admin-popular-rank">#{i + 1}</span>
                        <div className="admin-popular-avatar">
                          <UserAvatar user={{ username: post.author_username, display_name: post.author_display_name, avatar_url: post.author_avatar_url }} />
                        </div>
                        <div className="admin-popular-body">
                          <div className="admin-popular-title">{post.title}</div>
                          <div className="admin-popular-meta">
                            <span className="admin-popular-stats-icon">
                              <span className="nf nf-fa-heart text-font-size-xs" /> {post.like_count}
                            </span>
                            <span className="admin-popular-stats-icon">
                              <span className="nf nf-fa-message text-font-size-xs" /> {post.comment_count}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="admin-text-muted">No popular posts yet.</p>
                )}
              </div>

              {/* Most Active Commenters */}
              <div className="admin-card glass">
                <div className="admin-card-header">
                  <h2><span className="nf nf-fa-comments" /> Top Commenters</h2>
                </div>
                {stats.comments.activeCommenters && stats.comments.activeCommenters.length > 0 ? (
                  <div className="admin-commenter-list">
                    {stats.comments.activeCommenters.map((c, i) => (
                      <div key={c.id} className="admin-commenter-item">
                        <span className="admin-commenter-rank">#{i + 1}</span>
                        <div className="admin-popular-avatar">
                          <UserAvatar user={{ ...c, avatar_url: c.avatar_url }} />
                        </div>
                        <span className="admin-commenter-name">{c.display_name || c.username}</span>
                        <span className="admin-commenter-count">{c.comment_count} comment{c.comment_count !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="admin-text-muted">No commenters yet.</p>
                )}
              </div>

              {/* Users Card */}
              <div className="admin-card glass">
                <div className="admin-card-header">
                  <h2><span className="nf nf-fa-user_plus" /> New Users</h2>
                  <p className="admin-text-muted">Latest registrations</p>
                </div>
                {stats.users.latestUsers && stats.users.latestUsers.length > 0 ? (
                  <div className="admin-commenter-list">
                    {stats.users.latestUsers.map((u) => (
                      <div key={u.id} className="admin-commenter-item">
                        <div className="admin-popular-avatar">
                          <UserAvatar user={u} />
                        </div>
                        <div className="flex-1">
                          <div className="admin-commenter-name">{u.display_name || u.username}</div>
                          <div className="admin-popular-meta">
                            <span>{u.email}</span>
                            <span className={`admin-role-badge ${u.role_id === 1 ? 'admin-role-badge--admin' : 'admin-role-badge--member'}`}>
                              {u.role_id === 1 ? 'Admin' : 'Member'}
                            </span>
                          </div>
                        </div>
                        <span className="admin-commenter-count">{timeAgo(u.created_at)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="admin-text-muted">No users yet.</p>
                )}
                <div className="mt-space-md">
                  <button className="admin-btn admin-btn--glass w-full" onClick={() => navigateTo('/admin/users')}>
                    <span className="nf nf-fa-users" /> View All Users
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Recent Activity ─── */}
          <div className="admin-card glass">
            <div className="admin-card-header flex items-center justify-between">
              <div>
                <h2><span className="nf nf-fa-clock" /> Recent Activity</h2>
                <p className="admin-text-muted">Latest posts and comments across the platform</p>
              </div>
              <button className="admin-btn admin-btn--ghost px-space-md py-1.5 text-font-size-sm" onClick={handleRefresh} disabled={refreshing}>
                <span className="nf nf-fa-rotate" /> {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            {stats.activity.recentActivity && stats.activity.recentActivity.length > 0 ? (
              <div className="admin-activity-list">
                {stats.activity.recentActivity.map((item, i) => (
                  <div key={`${item.type}-${item.id}-${i}`} className="admin-activity-item">
                    <div className={`admin-activity-icon ${item.type === 'post' ? 'admin-activity-icon--post' : 'admin-activity-icon--comment'}`}>
                      <span className={`nf ${item.type === 'post' ? 'nf-fa-newspaper' : 'nf-fa-message'}`} />
                    </div>
                    <div className="admin-activity-body">
                      <div className="admin-activity-text">
                        <strong>{item.display_name || item.username}</strong>
                        {item.type === 'post' ? ' created a post: ' : ' commented: '}
                        {item.title}
                      </div>
                      <div className="admin-activity-meta">
                        <span className="admin-activity-time">{timeAgo(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-text-muted">No recent activity.</p>
            )}
          </div>

          {/* ─── Quick Actions ─── */}
          <div className="admin-card glass">
            <div className="admin-card-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="admin-quick-actions">
              <button className="admin-btn admin-btn--glass" onClick={() => navigateTo('/admin/content')}>
                <span className="nf nf-fa-edit" /> Edit Landing Page Content
              </button>
              <button className="admin-btn admin-btn--glass" onClick={() => navigateTo('/admin/users')}>
                <span className="nf nf-fa-users_gear" /> Manage Team Members
              </button>
              <button className="admin-btn admin-btn--glass" onClick={() => navigateTo('/admin/settings')}>
                <span className="nf nf-fa-gear" /> Platform Settings
              </button>
            </div>
          </div>

          {/* ─── Last Updated Timestamp ─── */}
          <p className="admin-text-muted text-center text-font-size-xs">
            Last updated: {new Date(stats.lastUpdated).toLocaleString()}
          </p>
        </>
      ) : null}
    </AdminLayout>
  );
}
