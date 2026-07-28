import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import Home from './pages/Home.jsx'
import MyReports from './pages/MyReports.jsx'
import AdminReports from './pages/AdminReports.jsx'
import SiteMap from '@kumocoders/ui/SiteMap.jsx'

function getRouteInfo() {
  const path = window.location.pathname
  if (path === '/reports/my') return { route: 'my' }
  if (path === '/reports/admin') return { route: 'admin' }
  if (path.startsWith('/reports')) return { route: 'home' }
  return { route: 'home' }
}

export function navigateTo(path) {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new Event('popstate'))
}

function Router() {
  const { user, loading } = useAuth()
  const [routeInfo, setRouteInfo] = useState(getRouteInfo)

  useEffect(() => {
    function handlePop() {
      setRouteInfo(getRouteInfo())
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  if (loading) {
    return (
      <div className="reports-loading">
        <div className="reports-loading-spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  const { route } = routeInfo

  switch (route) {
    case 'home':
      return <Home />
    case 'my':
      return <MyReports />
    case 'admin':
      return <AdminReports />
    default:
      return <Home />
  }
}

function Navbar({ theme, toggleTheme }) {
  const { user, logout, login } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [routeInfo, setRouteInfo] = useState(getRouteInfo)

  useEffect(() => {
    function handlePop() { setRouteInfo(getRouteInfo()) }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  const { route } = routeInfo

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setLoggingIn(true)
    try {
      await login(loginEmail, loginPassword)
      setLoginEmail('')
      setLoginPassword('')
    } catch (err) {
      setLoginError(err.message)
    } finally {
      setLoggingIn(false)
    }
  }

  return (
    <nav className="reports-navbar">
      <div className="reports-navbar-inner">
        <button className="reports-navbar-brand" onClick={() => navigateTo('/reports')}>
          <span className="nf nf-fa-bug" /> Reports
        </button>
        <div className="reports-navbar-links">
          <button
            className={`reports-nav-link ${route === 'home' ? 'reports-nav-link--active' : ''}`}
            onClick={() => navigateTo('/reports')}
          >
            <span className="nf nf-fa-pen_to_square" /> Submit
          </button>
          <button
            className={`reports-nav-link ${route === 'my' ? 'reports-nav-link--active' : ''}`}
            onClick={() => navigateTo('/reports/my')}
          >
            <span className="nf nf-fa-list" /> My Reports
          </button>
          {user?.role === 'admin' && (
            <button
              className={`reports-nav-link ${route === 'admin' ? 'reports-nav-link--active' : ''}`}
              onClick={() => navigateTo('/reports/admin')}
            >
              <span className="nf nf-fa-shield" /> Admin
            </button>
          )}
        </div>
        <div className="reports-navbar-right">
          <button className="reports-navbar-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <span className="nf nf-md-white_balance_sunny" />
            ) : (
              <span className="nf nf-md-moon_waning_crescent" />
            )}
          </button>
          <SiteMap isAdmin={user?.role === 'admin'} />
          {user ? (
            <div style={{ position: 'relative' }}>
              <button className="reports-user-btn" onClick={() => setShowDropdown(!showDropdown)}>
                <span className="nf nf-fa-user_circle" />
                <span>{user.display_name || user.username}</span>
              </button>
              {showDropdown && (
                <>
                  <div className="reports-dropdown-backdrop" onClick={() => setShowDropdown(false)} />
                  <div className="reports-dropdown">
                    <div className="reports-dropdown-user-info">
                      <strong>{user.display_name || user.username}</strong>
                      <span className="reports-text-muted">{user.email}</span>
                      {user.role === 'admin' && <span className="reports-badge reports-badge--admin">Admin</span>}
                    </div>
                    <hr className="reports-dropdown-divider" />
                    <button
                      className="reports-dropdown-item"
                      onClick={() => { setShowDropdown(false); logout() }}
                    >
                      <span className="nf nf-fa-sign_out" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <button className="reports-btn reports-btn--primary" onClick={() => setShowDropdown(!showDropdown)}>
                Sign In
              </button>
              {showDropdown && (
                <>
                  <div className="reports-dropdown-backdrop" onClick={() => setShowDropdown(false)} />
                  <div className="reports-dropdown reports-dropdown--wide" style={{ right: 0, left: 'auto' }}>
                    <form onSubmit={handleLogin} className="reports-login-form">
                      <h3>Sign In</h3>
                      {loginError && <div className="reports-error">{loginError}</div>}
                      <input
                        type="email"
                        placeholder="Email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="reports-input"
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="reports-input"
                      />
                      <button type="submit" className="reports-btn reports-btn--primary" disabled={loggingIn}>
                        {loggingIn ? 'Signing in...' : 'Sign In'}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('kumocoders-theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kumocoders-theme', theme);
    const favicon = document.getElementById('favicon');
    if (favicon) favicon.href = `/favicon-${theme}.svg`;
  }, [theme]);

  function toggleTheme() {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }

  return (
    <AuthProvider>
      <div className="reports-body">
        <div className="navbar-blur-backdrop" aria-hidden="true" />
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <main className="reports-main">
          <Router />
        </main>
      </div>
    </AuthProvider>
  )
}
