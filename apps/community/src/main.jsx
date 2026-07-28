import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/community.css';

// Theme persistence + PWA manifest swap
(function () {
  function applyTheme(saved) {
    let theme;
    if (saved === 'system' || !saved) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      theme = saved;
    }
    document.documentElement.setAttribute('data-theme', theme);
    const favicon = document.getElementById('favicon');
    if (favicon) favicon.href = `/community/favicon-${theme}.svg`;
    const manifest = document.getElementById('pwa-manifest');
    if (manifest) manifest.href = `/community/manifest-${theme}.json`;
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.content = theme === 'dark' ? '#0D1117' : '#FFFFFF';
  }

  const saved = localStorage.getItem('kumocoders-theme') || 'system';
  applyTheme(saved);

  // Follow system preference changes when mode is 'system'
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    const mode = localStorage.getItem('kumocoders-theme') || 'system';
    if (mode === 'system') applyTheme(mode);
  });

  // Watch for dynamic theme changes
  const observer = new MutationObserver(() => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const f = document.getElementById('favicon');
    if (f) f.href = `/community/favicon-${current}.svg`;
    const m = document.getElementById('pwa-manifest');
    if (m) m.href = `/community/manifest-${current}.json`;
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.content = current === 'dark' ? '#0D1117' : '#FFFFFF';
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/community/sw.js', { scope: '/community/' }).catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);