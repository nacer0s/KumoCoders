import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigateTo('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="community-auth-page">
      <div className="community-auth-card">
        <div className="community-auth-header">
          <span className="nf nf-fa-users community-auth-icon" />
          <h1>Sign In</h1>
          <p>Welcome back to KumoCoders Community</p>
        </div>

        <form onSubmit={handleSubmit} className="community-auth-form">
          {error && <div className="community-error">{error}</div>}

          <div className="community-form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="community-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="community-form-group">
            <label htmlFor="login-password">Password</label>
            <div className="community-password-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="community-input community-input--password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="community-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className={`nf ${showPassword ? 'nf-fa-eye_slash' : 'nf-fa-eye'}`} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="community-btn community-btn--primary community-btn--full"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="community-auth-footer">
          <span>Don't have an account?</span>
          <button className="community-link-btn" onClick={() => navigateTo('/register')}>
            Create one
          </button>
        </div>
      </div>
    </div>
  );
}
