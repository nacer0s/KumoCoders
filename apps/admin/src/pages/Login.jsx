import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { navigateTo } from '../App.jsx'

const REMEMBER_EMAIL_KEY = 'kumocoders-admin-email'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_EMAIL_KEY) || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(REMEMBER_EMAIL_KEY))
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email)
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY)
      }
      await login(email, password)
      navigateTo('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-body admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-card glass">
          <div className="admin-login-header">
            <span className="nf nf-fa-shield admin-login-icon" />
            <h1>KumoCoders Admin</h1>
            <p>Sign in to manage your content</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            {error && <div className="admin-error">{error}</div>}

            <div className="admin-input-group">
              <label htmlFor="login-email" className="admin-label">Email</label>
              <input
                id="login-email"
                type="email"
                className="admin-input"
                placeholder="admin@kumocoders.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            <div className="admin-input-group">
              <label htmlFor="login-password" className="admin-label">Password</label>
              <div className="admin-password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="admin-input admin-input--password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className={`nf ${showPassword ? 'nf-fa-eye_slash' : 'nf-fa-eye'}`} />
                </button>
              </div>
            </div>

            <div className="admin-login-options">
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="admin-checkbox-label">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              className="admin-btn admin-btn--primary admin-btn--full"
              disabled={submitting}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
