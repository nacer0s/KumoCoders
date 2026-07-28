import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'kc_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('kc_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${stored}` },
        });
        if (res.ok) {
          const data = await res.json();
          const u = data.user ?? data;
          setUser(u);
          setToken(stored);
          sessionStorage.setItem('kc_user', JSON.stringify(u));
          setLoading(false);
          return;
        }
      } catch {}
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem('kc_user');
    }

    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
          setUser(data.user);
          setToken(data.token);
          sessionStorage.setItem('kc_user', JSON.stringify(data.user));
          setLoading(false);
          return;
        }
      }
    } catch {}

    setUser(null);
    setToken(null);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  function setAuth(newToken, newUser) {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      sessionStorage.setItem('kc_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem('kc_user');
    }
    setToken(newToken);
    setUser(newUser);
  }

  async function login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      let msg = 'Login failed';
      try { const err = await res.json(); msg = err.error || msg; } catch {}
      throw new Error(msg);
    }
    const data = await res.json();
    setAuth(data.token, data.user);
    return data;
  }

  async function logout() {
    setAuth(null, null);
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
