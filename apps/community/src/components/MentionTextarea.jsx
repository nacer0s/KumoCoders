import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

function findMention(text, cursorPos) {
  const before = text.slice(0, cursorPos);
  const match = before.match(/@([a-zA-Z0-9_-]*)$/);
  if (!match) return null;
  const start = before.lastIndexOf('@');
  if (start > 0 && /[a-zA-Z0-9_]/.test(text[start - 1])) return null;
  return { start, query: match[1] };
}

function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

export default function MentionTextarea({ value, onChange, placeholder, rows, required, className }) {
  const { token } = useAuth();
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const [mention, setMention] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [theme, setTheme] = useState(getTheme);
  const [brokenImgs, setBrokenImgs] = useState(() => new Set());
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const close = useCallback(() => {
    setMention(null);
    setUsers([]);
    setSelectedIdx(0);
  }, []);

  useEffect(() => {
    if (!mention || !token) return;
    const id = ++fetchIdRef.current;
    setLoading(true);
    const url = mention.query
      ? `/api/community/users/search?q=${encodeURIComponent(mention.query)}`
      : '/api/community/users/followed';
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { users: [] })
      .then(d => {
        if (fetchIdRef.current !== id) return;
        setUsers((d.users || d.followed_users || []).slice(0, 8));
        setSelectedIdx(0);
        setLoading(false);
      })
      .catch(() => { if (fetchIdRef.current === id) setLoading(false); });
  }, [mention, token]);

  useEffect(() => {
    if (!mention || !textareaRef.current) return;
    const ta = textareaRef.current;
    const rect = ta.getBoundingClientRect();
    const style = getComputedStyle(ta);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const padLeft = parseFloat(style.paddingLeft) || 12;
    const textBefore = value.slice(0, mention.start);
    const lines = textBefore.split('\n');
    const lineNum = lines.length - 1;
    setCoords({
      top: rect.top + (lineNum + 1) * lineHeight + 4,
      left: rect.left + padLeft,
    });
  }, [mention, value]);

  useEffect(() => {
    if (!mention) return;
    function handleKey(e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, users.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter' || e.key === 'Tab') {
        if (users[selectedIdx]) { e.preventDefault(); insert(users[selectedIdx]); }
      }
      else if (e.key === 'Escape') { close(); }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mention, users, selectedIdx]);

  useEffect(() => {
    if (!mention) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && e.target !== textareaRef.current) close();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mention, close]);

  function insert(user) {
    const ta = textareaRef.current;
    if (!ta) return;
    const before = value.slice(0, mention.start);
    const after = value.slice(ta.selectionStart);
    const newVal = before + `@${user.username} ` + after;
    onChange(newVal);
    close();
    requestAnimationFrame(() => {
      ta.focus();
      const pos = before.length + user.username.length + 2;
      ta.setSelectionRange(pos, pos);
    });
  }

  function handleChange(e) {
    const val = e.target.value;
    onChange(val);
    const ta = e.target;
    const info = findMention(val, ta.selectionStart);
    if (info && info.query.length <= 30) setMention(info);
    else close();
  }

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={textareaRef}
        className={className}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
      />
      {mention && users.length > 0 && (
        <>
          <div className="mention-backdrop" onClick={close} />
          <div
            ref={dropdownRef}
            className="mention-dropdown"
            style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 100 }}
          >
            {users.map((u, i) => (
              <div
                key={u.id}
                className={`mention-option ${i === selectedIdx ? 'mention-option--active' : ''}`}
                onClick={() => insert(u)}
                onMouseEnter={() => setSelectedIdx(i)}
              >
                {u.username?.toLowerCase() === 'kumocoders' ? (
                  <img className="mention-avatar" src={theme === 'dark' ? '/favicon-light.svg' : '/favicon-dark.svg'} alt="" />
                ) : u.avatar_url && !brokenImgs.has(u.id) ? (
                  <img className="mention-avatar" src={u.avatar_url} alt="" onError={() => setBrokenImgs(prev => new Set(prev).add(u.id))} />
                ) : (
                  <span className="mention-avatar mention-avatar--placeholder">
                    {(u.display_name || u.username || '?').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="mention-name">{u.display_name || u.username}</span>
                <span className="mention-username">@{u.username}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
