import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../utils/navigate.js';

export default function LoginPage() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (user) navigateTo('');
  }, [user]);

  if (user) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoggingIn(true);
    try {
      await login(email, password);
      navigateTo('');
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <div className="studio-login-page">
      <div className="studio-login-card glass">
        <div className="studio-login-header">
          <span className="nf nf-fa-cubes studio-login-icon" />
          <h1>Studio</h1>
          <p className="studio-text-muted">Sign in to your workspace</p>
        </div>

        {error && <div className="studio-error">{error}</div>}

        <form onSubmit={handleSubmit} className="studio-form">
          <label className="studio-label">
            Email
            <input
              className="studio-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </label>
          <label className="studio-label">
            Password
            <input
              className="studio-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>
          <button type="submit" className="studio-btn studio-btn--primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loggingIn}>
            {loggingIn ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="studio-login-footer">
          <a href="/community/register" className="studio-login-link">Create an account</a>
          <a href="/" className="studio-login-link">Back to Home</a>
        </div>
      </div>
    </div>
  );
}
