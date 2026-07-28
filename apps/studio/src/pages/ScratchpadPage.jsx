import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ScratchpadPage({ teamId }) {
  const { token, user } = useAuth();
  const [note, setNote] = useState(null);
  const [content, setContent] = useState('');
  const timerRef = useRef(null);

  function fetchNote() {
    if (!token || !user) return;
    fetch(`/api/studio/teams/${teamId}/apps/scratchpad/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => {
        if (!Array.isArray(d)) return;
        const mine = d.find(item => item.created_by === user.id);
        if (mine) { setNote(mine); const data = typeof mine.data === 'string' ? JSON.parse(mine.data) : (mine.data || {}); setContent(data.content || ''); }
        else { setNote(null); setContent(''); }
      }).catch(() => {});
  }

  useEffect(() => { fetchNote(); }, [teamId, token, user?.id]);

  function save(content) {
    if (!token) return;
    const body = { appData: { content } };
    if (note) {
      fetch(`/api/studio/apps/data/${note.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) }).then(r => { if (!r.ok) fetchNote(); }).catch(() => {});
    } else {
      fetch(`/api/studio/teams/${teamId}/apps/scratchpad/data`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itemKey: user?.id || 'scratchpad', data: { content } }) }).then(r => { if (r.ok) fetchNote(); }).catch(() => {});
    }
  }

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(content), 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [content]);

  function renderMarkdown(text) {
    if (!text) return '<p><em>Start typing...</em></p>';
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/### (.+)/g, '<h3>$1</h3>');
    html = html.replace(/## (.+)/g, '<h2>$1</h2>');
    html = html.replace(/# (.+)/g, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/^- (.+)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/\n/g, '<br />');
    return html;
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-note_sticky" /> Scratchpad</h1>
        <span className="studio-text-muted" style={{ fontSize: 13 }}>Auto-saves as you type</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, height: 'calc(100vh - 200px)', minHeight: 400 }}>
        <textarea className="studio-input" value={content} onChange={e => setContent(e.target.value)} placeholder="Write markdown here..." style={{ resize: 'none', fontFamily: 'monospace', fontSize: 14, lineHeight: 1.6, padding: 16 }} />
        <div className="glass" style={{ padding: 16, borderRadius: 12, overflow: 'auto' }}>
          <div className="s-wiki-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        </div>
      </div>
    </div>
  );
}
