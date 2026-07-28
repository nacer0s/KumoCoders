import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';

export default function Register() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    try {
      await register(username, email, password);
      localStorage.setItem('kc_show_onboarding', '1');
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
          <span className="nf nf-fa-user_plus community-auth-icon" />
          <h1>Create Account</h1>
          <p>Join the KumoCoders Community</p>
        </div>

        <form onSubmit={handleSubmit} className="community-auth-form">
          {error && <div className="community-error">{error}</div>}

          <div className="community-form-group">
            <label htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              type="text"
              className="community-input"
              placeholder="yourusername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
              minLength={3}
            />
          </div>

          <div className="community-form-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className="community-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="community-form-group">
            <label htmlFor="reg-password">Password</label>
            <div className="community-password-wrapper">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="community-input community-input--password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
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

          <div className="community-form-group">
            <label htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              type={showPassword ? 'text' : 'password'}
              className="community-input"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="community-btn community-btn--primary community-btn--full"
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="community-auth-footer">
          <span>Already have an account?</span>
          <button className="community-link-btn" onClick={() => navigateTo('/login')}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
