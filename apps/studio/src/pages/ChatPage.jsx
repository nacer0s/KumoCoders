import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';

export default function ChatPage({ teamId }) {
  const { token, user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const messagesEnd = useRef(null);

  function fetchChannels() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/channels?type=chat`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then((data) => { if (Array.isArray(data)) { setChannels(data); } })
      .catch(() => {});
  }

  function fetchMessages(channelId) {
    if (!channelId || !token) return;
    fetch(`/api/studio/channels/${channelId}/messages?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then((data) => setMessages(data.messages || []))
      .catch(() => {});
  }

  useEffect(() => { fetchChannels(); }, [teamId, token]);

  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      setActiveChannel(channels[0]);
    }
  }, [channels, activeChannel]);

  useEffect(() => {
    if (activeChannel) fetchMessages(activeChannel.id);
  }, [activeChannel]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || !activeChannel) return;
    try {
      const res = await fetch(`/api/studio/channels/${activeChannel.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: input.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setInput('');
      }
    } catch {}
  }

  async function handleCreateChannel(e) {
    e.preventDefault();
    try {
      await fetch(`/api/studio/teams/${teamId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newChannelName, type: 'chat' }),
      });
      setNewChannelName('');
      setShowCreate(false);
      fetchChannels();
    } catch {}
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="studio-chat">
      {/* Sidebar */}
      <div className="studio-chat-sidebar">
        <div className="studio-chat-sidebar-header">
          <h3>Channels</h3>
          <button className="studio-btn studio-btn--icon" onClick={() => setShowCreate(true)} title="Create channel">
            <span className="nf nf-fa-plus" />
          </button>
        </div>
        <div className="studio-chat-channels">
          {channels.map((ch) => (
            <button
              key={ch.id}
              className={`studio-chat-channel ${activeChannel?.id === ch.id ? 'studio-chat-channel--active' : ''}`}
              onClick={() => setActiveChannel(ch)}
            >
              <span className="nf nf-fa-hashtag" />
              <span>{ch.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="studio-chat-main">
        {activeChannel ? (
          <>
            <div className="studio-chat-header">
              <span className="nf nf-fa-hashtag" />
              <h3>{activeChannel.name}</h3>
            </div>

            <div className="studio-chat-messages">
              {messages.length === 0 ? (
                <div className="studio-empty">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="studio-msg">
                    <div className="studio-avatar-sm">
                      <UserAvatar user={{ username: msg.username, display_name: msg.display_name, avatar_url: msg.avatar_url }} />
                    </div>
                    <div className="studio-msg-body">
                      <div className="studio-msg-meta">
                        <strong>{msg.display_name || msg.username}</strong>
                        <span className="studio-text-muted">{timeAgo(msg.created_at)}</span>
                      </div>
                      <div className="studio-msg-content">{msg.content}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEnd} />
            </div>

            <form className="studio-chat-input" onSubmit={handleSend}>
              <input
                className="studio-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                autoFocus
              />
              <button type="submit" className="studio-btn studio-btn--primary" disabled={!input.trim()}>
                <span className="nf nf-fa-paper_plane" />
              </button>
            </form>
          </>
        ) : (
          <div className="studio-empty">
            <h3>Select a channel</h3>
            <p>Choose a channel from the sidebar to start chatting</p>
          </div>
        )}
      </div>

      {/* Create channel modal */}
      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal">
            <div className="studio-modal-header">
              <h2>Create Channel</h2>
              <button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}>
                <span className="nf nf-fa-xmark" />
              </button>
            </div>
            <form onSubmit={handleCreateChannel} className="studio-form">
              <label className="studio-label">
                Channel Name
                <input
                  className="studio-input"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g. general"
                  required
                  autoFocus
                />
              </label>
              <div className="studio-form-actions">
                <button type="submit" className="studio-btn studio-btn--primary">Create</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
