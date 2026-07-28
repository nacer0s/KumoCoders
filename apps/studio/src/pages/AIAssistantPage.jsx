import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const SUGGESTIONS = [
  "What's on my tasks?",
  'Summarize recent activity',
  'Help me plan this week',
];

export default function AIAssistantPage({ teamId }) {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(e) {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`/api/studio/teams/${teamId}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: input.trim(), context: { teamId, userId: user?.id } }),
      });
      if (!res.ok) throw new Error('AI request failed');
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || data.message || JSON.stringify(data), timestamp: new Date().toISOString() },
      ]);
    } catch (err) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  }

  function handleSuggestion(s) {
    setInput(s);
    setTimeout(() => handleSend(), 0);
  }

  return (
    <div className="studio-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-robot" /> AI Assistant</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && !loading && (
          <div className="studio-empty" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="nf nf-fa-robot" style={{ fontSize: 48, opacity: 0.3 }} />
            <h3>Ask me anything</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className="studio-btn glass" onClick={() => handleSuggestion(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '75%',
              padding: '12px 16px',
              borderRadius: 16,
              background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-glass-bg)',
              border: msg.role === 'assistant' ? 'var(--glass-border)' : undefined,
              color: msg.role === 'user' ? '#fff' : 'var(--color-text)',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}

        {loading && (
          <div
            className="glass"
            style={{
              alignSelf: 'flex-start',
              padding: '12px 20px',
              borderRadius: 16,
              display: 'flex',
              gap: 4,
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            <span style={{ animation: 'bounce 1s infinite 0s' }}>.</span>
            <span style={{ animation: 'bounce 1s infinite 0.2s' }}>.</span>
            <span style={{ animation: 'bounce 1s infinite 0.4s' }}>.</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
        <textarea
          className="studio-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type your message..."
          rows={1}
          style={{ flex: 1, resize: 'none', minHeight: 44, maxHeight: 120 }}
        />
        <button type="submit" className="studio-btn studio-btn--primary" disabled={!input.trim() || loading} style={{ alignSelf: 'flex-end' }}>
          <span className="nf nf-fa-paper_plane" />
        </button>
      </form>
    </div>
  );
}
