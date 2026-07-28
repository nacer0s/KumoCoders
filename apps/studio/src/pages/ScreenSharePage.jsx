import { useState, useRef } from 'react';

export default function ScreenSharePage({ teamId }) {
  const [sharing, setSharing] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  async function handleStart() {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: true,
      });
      setStream(mediaStream);
      setSharing(true);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;

      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) videoTrack.onended = () => handleStop();
    } catch {
      alert('Screen sharing cancelled or not supported');
    }
  }

  function handleStop() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setSharing(false);
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-display" style={{ color: '#777' }} /> Screen Share</h1>
        {sharing && <button className="studio-btn studio-btn--danger" onClick={handleStop}>
          <span className="nf nf-fa-stop" /> Stop Sharing
        </button>}
      </div>

      {sharing ? (
        <div className="studio-screenshare-active">
          <video ref={videoRef} autoPlay muted playsInline className="studio-screenshare-video" />
          <p className="studio-text-muted">You are sharing your screen</p>
        </div>
      ) : (
        <div className="studio-section">
          <h2>Share Your Screen</h2>
          <p className="studio-text-muted">Share your screen with team members in real-time.</p>
          <div className="studio-quick-actions studio-mt-lg">
            <button className="studio-btn studio-btn--primary" onClick={handleStart}>
              <span className="nf nf-fa-display" /> Start Sharing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}