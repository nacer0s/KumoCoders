import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { navigateTo } from '../App.jsx'
import SiteMap from '@kumocoders/ui/SiteMap.jsx'

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: 'nf-fa-gauge_high' },
  { path: '/admin/projects', label: 'Projects', icon: 'nf-fa-layer_group' },
  { path: '/admin/gallery', label: 'Gallery', icon: 'nf-fa-image' },
  { path: '/admin/blog', label: 'Blog', icon: 'nf-fa-pen_to_square' },
  { path: '/admin/wiki', label: 'Wiki', icon: 'nf-fa-book' },
  { path: '/admin/community', label: 'Community', icon: 'nf-fa-comments' },
  { path: '/admin/reports', label: 'Reports', icon: 'nf-fa-flag' },
  { path: '/admin/send-notification', label: 'Notify', icon: 'nf-fa-bell' },
  { path: '/admin/filters', label: 'Word Filters', icon: 'nf-fa-filter' },
  { path: '/admin/join', label: 'Join', icon: 'nf-fa-user_plus' },
  { path: '/admin/content', label: 'Content', icon: 'nf-fa-file_lines' },
  { path: '/admin/users', label: 'Users', icon: 'nf-fa-users' },
  { path: '/admin/settings', label: 'Settings', icon: 'nf-fa-gear' },
]

function getActivePath() {
  const path = window.location.pathname
  if (path === '/admin' || path === '/admin/') return '/admin'
  if (path.startsWith('/admin/projects')) return '/admin/projects'
  if (path.startsWith('/admin/gallery')) return '/admin/gallery'
  if (path.startsWith('/admin/blog')) return '/admin/blog'
  if (path.startsWith('/admin/wiki')) return '/admin/wiki'
  if (path.startsWith('/admin/community')) return '/admin/community'
  if (path.startsWith('/admin/reports')) return '/admin/reports'
  if (path.startsWith('/admin/send-notification')) return '/admin/send-notification'
  if (path.startsWith('/admin/filters')) return '/admin/filters'
  if (path.startsWith('/admin/join')) return '/admin/join'
  if (path.startsWith('/admin/content')) return '/admin/content'
  if (path.startsWith('/admin/users')) return '/admin/users'
  if (path.startsWith('/admin/settings')) return '/admin/settings'
  return '/admin'
}

export default function AdminLayout({ children, title }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [theme, setTheme] = useState(() =>
    document.documentElement.getAttribute('data-theme') || 'dark'
  )
  const activePath = getActivePath()

  const filteredNav = searchQuery.trim()
    ? NAV_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : NAV_ITEMS

  // Watch for theme changes (from Settings page)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark'
      setTheme(current)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const logoSrc = theme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'

  useEffect(() => {
    const favicon = document.getElementById('favicon');
    if (favicon) favicon.href = `/favicon-${theme}.svg`;
  }, [theme]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('kumocoders-theme', next);
    setTheme(next);
  }

  function handleLogout() {
    logout()
    navigateTo('/admin/login')
  }

  function handleNavigate(path) {
    navigateTo(path)
    setSidebarOpen(false)
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="admin-body">
      {/* ─── Navbar blur backdrop (fixed, Chrome-safe) ─── */}
      <div className="navbar-blur-backdrop" aria-hidden="true" />
      {/* ─── Top Navbar ─── */}
      <nav className="admin-navbar">
        <div className="admin-navbar-inner">
          <button
            className="admin-hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <span className="nf nf-fa-bars" />
          </button>

          <a
            href="/admin"
            className="admin-navbar-brand"
            onClick={(e) => { e.preventDefault(); handleNavigate('/admin') }}
          >
            <img src={logoSrc} alt="KumoCoders" className="admin-navbar-logo" />
            <span>Admin</span>
          </a>

          <div className="admin-navbar-right">
            <SiteMap />
            <button className="admin-btn-icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? (
                <span className="nf nf-md-white_balance_sunny" />
              ) : (
                <span className="nf nf-md-moon_waning_crescent" />
              )}
            </button>
            {user && (
              <span className="admin-navbar-user">
                <span className="nf nf-fa-user-circle" />{' '}
                <span className="admin-navbar-user-name">{user.display_name || user.email}</span>
              </span>
            )}
            <button className="admin-btn admin-btn--ghost" onClick={handleLogout}>
              <span className="nf nf-fa-sign_out" /> <span className="admin-logout-text">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="admin-layout">
        {/* ─── Sidebar Overlay (mobile) ─── */}
        {sidebarOpen && (
          <div className="admin-sidebar-overlay" onClick={handleOverlayClick} />
        )}

        {/* ─── Sidebar ─── */}
        <aside className={`admin-sidebar glass ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
          <div className="admin-sidebar-header">
            <button
              className="admin-sidebar-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
            >
              <span className="nf nf-fa-xmark" />
            </button>
          </div>

          <nav className="admin-sidebar-nav">
            <div className="admin-sidebar-search">
              <span className="nf nf-fa-magnifying_glass" />
              <input
                type="text"
                className="admin-sidebar-search-input"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="admin-sidebar-search-clear" onClick={() => setSearchQuery('')}>
                  <span className="nf nf-fa-xmark" />
                </button>
              )}
            </div>

            {filteredNav.length === 0 ? (
              <p className="admin-sidebar-no-results">No pages found</p>
            ) : (
              filteredNav.map((item) => (
                <button
                  key={item.path}
                  className={`admin-sidebar-item ${activePath === item.path ? 'admin-sidebar-item--active' : ''}`}
                  onClick={() => handleNavigate(item.path)}
                >
                  <span className={`nf ${item.icon}`} />
                  <span>{item.label}</span>
                </button>
              ))
            )}
          </nav>

          <div className="admin-sidebar-footer">
            <div className="admin-sidebar-user cursor-pointer" onClick={() => { handleNavigate('/admin/profile'); }}>
              <span className="nf nf-fa-user-circle" />
              <div>
                <p className="admin-sidebar-user-name">{user?.display_name || 'Admin'}</p>
                <p className="admin-sidebar-user-role">
                  {user?.role_id === 1 ? 'Administrator' : 'User'} — click for profile
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="admin-main">
          {title && (
            <div className="admin-header">
              <h1>{title}</h1>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
