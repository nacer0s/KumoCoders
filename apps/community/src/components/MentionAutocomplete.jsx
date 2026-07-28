import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';

function getCaretPosition(textarea) {
  const pos = textarea.selectionStart;
  const text = textarea.value;
  const before = text.slice(0, pos);
  const atIdx = before.lastIndexOf('@');
  if (atIdx === -1) return null;
  const afterAt = before.slice(atIdx + 1);
  if (/[^a-zA-Z0-9_-]/.test(afterAt)) return null;
  if (atIdx > 0 && /[a-zA-Z0-9_]/.test(text[atIdx - 1])) return null;
  return { start: atIdx, query: afterAt };
}

export default function MentionAutocomplete({ textareaRef, value, onChange }) {
  const { token } = useAuth();
  const [mention, setMention] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const fetchIdRef = useRef(0);

  const close = useCallback(() => {
    setMention(null);
    setUsers([]);
    setSelectedIdx(0);
  }, []);

  useEffect(() => {
    if (!mention) return;
    const id = ++fetchIdRef.current;
    setLoading(true);
    fetch(`/api/community/users/${mention.query ? `search?q=${encodeURIComponent(mention.query)}` : 'followed'}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : { users: [] })
      .then(d => {
        if (fetchIdRef.current !== id) return;
        const list = d.users || d.followed_users || [];
        setUsers(list.slice(0, 8));
        setSelectedIdx(0);
        setLoading(false);
      })
      .catch(() => { if (fetchIdRef.current === id) setLoading(false); });
  }, [mention, token]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || !mention) return;
    const pos = ta.selectionStart;
    ta.focus();
    const rect = ta.getBoundingClientRect();
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 20;
    const textBefore = ta.value.slice(0, pos);
    const lines = textBefore.split('\n');
    const lineNum = lines.length - 1;
    const lastLine = lines[lineNum];
    const charWidth = ta.value.length > 0 ? ta.scrollWidth / ta.value.length : 8;
    setCoords({
      top: rect.top + window.scrollY + (lineNum + 1) * lineHeight + 4,
      left: rect.left + window.scrollX + lastLine.length * Math.min(charWidth, 8),
    });
  }, [mention, users, textareaRef]);

  useEffect(() => {
    if (!mention) return;
    function handleKey(e) {
      if (!dropdownRef.current?.contains(e.target) && e.target !== textareaRef.current) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, users.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter' || e.key === 'Tab') {
        if (users[selectedIdx]) {
          e.preventDefault();
          insertMention(users[selectedIdx]);
        }
      }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mention, users, selectedIdx]);

  function insertMention(user) {
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

  function handleInput(e) {
    const val = e.target.value;
    onChange(val);
    const ta = e.target;
    const info = getCaretPosition(ta);
    if (info && info.query.length <= 30) {
      setMention(info);
    } else {
      close();
    }
  }

  return { handleInput, mention, users, selectedIdx, loading, coords, dropdownRef, insertMention, close };
}
