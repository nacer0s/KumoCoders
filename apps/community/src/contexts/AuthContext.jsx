import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'kc_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (stored) {
        let shouldClear = false;
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${stored}` },
          });
          if (res.ok) {
            const data = await res.json();
            const u = data.user ?? data;
            setToken(stored);
            setUser(u);
            sessionStorage.setItem('kc_user', JSON.stringify(u));
            setLoading(false);
            return;
          }
          shouldClear = res.status === 401;
        } catch {}
        if (shouldClear) localStorage.removeItem(TOKEN_KEY);
      }

      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.token) {
            localStorage.setItem(TOKEN_KEY, data.token);
            setToken(data.token);
            setUser(data.user);
            sessionStorage.setItem('kc_user', JSON.stringify(data.user));
            setLoading(false);
            return;
          }
        }
      } catch {}

      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || 'Login failed');
    }

    const data = await res.json();
    const authToken = data.token;
    const userData = data.user ?? data;

    localStorage.setItem(TOKEN_KEY, authToken);
    sessionStorage.setItem('kc_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  }, []);

  const register = useCallback(async (username, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || 'Registration failed');
    }

    const data = await res.json();
    const authToken = data.token;
    const userData = data.user ?? data;

    localStorage.setItem(TOKEN_KEY, authToken);
    sessionStorage.setItem('kc_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem('kc_user');
    setToken(null);
    setUser(null);
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
