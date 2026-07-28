import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import useSocket from '../hooks/useSocket.js';
import ErrorBoundary from './ErrorBoundary.jsx';
import { ToastProvider } from '../contexts/ToastContext.jsx';
import CommandPalette from './CommandPalette.jsx';
import PresenceAvatars from './PresenceAvatars.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Community', href: '/community' },
  { label: 'Admin', href: '/admin' },
  { label: 'Reports', href: '/reports' },
  { label: 'Studio', href: '/studio' },
];

function SiteMapFallback() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button className="studio-btn studio-btn--icon" onClick={() => setOpen(!open)} title="Site Map">
        <span className="nf nf-fa-sitemap" />
      </button>
      {open && (
        <>
          <div className="studio-backdrop" onClick={() => setOpen(false)} />
          <div className="studio-dropdown" style={{ right: 0, minWidth: 160 }}>
            {NAV_LINKS.map((l) => (
              <a key={l.href} className="studio-dropdown-item" href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const CATEGORIES = [
  { key: 'communicate', label: 'Communicate', icon: 'nf-fa-comments' },
  { key: 'organize', label: 'Organize', icon: 'nf-fa-list' },
  { key: 'create', label: 'Create', icon: 'nf-fa-pen_fancy' },
  { key: 'explore', label: 'Explore', icon: 'nf-fa-magnifying_glass' },
  { key: 'people', label: 'People', icon: 'nf-fa-users' },
  { key: 'manage', label: 'Manage', icon: 'nf-fa-gear' },
  { key: 'operate', label: 'Operations', icon: 'nf-fa-gears' },
  { key: 'advanced', label: 'Advanced', icon: 'nf-fa-rocket' },
];

const APP_ITEMS = [
  { key: 'chat', label: 'Chat', icon: 'nf-fa-comments', cat: 'communicate' },
  { key: 'voice', label: 'Voice', icon: 'nf-fa-microphone', cat: 'communicate' },
  { key: 'video', label: 'Video', icon: 'nf-fa-video', cat: 'communicate' },
  { key: 'calls', label: 'Calls', icon: 'nf-fa-phone', cat: 'communicate' },
  { key: 'screenshare', label: 'Share', icon: 'nf-fa-display', cat: 'communicate' },
  { key: 'meetings', label: 'Meetings', icon: 'nf-fa-notes_medical', cat: 'communicate' },
  { key: 'email', label: 'Email', icon: 'nf-fa-envelope', cat: 'communicate' },
  { key: 'tasks', label: 'Tasks', icon: 'nf-fa-list_check', cat: 'organize' },
  { key: 'kanban', label: 'Kanban', icon: 'nf-fa-columns', cat: 'organize' },
  { key: 'sprint', label: 'Sprint', icon: 'nf-fa-sprint', cat: 'organize' },
  { key: 'timeline', label: 'Timeline', icon: 'nf-fa-chart_bar', cat: 'organize' },
  { key: 'calendar', label: 'Calendar', icon: 'nf-fa-calendar_days', cat: 'organize' },
  { key: 'files', label: 'Files', icon: 'nf-fa-folder_open', cat: 'create' },
  { key: 'docs', label: 'Docs', icon: 'nf-fa-file_lines', cat: 'create' },
  { key: 'wiki', label: 'Wiki', icon: 'nf-fa-book', cat: 'create' },
  { key: 'whiteboard', label: 'Whiteboard', icon: 'nf-fa-pen_fancy', cat: 'create' },
  { key: 'mindmap', label: 'Mind Map', icon: 'nf-fa-diagram_project', cat: 'create' },
  { key: 'forms', label: 'Forms', icon: 'nf-fa-list', cat: 'create' },
  { key: 'scratchpad', label: 'Scratch', icon: 'nf-fa-note_sticky', cat: 'create' },
  { key: 'bookmarks', label: 'Bookmarks', icon: 'nf-fa-bookmark', cat: 'create' },
  { key: 'database', label: 'Database', icon: 'nf-fa-table', cat: 'explore' },
  { key: 'apiplayground', label: 'API Playground', icon: 'nf-fa-code', cat: 'explore' },
  { key: 'polls', label: 'Polls', icon: 'nf-fa-chart_simple', cat: 'explore' },
  { key: 'analytics', label: 'Analytics', icon: 'nf-fa-chart_pie', cat: 'explore' },
  { key: 'directory', label: 'Directory', icon: 'nf-fa-address_card', cat: 'people' },
  { key: 'crm', label: 'CRM', icon: 'nf-fa-address_book', cat: 'people' },
  { key: 'notifications', label: 'Notifications', icon: 'nf-fa-bell', cat: 'people' },
  { key: 'activitylog', label: 'Activity', icon: 'nf-fa_timeline', cat: 'people' },
  { key: 'announcements', label: 'Announce', icon: 'nf-fa-bullhorn', cat: 'people' },
  { key: 'okr', label: 'OKR', icon: 'nf-fa-bullseye', cat: 'people' },
  { key: 'retro', label: 'Retro', icon: 'nf-fa-rotate_left', cat: 'people' },
  { key: 'expenses', label: 'Expenses', icon: 'nf-fa-money_bill', cat: 'manage' },
  { key: 'invoices', label: 'Invoices', icon: 'nf-fa-file_invoice', cat: 'manage' },
  { key: 'timetracking', label: 'Time', icon: 'nf-fa-clock', cat: 'manage' },
  { key: 'permissions', label: 'Permissions', icon: 'nf-fa-shield', cat: 'manage' },
  { key: 'resourceplanner', label: 'Resource Planner', icon: 'nf-fa-calendar_week', cat: 'operate' },
  { key: 'helpdesk', label: 'Help Desk', icon: 'nf-fa-ticket', cat: 'operate' },
  { key: 'performancereviews', label: 'Performance', icon: 'nf-fa-star', cat: 'operate' },
  { key: 'onboarding', label: 'Onboarding', icon: 'nf-fa-clipboard_list', cat: 'operate' },
  { key: 'aiassistant', label: 'AI Assistant', icon: 'nf-fa-robot', cat: 'advanced' },
  { key: 'integrations', label: 'Integrations', icon: 'nf-fa-plug', cat: 'advanced' },
  { key: 'clientportal', label: 'Client Portal', icon: 'nf-fa-globe', cat: 'advanced' },
  { key: 'automations', label: 'Automations', icon: 'nf-fa-gears', cat: 'advanced' },
  { key: 'reportsbuilder', label: 'Reports', icon: 'nf-fa-chart_pie', cat: 'advanced' },
  { key: 'meetingnotes', label: 'Meeting Notes', icon: 'nf-fa-notes_medical', cat: 'advanced' },
  { key: 'recruitment', label: 'Recruitment', icon: 'nf-fa-user_tie', cat: 'advanced' },
  { key: 'lms', label: 'LMS', icon: 'nf-fa-graduation_cap', cat: 'advanced' },
  { key: 'contracts', label: 'Contracts', icon: 'nf-fa-file_signature', cat: 'advanced' },
  { key: 'nps', label: 'NPS', icon: 'nf-fa-face_smile', cat: 'advanced' },
  { key: 'dataexport', label: 'Data Export', icon: 'nf-fa-download', cat: 'advanced' },
  { key: 'decisionlog', label: 'Decision Log', icon: 'nf-fa-scale_balanced', cat: 'advanced' },
  { key: 'videovoicemail', label: 'Video Msg', icon: 'nf-fa-video', cat: 'advanced' },
];

export default function StudioLayout({ children, currentRoute, navigateTo }) {
  const { user, logout, token, loading: authLoading } = useAuth();
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openCategory, setOpenCategory] = useState(() => CATEGORIES[0]?.key || 'communicate');
  const [notifCount, setNotifCount] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [theme, setTheme] = useState(() =>
    document.documentElement.getAttribute('data-theme') || 'dark'
  );

  useEffect(() => {
    function handleOnline() { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  function loadTeams() {
    if (!token) return;
    fetch('/api/studio/teams', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error('Failed to fetch teams'); return r.json(); })
      .then((data) => {
        if (!Array.isArray(data)) return;
        setTeams(data);
        if (currentRoute.params.teamId) {
          setActiveTeam(data.find((t) => t.id === currentRoute.params.teamId) || data[0] || null);
        } else if (data.length > 0) {
          setActiveTeam(data[0]);
        }
      })
      .catch(() => {});
  }

  useEffect(() => { loadTeams(); }, [token]);

  useEffect(() => {
    if (currentRoute.params.teamId) {
      const existing = teams.find((t) => t.id === currentRoute.params.teamId);
      if (!existing) loadTeams();
      else setActiveTeam(existing);
    } else {
      setActiveTeam(null);
    }
  }, [currentRoute.params.teamId]);

  useEffect(() => {
    if (currentRoute.params.teamId && Array.isArray(teams) && teams.length > 0) {
      setActiveTeam(teams.find((t) => t.id === currentRoute.params.teamId) || teams[0]);
    }
  }, [currentRoute.params.teamId, teams]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const favicon = document.getElementById('favicon');
    if (favicon) {
      favicon.href = theme === 'dark' ? '/studio/favicon-dark.svg' : '/studio/favicon-light.svg';
    }
  }, [theme]);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((p) => !p);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { socketRef, on, off } = useSocket(user, token);

  useEffect(() => {
    if (!user || !activeTeam) return;
    const teamId = activeTeam.id;

    socketRef.current?.emit('join:user', `user:${user.id}`);

    const unsubNew = on('notification:new', () => {
      setNotifCount((c) => c + 1);
    });
    const unsubUnread = on('notification:unread', (count) => {
      setNotifCount(count);
    });

    fetch(`/api/studio/notifications/${teamId}/unread`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.count === 'number') setNotifCount(data.count);
      })
      .catch(() => {});

    return () => {
      unsubNew?.();
      unsubUnread?.();
    };
  }, [user?.id, activeTeam?.id, token]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('kumocoders-theme', next);
    setTheme(next);
  }

  const activeAppKey = currentRoute.route === 'app' ? currentRoute.params.appKey : null;

  function handleNav(key) {
    if (activeTeam) {
      navigateTo(`/teams/${activeTeam.id}/${key}`);
      setMobileNavOpen(false);
    }
  }

  function handleBackToTeams() {
    navigateTo('');
    setActiveTeam(null);
  }

  function handleTeamSelect(team) {
    setActiveTeam(team);
    navigateTo(`/teams/${team.id}`);
  }

  function handlePaletteNav(key) {
    handleNav(key);
    setPaletteOpen(false);
  }

  return (
    <ToastProvider>
    <div className="studio-body">
      {!isOnline && <div style={{ background: '#f84', color: '#fff', textAlign: 'center', padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>You're offline — some features may be unavailable</div>}
      {paletteOpen && (
        <CommandPalette items={APP_ITEMS} onNavigate={handlePaletteNav} onClose={() => setPaletteOpen(false)} />
      )}
      {/* ─── Navbar blur backdrop (fixed, Chrome-safe) ─── */}
      <div className="navbar-blur-backdrop" aria-hidden="true" />
      {/* ─── Top Navbar ─── */}
      <nav className="studio-navbar">
        <div className="studio-navbar-inner">
          <button
            className="studio-hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <span className="nf nf-fa-bars" />
          </button>

          <div className="studio-navbar-brand">
            {activeTeam ? (
              <button
                className="studio-navbar-back"
                onClick={handleBackToTeams}
                title="All teams"
              >
                <span className="nf nf-fa-chevron_left" />
              </button>
            ) : null}
            <span className={`nf ${activeTeam?.icon || 'nf-fa-cubes'}`}
              style={{ color: activeTeam?.color }} />
            <span>{activeTeam ? activeTeam.name : 'Studio'}</span>
          </div>

          <div className="studio-navbar-right">
            <SiteMapFallback />

            <button
              className="studio-btn studio-btn--icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <span className="nf nf-md-white_balance_sunny" />
              ) : (
                <span className="nf nf-md-moon_waning_crescent" />
              )}
            </button>

            <button className="studio-btn studio-btn--icon" onClick={() => { if (activeTeam) navigateTo(`/teams/${activeTeam.id}/notifications`) }} title="Notifications" style={{ position: 'relative' }}>
              <span className="nf nf-fa-bell" />
              {notifCount > 0 && <span className="s-notif-badge">{notifCount > 99 ? '99+' : notifCount}</span>}
            </button>

            <button className="studio-btn studio-btn--icon" onClick={() => { if (activeTeam) navigateTo(`/teams/${activeTeam.id}/search`) }} title="Search">
              <span className="nf nf-fa-magnifying_glass" />
            </button>

            {user ? (
              <div className="studio-user-area" style={{ position: 'relative' }}>
                <button
                  className="studio-avatar-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="studio-avatar">
                    <UserAvatar user={user} />
                  </div>
                  <span className="studio-user-name">{user.display_name || user.username}</span>
                </button>
                {showUserMenu && (
                  <>
                    <div className="studio-backdrop" onClick={() => setShowUserMenu(false)} />
                    <div className="studio-dropdown">
                      <div className="studio-dropdown-user">
                        <strong>{user.display_name || user.username}</strong>
                        <span className="studio-text-muted">{user.email}</span>
                      </div>
                      <hr className="studio-divider" />
                      <button className="studio-dropdown-item" onClick={() => { logout(); window.location.href = '/'; }}>
                        <span className="nf nf-fa-sign_out" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button className="studio-btn studio-btn--primary" onClick={() => navigateTo('/login')}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="studio-layout">
        {/* ─── Sidebar Overlay ─── */}
        {sidebarOpen && <div className="studio-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ─── Sidebar ─── */}
        <aside className={`studio-sidebar glass ${sidebarOpen ? 'studio-sidebar--open' : ''}`}>
          <div className="studio-sidebar-header">
            <span className="studio-sidebar-title">Studio</span>
            <button className="studio-sidebar-close" onClick={() => setSidebarOpen(false)}>
              <span className="nf nf-fa-xmark" />
            </button>
          </div>

          <div className="studio-sidebar-teams">
            {teams.map((team) => (
              <button
                key={team.id}
                className={`studio-team-btn ${activeTeam?.id === team.id ? 'studio-team-btn--active' : ''}`}
                onClick={() => { handleTeamSelect(team); setSidebarOpen(false); }}
              >
                <span className={`nf ${team.icon}`} style={{ color: team.color }} />
                <span>{team.name}</span>
              </button>
            ))}
          </div>

          {activeTeam && (
            <div className="studio-sidebar-apps">
              <div className="studio-sidebar-label">Apps</div>
              {CATEGORIES.map(cat => {
                const catApps = APP_ITEMS.filter(a => a.cat === cat.key);
                const isOpen = openCategory === cat.key;
                return (
                  <div key={cat.key} className="studio-category">
                    <button className="studio-category-header" onClick={() => setOpenCategory(isOpen ? '' : cat.key)}>
                      <span className={`studio-category-icon nf ${cat.icon}`} />
                      <span className="studio-category-label">{cat.label}</span>
                      <span className={`studio-category-chevron nf nf-fa-chevron_down ${isOpen ? '' : 'studio-category-chevron--closed'}`} />
                    </button>
                    <div className={`studio-category-items ${isOpen ? 'studio-category-items--open' : ''}`}>
                      {catApps.map(app => (
                        <button
                          key={app.key}
                          className={`studio-sidebar-item ${activeAppKey === app.key ? 'studio-sidebar-item--active' : ''}`}
                          onClick={() => { handleNav(app.key); setSidebarOpen(false); }}
                        >
                          <span className={`nf ${app.icon}`} style={{ color: app.color }} />
                          <span>{app.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <button
                className={`studio-sidebar-item ${currentRoute.route === 'teamSettings' ? 'studio-sidebar-item--active' : ''}`}
                onClick={() => { navigateTo(`/teams/${activeTeam.id}/settings`); setSidebarOpen(false); }}
              >
                <span className="nf nf-fa-gear" style={{ color: '#94a3b8' }} />
                <span>Settings</span>
              </button>
            </div>
          )}
        </aside>

        {/* ─── Main Content ─── */}
        <main className="studio-main">
          {activeAppKey && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px 0' }}>
              <PresenceAvatars teamId={activeTeam?.id} appKey={activeAppKey} />
            </div>
          )}
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* ─── Mobile Bottom Nav ─── */}
      {activeTeam && (
        <nav className="studio-bottom-nav glass">
          <button className="studio-bottom-nav-team" onClick={handleBackToTeams} title="Teams">
            <span className={`nf ${activeTeam.icon || 'nf-fa-cubes'}`} style={{ color: activeTeam.color }} />
          </button>
          {APP_ITEMS.slice(0, 5).map((app) => (
            <button
              key={app.key}
              className={`studio-bottom-nav-item ${activeAppKey === app.key ? 'studio-bottom-nav-item--active' : ''}`}
              onClick={() => handleNav(app.key)}
            >
              <span className={`nf ${app.icon}`} style={{ color: app.color }} />
            </button>
          ))}
          <button
            className="studio-bottom-nav-more"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            <span className="nf nf-fa-ellipsis" />
          </button>
          {mobileNavOpen && (
            <>
              <div className="studio-backdrop" onClick={() => setMobileNavOpen(false)} />
              <div className="studio-bottom-nav-menu">
                {APP_ITEMS.slice(5).map((app) => (
                  <button
                    key={app.key}
                    className="studio-bottom-nav-item"
                    onClick={() => handleNav(app.key)}
                  >
                    <span className={`nf ${app.icon}`} style={{ color: app.color }} />
                    <span>{app.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </nav>
      )}
      <div id="toast-root" />
    </div>
    </ToastProvider>
  );
}
