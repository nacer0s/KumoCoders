import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';
import NotificationBell from './NotificationBell.jsx';
import SiteMap from '@kumocoders/ui/SiteMap.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';
import OnboardingWizard from './OnboardingWizard.jsx';

const MAIN_NAV = [
  { path: '/new', label: 'New Post', icon: 'nf-fa-pencil' },
  { path: '/drafts', label: 'Drafts', icon: 'nf-fa-pencil_square', auth: true },
];

const MORE_ITEMS = [
  { path: '/leaderboard', label: 'Leaderboard', icon: 'nf-fa-trophy' },
  { path: '/feedback', label: 'Feedback', icon: 'nf-fa-lightbulb' },
  { path: '/guidelines', label: 'Guidelines', icon: 'nf-fa-scale_balanced' },
  { path: '/collections', label: 'Collections', icon: 'nf-fa-folder', auth: true },
  { path: '/muted', label: 'Muted', icon: 'nf-fa-ban', auth: true },
  { path: '/webhooks', label: 'Webhooks', icon: 'nf-fa-plug', auth: true },
  { path: '/reports', label: 'Reports', icon: 'nf-fa-flag', external: true },
];

export default function CommunityLayout({ children }) {
  const { user, token, logout } = useAuth();
  const [theme, setTheme] = useState(() =>
    document.documentElement.getAttribute('data-theme') || 'dark'
  );
  const [themeMode, setThemeMode] = useState(() =>
    localStorage.getItem('kumocoders-theme') || 'system'
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [xpData, setXpData] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const navbarRef = useRef(null);
  const moreRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(current);
      setThemeMode(localStorage.getItem('kumocoders-theme') || 'system');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Fetch draft count + show onboarding once after registration
  useEffect(() => {
    if (!user?.id || !token) return;
    fetch('/api/community/posts/drafts/count', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setDraftCount(d.count); })
      .catch(() => {});

    const shouldShow = localStorage.getItem('kc_show_onboarding');
    if (shouldShow === '1') setShowOnboarding(true);
  }, [user?.id, token]);

  function dismissOnboarding() {
    localStorage.removeItem('kc_show_onboarding');
    setShowOnboarding(false);
  }

  function completeOnboarding() {
    localStorage.removeItem('kc_show_onboarding');
    setShowOnboarding(false);
  }

  // Fetch XP/level/streak
  useEffect(() => {
    if (!token) return;
    fetch('/api/community/xp/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setXpData(d))
      .catch(() => {});
  }, [token]);

  // Close mobile menu / more dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (mobileOpen) {
        const isInsideNavbar = navbarRef.current && navbarRef.current.contains(e.target);
        const isInsideMenu = mobileMenuRef.current && mobileMenuRef.current.contains(e.target);
        if (!isInsideNavbar && !isInsideMenu) setMobileOpen(false);
      }
      if (moreOpen && moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [mobileOpen, moreOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        if (showOnboarding) dismissOnboarding();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.target.closest('input,textarea,select')) {
        e.preventDefault();
        // Toggle shortcuts help — could show a modal here
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const logoSrc = theme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg';

  function applyThemePreference(mode) {
    let resolved;
    if (mode === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = mode;
    }
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('kumocoders-theme', mode);
    setTheme(resolved);
    setThemeMode(mode);
    const favicon = document.getElementById('favicon');
    if (favicon) favicon.href = `/community/favicon-${resolved}.svg`;
  }

  function toggleTheme() {
    const mode = localStorage.getItem('kumocoders-theme') || 'system';
    const next = mode === 'system' ? 'dark' : mode === 'dark' ? 'light' : 'system';
    applyThemePreference(next);
  }

  // Re-evaluate system theme when OS preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const mode = localStorage.getItem('kumocoders-theme') || 'system';
      if (mode === 'system') applyThemePreference('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  function handleLogout() {
    logout();
    setMobileOpen(false);
    navigateTo('/login');
  }

  function handleNavigate(path) {
    setMobileOpen(false);
    navigateTo(path);
  }

  return (
    <div className="community-body">
      {showOnboarding && (
        <OnboardingWizard onComplete={completeOnboarding} onDismiss={dismissOnboarding} />
      )}

      {/* ─── Navbar blur backdrop (fixed, Chrome-safe) ─── */}
      <div className="navbar-blur-backdrop" aria-hidden="true" />
      {/* ─── Top Navbar ─── */}
      <nav className="community-navbar" ref={navbarRef}>
        <div className="community-navbar-inner">
          <a
            href="/community"
            className="community-navbar-brand"
            onClick={(e) => { e.preventDefault(); navigateTo('/'); }}
          >
            <img src={logoSrc} alt="KumoCoders" className="community-navbar-logo" />
            <span>Community</span>
          </a>

          <div className="community-navbar-links">
            {MAIN_NAV.map((item) => (
              <button
                key={item.path}
                className="community-nav-link"
                onClick={() => item.external ? window.location.href = item.path : navigateTo(item.path)}
              >
                <span className={`nf ${item.icon}`} />
                <span>{item.label}</span>
                {item.path === '/drafts' && draftCount > 0 && (
                  <span className="community-draft-count">{draftCount}</span>
                )}
              </button>
            ))}
            <div className="community-more-dropdown" ref={moreRef}>
              <button className="community-nav-link" onClick={() => setMoreOpen(!moreOpen)}>
                <span className="nf nf-fa-ellipsis" />
                <span>More</span>
              </button>
              {moreOpen && (
                <div className="community-more-menu">
                  {MORE_ITEMS.map((item) => (
                    <button
                      key={item.path}
                      className="community-more-item"
                      onClick={() => { setMoreOpen(false); item.external ? window.location.href = item.path : navigateTo(item.path); }}
                    >
                      <span className={`nf ${item.icon}`} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="community-navbar-search">
            <span className="nf nf-fa-magnifying_glass" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search posts... (Ctrl+K)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  navigateTo(`/search?q=${encodeURIComponent(e.target.value.trim())}`);
                  e.target.value = '';
                  e.target.blur();
                }
              }}
            />
          </div>

          <div className="community-navbar-right">
            <NotificationBell />

            <SiteMap />

              <button
                className="community-btn community-btn--icon"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title={themeMode === 'system' ? 'System theme' : theme === 'dark' ? 'Dark theme' : 'Light theme'}
              >
                {themeMode === 'system' ? (
                  <span className="nf nf-md-theme_light_dark" />
                ) : theme === 'dark' ? (
                  <span className="nf nf-md-white_balance_sunny" />
                ) : (
                  <span className="nf nf-md-moon_waning_crescent" />
                )}
              </button>

            {user ? (
              <div className="community-user-menu">
                <button
                  className="community-btn community-btn--avatar"
                  onClick={() => navigateTo(`/profile/${user.username}`)}
                  title={user.display_name || user.username || user.email}
                >
                  <div className="community-navbar-avatar">
                    <UserAvatar user={user} />
                  </div>
                  {xpData && (
                    <div className="community-navbar-xp">
                      <span className="nf nf-fa-trophy" style={{ fontSize: '0.75em', color: '#FFD700' }} />
                      <span style={{ fontSize: '0.75em', fontWeight: 600 }}>Lv.{xpData.level}</span>
                      {xpData.streak?.current_streak > 0 && (
                        <span style={{ fontSize: '0.75em', color: 'var(--color-text-muted)' }}>🔥{xpData.streak.current_streak}</span>
                      )}
                    </div>
                  )}
                </button>
                <button className="community-btn community-btn--ghost community-desktop-only" onClick={() => navigateTo('/settings')}>
                  <span className="nf nf-fa-gear" />
                </button>
                <button className="community-btn community-btn--ghost community-desktop-only" onClick={handleLogout}>
                  <span className="nf nf-fa-sign_out" />
                </button>
              </div>
            ) : (
              <div className="community-user-menu community-desktop-only">
                <button className="community-btn community-btn--ghost" onClick={() => navigateTo('/login')}>
                  <span className="nf nf-fa-sign_in" />
                  <span>Sign In</span>
                </button>
                <button className="community-btn community-btn--primary" onClick={() => navigateTo('/register')}>
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className={`community-mobile-toggle ${mobileOpen ? 'open' : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu + backdrop wrapper */}
      {mobileOpen && <div className="community-mobile-backdrop" onClick={() => setMobileOpen(false)} />}
      <div
        className={`community-mobile-menu glass ${mobileOpen ? 'open' : ''}`}
        ref={mobileMenuRef}
      >
        {/* Nav items */}
        <div className="community-mobile-menu-label">Navigation</div>
        {[...MAIN_NAV, ...MORE_ITEMS].map((item) => (
          <button
            key={item.path}
            className="community-mobile-menu-item"
            onClick={() => { setMobileOpen(false); item.external ? window.location.href = item.path : navigateTo(item.path); }}
          >
            <span className={`nf ${item.icon}`} />
            <span>{item.label}</span>
            {item.path === '/drafts' && draftCount > 0 && (
              <span className="community-draft-count">{draftCount}</span>
            )}
          </button>
        ))}

        <div className="community-mobile-menu-divider" />

        {/* User section */}
        <div className="community-mobile-menu-label">
          {user ? (user.display_name || user.username || 'Account') : 'Account'}
        </div>

        {user ? (
          <>
            <button
              className="community-mobile-menu-item"
              onClick={() => handleNavigate(`/profile/${user.username}`)}
            >
              <div className="community-mobile-menu-avatar">
                <UserAvatar user={user} />
              </div>
              <span>Profile</span>
            </button>
            <button
              className="community-mobile-menu-item"
              onClick={() => handleNavigate('/notifications')}
            >
              <span className="nf nf-fa-bell" />
              <span>Notifications</span>
            </button>
            <button
              className="community-mobile-menu-item"
              onClick={() => handleNavigate('/settings')}
            >
              <span className="nf nf-fa-gear" />
              <span>Settings</span>
            </button>
            <button
              className="community-mobile-menu-item"
              onClick={handleLogout}
            >
              <span className="nf nf-fa-sign_out" />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <button
              className="community-mobile-menu-item"
              onClick={() => handleNavigate('/login')}
            >
              <span className="nf nf-fa-sign_in" />
              <span>Sign In</span>
            </button>
            <button
              className="community-mobile-menu-item"
              onClick={() => handleNavigate('/register')}
            >
              <span className="nf nf-fa-user_plus" />
              <span>Sign Up</span>
            </button>
          </>
        )}
      </div>

      {/* ─── Main Content ─── */}
      <main className="community-main">
        {children}
      </main>
    </div>
  );
}
