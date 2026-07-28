import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';

export default function VoicePage({ teamId }) {
  const { token, user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const localAudio = useRef(null);

  function fetchChannels() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/channels?type=voice`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then((data) => { if (Array.isArray(data)) setChannels(data); })
      .catch(() => {});
  }

  useEffect(() => { fetchChannels(); }, [teamId, token]);

  async function handleJoin(ch) {
    setActiveChannel(ch);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      setInCall(true);
      if (localAudio.current) localAudio.current.srcObject = stream;
    } catch (err) {
      alert('Microphone access required to join voice channel');
    }
  }

  function handleLeave() {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    setInCall(false);
    setActiveChannel(null);
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/studio/teams/${teamId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, type: 'voice' }),
      });
      if (res.ok) {
        setName('');
        setShowCreate(false);
        fetchChannels();
      }
    } catch {}
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-microphone" style={{ color: '#777' }} /> Voice Channels</h1>
      </div>

      {inCall ? (
        <div className="studio-call-active">
          <div className="studio-call-header">
            <h2>#{activeChannel?.name}</h2>
            <span className="studio-badge studio-badge--success">Connected</span>
          </div>
          <div className="studio-call-participants">
            <div className="studio-call-participant">
              <div className="studio-avatar-lg">
                <UserAvatar user={user} />
              </div>
              <span>{user.display_name || user.username}</span>
              <span className="studio-text-muted">You</span>
            </div>
            <div className="studio-call-participant">
              <div className="studio-avatar-lg" style={{ opacity: 0.5 }}>?</div>
              <span className="studio-text-muted">Waiting for others...</span>
            </div>
          </div>
          <audio ref={localAudio} autoPlay muted />
          <div className="studio-call-actions">
            <button className="studio-btn studio-btn--danger" onClick={handleLeave}>
              <span className="nf nf-fa-phone_slash" /> Leave
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="studio-channels-list">
            {channels.map((ch) => (
              <div key={ch.id} className="studio-channel-card glass">
                <div className="studio-channel-card-icon" style={{ color: '#777' }}>
                  <span className="nf nf-fa-microphone" />
                </div>
                <div className="studio-channel-card-body">
                  <h3>#{ch.name}</h3>
                  <span className="studio-text-muted">Voice Channel</span>
                </div>
                <button className="studio-btn studio-btn--primary" onClick={() => handleJoin(ch)}>
                  <span className="nf nf-fa-phone" /> Join
                </button>
              </div>
            ))}
            <button className="studio-channel-card studio-channel-card--new glass" onClick={() => setShowCreate(true)}>
              <span className="nf nf-fa-plus" />
              <span>Create Voice Channel</span>
            </button>
          </div>

          {showCreate && (
            <>
              <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
              <div className="studio-modal">
                <div className="studio-modal-header">
                  <h2>Create Voice Channel</h2>
                  <button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}><span className="nf nf-fa-xmark" /></button>
                </div>
                <form onSubmit={handleCreate} className="studio-form">
                  <label className="studio-label">
                    Channel Name
                    <input className="studio-input" value={name} onChange={(e) => setName(e.target.value)} required />
                  </label>
                  <div className="studio-form-actions">
                    <button type="submit" className="studio-btn studio-btn--primary">Create</button>
                  </div>
                </form>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}