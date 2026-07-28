import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function VideoVoicemailPage({ teamId }) {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState('record');
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [previewStream, setPreviewStream] = useState(null);
  const [videos, setVideos] = useState([]);
  const [playing, setPlaying] = useState(null);
  const [sending, setSending] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const previewVideoRef = useRef(null);
  const playbackVideoRef = useRef(null);

  function fetchVideos() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/files`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        if (Array.isArray(d)) setVideos(d.filter(f => f.mime_type?.startsWith('video/')));
      })
      .catch(() => {});
  }

  useEffect(() => { fetchVideos(); }, [teamId, token]);

  function cleanupStream() {
    if (previewStream) {
      previewStream.getTracks().forEach(t => t.stop());
      setPreviewStream(null);
    }
  }

  useEffect(() => {
    return () => cleanupStream();
  }, []);

  async function startRecording() {
    try {
      cleanupStream();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPreviewStream(stream);
      if (previewVideoRef.current) previewVideoRef.current.srcObject = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordedBlob(null);
    } catch {
      showToast('Camera/microphone access required', 'error');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanupStream();
    setRecording(false);
  }

  function cancelRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanupStream();
    setRecording(false);
    setRecordedBlob(null);
  }

  async function sendRecording() {
    if (!recordedBlob) return;
    setSending(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const filename = `voicemail-${Date.now()}.webm`;
        const res = await fetch(`/api/studio/teams/${teamId}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            filename, originalName: filename,
            mimeType: 'video/webm', sizeBytes: recordedBlob.size, content: base64,
          }),
        });
        if (res.ok) { showToast('Voicemail sent', 'success'); setRecordedBlob(null); fetchVideos(); setTab('browse'); }
        else showToast('Upload failed', 'error');
        setSending(false);
      };
      reader.readAsDataURL(recordedBlob);
    } catch { showToast('Upload failed', 'error'); setSending(false); }
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-video" /> Video Voicemail</h1>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className={`studio-btn ${tab === 'record' ? 'studio-btn--primary' : 'studio-btn--ghost'}`} onClick={() => setTab('record')}>
            <span className="nf nf-fa-circle_dot" /> Record
          </button>
          <button className={`studio-btn ${tab === 'browse' ? 'studio-btn--primary' : 'studio-btn--ghost'}`} onClick={() => setTab('browse')}>
            <span className="nf nf-fa-folder_open" /> Browse
          </button>
        </div>
      </div>

      {tab === 'record' ? (
        <div className="glass" style={{ padding: 16, borderRadius: 12, maxWidth: 640 }}>
          <div style={{
            aspectRatio: '16/9', background: '#111', borderRadius: 8, overflow: 'hidden', marginBottom: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {recordedBlob ? (
              <video ref={playbackVideoRef} src={URL.createObjectURL(recordedBlob)} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <video ref={previewVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: previewStream ? 'block' : 'none' }} />
            )}
            {!previewStream && !recordedBlob && !recording && (
              <span className="studio-text-muted" style={{ fontSize: 14 }}>Camera preview will appear here</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {!recording && !recordedBlob && (
              <button className="studio-btn studio-btn--primary" onClick={startRecording}>
                <span className="nf nf-fa-circle" style={{ color: '#f44' }} /> Start Recording
              </button>
            )}
            {recording && (
              <button className="studio-btn studio-btn--danger" onClick={stopRecording}>
                <span className="nf nf-fa-stop" /> Stop Recording
              </button>
            )}
            {recordedBlob && !recording && (
              <>
                <button className="studio-btn studio-btn--primary" onClick={sendRecording} disabled={sending}>
                  <span className="nf nf-fa-paper_plane" /> {sending ? 'Sending...' : 'Send'}
                </button>
                <button className="studio-btn studio-btn--ghost" onClick={cancelRecording}>
                  <span className="nf nf-fa-trash" /> Discard
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div>
          {videos.length === 0 ? (
            <div className="studio-empty">
              <span className="nf nf-fa-video studio-empty-icon" />
              <h3>No video voicemails</h3>
              <p className="studio-text-muted">Record a voicemail to see it here</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {[...videos].reverse().map(v => (
                <div key={v.id} className="glass" style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setPlaying(v)}>
                  <div style={{
                    aspectRatio: '16/9', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                  }}>
                    <span className="nf nf-fa-play_circle" style={{ fontSize: 40, opacity: 0.6 }} />
                    <span style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 11, background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: 4 }}>
                      {v.mime_type?.split('/')[1] || 'video'}
                    </span>
                  </div>
                  <div style={{ padding: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.original_name || v.filename}
                    </div>
                    <div className="studio-text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                      {v.created_by_name || v.created_by_username || 'Unknown'} — {new Date(v.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {playing && (
        <>
          <div className="studio-backdrop" onClick={() => setPlaying(null)} />
          <div className="studio-modal" style={{ maxWidth: 720 }}>
            <div className="studio-modal-header">
              <h2>{playing.original_name || playing.filename}</h2>
              <button className="studio-btn studio-btn--ghost" onClick={() => setPlaying(null)}><span className="nf nf-fa-xmark" /></button>
            </div>
            <div style={{ padding: '0 4px' }}>
              <video controls autoPlay style={{ width: '100%', borderRadius: 8, maxHeight: '60vh' }}>
                <source src={`/api/studio/files/${playing.id}/download?token=${token}`} type={playing.mime_type || 'video/mp4'} />
              </video>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13 }} className="studio-text-muted">
                <span><span className="nf nf-fa-user" /> {playing.created_by_name || playing.created_by_username || 'Unknown'}</span>
                <span><span className="nf nf-fa-calendar" /> {new Date(playing.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}