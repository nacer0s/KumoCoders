import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import useSocket from '../hooks/useSocket.js';
import { useToast } from '../contexts/ToastContext.jsx';

export default function PollsPage({ teamId }) {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const socket = useSocket(user);
  const [polls, setPolls] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);
  const [voted, setVoted] = useState({});

  function fetchPolls() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/polls/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setPolls(d); }).catch(() => {});
  }

  useEffect(() => { fetchPolls(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  useEffect(() => {
    if (!socket) return;
    const unsub = socket.on('polls:vote', ({ pollId, options }) => {
      setPolls(prev => prev.map(p => p.id === pollId ? { ...p, data: JSON.stringify({ ...parse(p), options }) } : p));
    });
    return () => unsub();
  }, [socket]);

  async function handleCreate(e) {
    e.preventDefault();
    const filtered = newOptions.filter(o => o.trim());
    if (filtered.length < 2) return;
    const res = await fetch(`/api/studio/teams/${teamId}/apps/polls/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { question: newQuestion, options: filtered.map(o => ({ text: o, votes: 0 })), voters: [] } }),
    });
    if (res.ok) { setShowCreate(false); setNewQuestion(''); setNewOptions(['', '']); fetchPolls(); showToast('Poll created', 'success'); }
  }

  async function handleVote(poll, optionIdx) {
    const d = parse(poll);
    if (d.voters?.includes(user?.id)) return;
    d.options[optionIdx].votes = (d.options[optionIdx].votes || 0) + 1;
    d.voters = [...(d.voters || []), user?.id];
    await fetch(`/api/studio/apps/data/${poll.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    setVoted(prev => ({ ...prev, [poll.id]: true }));
    if (socket?.emit) socket.emit('polls:vote', { pollId: poll.id, options: d.options });
    fetchPolls();
    showToast('Vote recorded', 'success');
  }

  function addOption() { setNewOptions([...newOptions, '']); }

  const totalVotes = (options) => options.reduce((s, o) => s + (o.votes || 0), 0);

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-chart_simple" /> Polls & Votes</h1><button className="studio-btn studio-btn--primary" onClick={() => setShowCreate(true)}><span className="nf nf-fa-plus" /> New Poll</button></div>
      <div className="s-list">
        {polls.map(poll => {
          const d = parse(poll);
          const total = totalVotes(d.options || []);
          const hasVoted = voted[poll.id] || d.voters?.includes(user?.id);
          return (
            <div key={poll.id} className="s-poll-card glass">
              <h3>{d.question}</h3>
              <div className="s-poll-options">
                {(d.options || []).map((opt, i) => {
                  const pct = total > 0 ? Math.round((opt.votes || 0) / total * 100) : 0;
                  return (
                    <button key={i} className="s-poll-option" onClick={() => handleVote(poll, i)} disabled={hasVoted}>
                      <div className="s-poll-bar" style={{ width: `${pct}%` }} />
                      <span className="s-poll-label">{opt.text}</span>
                      <span className="s-poll-pct">{pct}% ({opt.votes || 0})</span>
                    </button>
                  );
                })}
              </div>
              <span className="studio-text-muted" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>{total} vote{total !== 1 ? 's' : ''}{hasVoted ? ' — You voted' : ''}</span>
            </div>
          );
        })}
      </div>
      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>New Poll</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleCreate} className="studio-form">
              <label className="studio-label">Question <input className="studio-input" value={newQuestion} onChange={e => setNewQuestion(e.target.value)} required autoFocus /></label>
              {newOptions.map((opt, i) => (
                <label key={i} className="studio-label">Option {i + 1} <input className="studio-input" value={opt} onChange={e => { const o = [...newOptions]; o[i] = e.target.value; setNewOptions(o); }} /></label>
              ))}
              <button type="button" className="studio-btn studio-btn--ghost" onClick={addOption}><span className="nf nf-fa-plus" /> Add Option</button>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Create</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
