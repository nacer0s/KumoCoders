import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';

const styles = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
  },
  statCard: {
    padding: 'var(--space-md)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
  },
  statIcon: {
    fontSize: 'var(--font-size-2xl)',
    opacity: 0.5,
  },
  statValue: {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-bold)',
  },
  sectionCard: {
    padding: 'var(--space-md)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-md)',
  },
  sectionTitle: {
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-semibold)',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-size-sm)',
  },
  avatarStack: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    marginTop: 8,
  },
  avatarOverlap: {
    border: '2px solid var(--color-bg)',
    marginLeft: 0,
  },
  avatarOverlapNext: {
    border: '2px solid var(--color-bg)',
    marginLeft: -12,
  },
  extraAvatar: {
    marginLeft: -12,
    border: '2px solid var(--color-bg)',
    fontSize: 9,
  },
  memberCount: {
    marginLeft: 4,
  },
  emptyState: {
    padding: 'var(--space-md)',
    textAlign: 'center',
  },
  activityIcon: {
    opacity: 0.4,
  },
  activityDate: {
    fontSize: 'var(--font-size-xs)',
    whiteSpace: 'nowrap',
  },
  nfIcon: {
    opacity: 0.4,
  },
};

export default function TeamDashboard({ teamId, navigateTo }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [events, setEvents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function fetchAll() {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [teamRes, tasksRes, filesRes, eventsRes, docsRes] = await Promise.all([
          fetch(`/api/studio/teams/${teamId}`, { headers }),
          fetch(`/api/studio/teams/${teamId}/tasks`, { headers }),
          fetch(`/api/studio/teams/${teamId}/files`, { headers }),
          fetch(`/api/studio/teams/${teamId}/events`, { headers }),
          fetch(`/api/studio/teams/${teamId}/documents`, { headers }),
        ]);

        if (cancelled) return;

        if (!teamRes.ok) throw new Error('Failed to load team');

        const [teamData, tasksData, filesData, eventsData, docsData] = await Promise.all([
          teamRes.json(),
          tasksRes.ok ? tasksRes.json() : [],
          filesRes.ok ? filesRes.json() : [],
          eventsRes.ok ? eventsRes.json() : [],
          docsRes.ok ? docsRes.json() : [],
        ]);

        if (cancelled) return;

        setTeam(teamData);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setFiles(Array.isArray(filesData) ? filesData : []);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setDocuments(Array.isArray(docsData) ? docsData : []);
      } catch (err) {
        if (!cancelled) showToast(err.message, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [teamId, token, showToast]);

  if (loading) return <LoadingSkeleton.Page />;

  if (!team) {
    return <div className="studio-page-center"><p>Team not found</p></div>;
  }

  const members = team.members || [];
  const memberAvatars = members.slice(0, 5);
  const extraCount = members.length - 5;

  const recentTasks = tasks.slice(0, 5);
  const now = new Date();
  const upcomingEvents = events
    .filter(e => new Date(e.start_time || e.date) >= now)
    .slice(0, 5);

  const activity = [
    ...tasks.map(t => ({ ...t, _type: 'task', _label: 'created task' })),
    ...files.map(f => ({ ...f, _type: 'file', _label: 'uploaded file' })),
    ...events.map(e => ({ ...e, _type: 'event', _label: 'created event' })),
    ...documents.map(d => ({ ...d, _type: 'document', _label: 'created document' })),
  ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
   .slice(0, 10);

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function statusBadge(status) {
    const s = (status || 'pending').replace('_', ' ');
    const cls = status === 'done' || status === 'completed'
      ? 'studio-badge--success'
      : status === 'in_progress' || status === 'active'
        ? ''
        : '';
    return <span className={`studio-badge ${cls}`}>{s}</span>;
  }

  function activityIcon(type) {
    const map = {
      task: 'nf-fa-list_check',
      file: 'nf-fa-folder_open',
      event: 'nf-fa-calendar_days',
      document: 'nf-fa-file_lines',
    };
    return <span className={`nf ${map[type] || 'nf-fa-clock'}`} style={styles.activityIcon} />;
  }

  return (
    <div className="studio-page">

      <style>{`
        .studio-dashboard-stats { grid-template-columns: repeat(4, 1fr); }
        .studio-dashboard-columns { grid-template-columns: 1fr 1fr; }
        .studio-dashboard-item:hover { background: var(--color-surface-hover); }
        @media (max-width: 768px) {
          .studio-dashboard-stats { grid-template-columns: repeat(2, 1fr); }
          .studio-dashboard-columns { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .studio-dashboard-stats { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ─── Header ─── */}
      <div className="studio-page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <div>
          <h1>
            <span className={`nf ${team.icon}`} style={{ color: team.color }} />
            {' '}{team.name}
          </h1>
          <p className="studio-text-muted" style={{ marginTop: 4 }}>
            {team.description || 'Team workspace'}
          </p>
          <div style={styles.avatarStack}>
            {memberAvatars.map((m, i) => (
              <div
                key={m.user_id}
                className="studio-avatar-xs"
                style={i === 0 ? styles.avatarOverlap : styles.avatarOverlapNext}
                title={m.display_name || m.username}
              >
                <UserAvatar user={m} />
              </div>
            ))}
            {extraCount > 0 && (
              <div className="studio-avatar-xs" style={styles.extraAvatar}>
                +{extraCount}
              </div>
            )}
            <span className="studio-text-muted" style={styles.memberCount}>
              {members.length} member{members.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="studio-quick-actions">
          <button className="studio-btn studio-btn--glass" onClick={() => navigateTo(`/teams/${teamId}/tasks`)}>
            <span className="nf nf-fa-list_check" /> New Task
          </button>
          <button className="studio-btn studio-btn--glass" onClick={() => navigateTo(`/teams/${teamId}/files`)}>
            <span className="nf nf-fa-upload" /> Upload File
          </button>
          <button className="studio-btn studio-btn--glass" onClick={() => navigateTo(`/teams/${teamId}/calendar`)}>
            <span className="nf nf-fa-calendar_plus" /> New Event
          </button>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="studio-dashboard-stats" style={styles.statsGrid}>
        {[
          { label: 'Total Tasks', value: tasks.length, icon: 'nf-fa-list_check' },
          { label: 'Upcoming Events', value: upcomingEvents.length, icon: 'nf-fa-calendar_days' },
          { label: 'Files', value: files.length, icon: 'nf-fa-folder_open' },
          { label: 'Documents', value: documents.length, icon: 'nf-fa-file_lines' },
        ].map(stat => (
          <div key={stat.label} className="glass" style={styles.statCard}>
            <span className={`nf ${stat.icon}`} style={styles.statIcon} />
            <div>
              <div style={styles.statValue}>{stat.value}</div>
              <div className="studio-text-muted">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Two-Column Layout ─── */}
      <div className="studio-dashboard-columns" style={styles.twoCol}>

        {/* Recent Tasks */}
        <div className="glass" style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Recent Tasks</h3>
            <button className="studio-btn studio-btn--ghost studio-btn--sm" onClick={() => navigateTo(`/teams/${teamId}/tasks`)}>
              View all <span className="nf nf-fa-arrow_right" />
            </button>
          </div>
          {recentTasks.length === 0 ? (
            <div className="studio-text-muted" style={styles.emptyState}>No tasks yet</div>
          ) : (
            <div className="s-list">
              {recentTasks.map(t => (
                <div key={t.id} className="s-list-item" style={styles.listItem}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title || t.name}
                  </span>
                  {statusBadge(t.status)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="glass" style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Upcoming Events</h3>
            <button className="studio-btn studio-btn--ghost studio-btn--sm" onClick={() => navigateTo(`/teams/${teamId}/calendar`)}>
              View all <span className="nf nf-fa-arrow_right" />
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="studio-text-muted" style={styles.emptyState}>No upcoming events</div>
          ) : (
            <div className="s-list">
              {upcomingEvents.map(e => (
                <div key={e.id} className="s-list-item" style={styles.listItem}>
                  <span className="nf nf-fa-calendar" style={styles.nfIcon} />
                  <span style={{ flex: 1 }}>{e.title || e.name}</span>
                  <span className="studio-text-muted" style={styles.activityDate}>
                    {formatDate(e.start_time || e.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ─── Recent Activity ─── */}
      <div className="glass" style={styles.sectionCard}>
        <h3 style={{ ...styles.sectionTitle, marginBottom: 'var(--space-md)' }}>
          Recent Activity
        </h3>
        {activity.length === 0 ? (
          <div className="studio-text-muted" style={styles.emptyState}>No recent activity</div>
        ) : (
          <div className="s-list">
            {activity.map((item, i) => (
              <div key={`${item._type}-${item.id}-${i}`} className="s-list-item" style={styles.listItem}>
                {activityIcon(item._type)}
                <span style={{ flex: 1 }}>
                  <strong>{team.name}</strong> {item._label}{' '}
                  <strong>{item.title || item.name || 'Untitled'}</strong>
                </span>
                <span className="studio-text-muted" style={styles.activityDate}>
                  {formatDate(item.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
