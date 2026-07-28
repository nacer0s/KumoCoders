import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout.jsx'

export default function Settings() {
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('kumocoders-theme', theme)
    const favicon = document.getElementById('favicon')
    if (favicon) favicon.href = `/favicon-${theme}.svg`
  }, [theme])

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <AdminLayout title="Settings">
      {/* Theme Toggle */}
      <div className="admin-card glass">
        <div className="admin-card-header">
          <h2>Appearance</h2>
        </div>
        <div className="admin-setting-row">
          <div className="admin-setting-info">
            <p className="admin-setting-label">Theme Mode</p>
            <p className="admin-setting-desc">Switch between dark and light mode for the admin panel.</p>
          </div>
          <button className="admin-btn admin-btn--glass" onClick={toggleTheme}>
            <span className={`nf ${theme === 'dark' ? 'nf-fa-sun' : 'nf-fa-moon'}`} />
            {theme === 'dark' ? ' Light Mode' : ' Dark Mode'}
          </button>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="admin-card glass">
        <div className="admin-card-header">
          <h2>Platform Settings</h2>
          <p className="admin-text-muted">Additional settings coming soon.</p>
        </div>
        <div className="admin-coming-soon">
          <div className="admin-coming-soon-item">
            <span className="nf nf-fa-envelope" />
            <div>
              <p className="admin-setting-label">Email Configuration</p>
              <p className="admin-setting-desc">Configure SMTP and notification emails.</p>
            </div>
            <span className="admin-coming-soon-badge">Soon</span>
          </div>
          <div className="admin-coming-soon-item">
            <span className="nf nf-fa-globe" />
            <div>
              <p className="admin-setting-label">SEO & Meta</p>
              <p className="admin-setting-desc">Manage site-wide SEO settings and meta tags.</p>
            </div>
            <span className="admin-coming-soon-badge">Soon</span>
          </div>
          <div className="admin-coming-soon-item">
            <span className="nf nf-fa-shield" />
            <div>
              <p className="admin-setting-label">Security</p>
              <p className="admin-setting-desc">API keys, rate limiting, and access controls.</p>
            </div>
            <span className="admin-coming-soon-badge">Soon</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
