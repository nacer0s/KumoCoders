import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/reports.css'

(function () {
  const saved = localStorage.getItem('kumocoders-theme');
  const theme = saved === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  const favicon = document.getElementById('favicon');
  if (favicon) favicon.href = `/favicon-${theme}.svg`;
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
