import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function VideoPage({ teamId }) {
  const { token, user } = useAuth();
  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const localVideo = useRef(null);

  function fetchMeetings() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/meetings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then((data) => { if (Array.isArray(data)) setMeetings(data); })
      .catch(() => {});
  }

  useEffect(() => { fetchMeetings(); }, [teamId, token]);

  async function handleStartMeeting() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setLocalStream(stream);
      setInCall(true);
      if (localVideo.current) localVideo.current.srcObject = stream;

      await fetch(`/api/studio/teams/${teamId}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: `${user.display_name || user.username}'s Meeting`, type: 'instant' }),
      });
      fetchMeetings();
    } catch (err) {
      alert('Camera/microphone access required');
    }
  }

  function handleEndCall() {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    setInCall(false);
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-video" style={{ color: '#777' }} /> Video Meetings</h1>
        <button className="studio-btn studio-btn--primary" onClick={handleStartMeeting}>
          <span className="nf nf-fa-video_plus" /> New Meeting
        </button>
      </div>

      {inCall ? (
        <div className="studio-call-active">
          <div className="studio-call-videos">
            <div className="studio-video-container studio-video-container--local">
              <video ref={localVideo} autoPlay muted playsInline />
              <span className="studio-video-label">{user.display_name || user.username} (You)</span>
            </div>
            <div className="studio-video-container studio-video-container--remote">
              <div className="studio-avatar-lg">?</div>
              <span className="studio-video-label">Waiting for participants...</span>
            </div>
          </div>
          <div className="studio-call-actions">
            <button className="studio-btn studio-btn--danger" onClick={handleEndCall}>
              <span className="nf nf-fa-phone_slash" /> End
            </button>
          </div>
        </div>
      ) : (
        <div className="studio-meetings-list">
          {meetings.length > 0 && (
            <section className="studio-section">
              <h2>Active Meetings</h2>
              {meetings.map((m) => (
                <div key={m.id} className="studio-meeting-card glass">
                  <span className="nf nf-fa-video" style={{ color: '#777' }} />
                  <div>
                    <strong>{m.title || 'Untitled Meeting'}</strong>
                    <span className="studio-text-muted">Started by {m.started_by_name || m.started_by_username}</span>
                  </div>
                  <span className="studio-badge studio-badge--success">LIVE</span>
                </div>
              ))}
            </section>
          )}
          <section className="studio-section">
            <h2>Quick Actions</h2>
            <div className="studio-quick-actions">
              <button className="studio-btn studio-btn--primary" onClick={handleStartMeeting}>
                <span className="nf nf-fa-video_plus" /> Start Instant Meeting
              </button>
              <button className="studio-btn studio-btn--glass" onClick={() => setShowSchedule(true)}>
                <span className="nf nf-fa-calendar_plus" /> Schedule Meeting
              </button>
            </div>
          </section>
        </div>
      )}

      {showSchedule && (
        <>
          <div className="studio-backdrop" onClick={() => setShowSchedule(false)} />
          <div className="studio-modal">
            <div className="studio-modal-header">
              <h2>Schedule Meeting</h2>
              <button className="studio-btn studio-btn--ghost" onClick={() => setShowSchedule(false)}>
                <span className="nf nf-fa-xmark" /></button>
            </div>
            <p className="studio-text-muted">Meeting scheduling will be available in the Calendar app.</p>
          </div>
        </>
      )}
    </div>
  );
}