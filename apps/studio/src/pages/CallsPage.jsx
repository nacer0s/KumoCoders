import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';

export default function CallsPage({ teamId }) {
  const { user } = useAuth();
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState(null);

  async function handleStartCall(type) {
    setCallType(type);
    setInCall(true);
  }

  function handleEndCall() {
    setInCall(false);
    setCallType(null);
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-phone" style={{ color: '#777' }} /> 1v1 Calls</h1>
      </div>

      {inCall ? (
        <div className="studio-call-active">
          <div className="studio-call-header">
            <h2>{callType === 'audio' ? 'Voice Call' : 'Video Call'}</h2>
            <span className="studio-badge studio-badge--success">Connected</span>
          </div>
          {callType === 'video' && (
            <div className="studio-call-videos">
              <div className="studio-video-container studio-video-container--local">
                <div className="studio-avatar-lg">
                  <UserAvatar user={user} />
                </div>
                <span>You</span>
              </div>
              <div className="studio-video-container studio-video-container--remote">
                <div className="studio-avatar-lg" style={{ opacity: 0.5 }}>?</div>
                <span className="studio-text-muted">Waiting...</span>
              </div>
            </div>
          )}
          <div className="studio-call-actions">
            <button className="studio-btn studio-btn--danger" onClick={handleEndCall}>
              <span className="nf nf-fa-phone_slash" /> End Call
            </button>
          </div>
        </div>
      ) : (
        <div className="studio-section">
          <h2>Start a Call</h2>
          <p className="studio-text-muted">Direct 1v1 calls with team members. Select a team member and call type.</p>
          <div className="studio-quick-actions studio-mt-lg">
            <button className="studio-btn studio-btn--primary" onClick={() => handleStartCall('audio')}>
              <span className="nf nf-fa-phone" /> Start Audio Call
            </button>
            <button className="studio-btn studio-btn--glass" onClick={() => handleStartCall('video')}>
              <span className="nf nf-fa-video" /> Start Video Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}