import { useState, useRef, useCallback } from 'react';

export default function UploadDropzone({ type = 'content', onUpload, accept = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml', className = '', children }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  const upload = useCallback(async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('kc_token')}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }
      const data = await res.json();
      setPreview(data.url);
      onUpload?.(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [type, onUpload]);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  }

  return (
    <div
      className={`upload-dropzone ${dragOver ? 'upload-dropzone--drag' : ''} ${uploading ? 'upload-dropzone--uploading' : ''} ${error ? 'upload-dropzone--error' : ''} ${className}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
    >
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="upload-dropzone-input" />
      {children ? (
        children
      ) : uploading ? (
        <div className="upload-dropzone-status">
          <span className="nf nf-fa-spinner nf-fa-spin" />
          <span>Uploading...</span>
        </div>
      ) : error ? (
        <div className="upload-dropzone-status">
          <span className="nf nf-fa-exclamation_triangle" />
          <span className="upload-dropzone-error">{error}</span>
        </div>
      ) : preview ? (
        <div className="upload-dropzone-preview">
          <img src={preview} alt="Uploaded" className="upload-dropzone-img" />
          <span className="upload-dropzone-replace">
            <span className="nf nf-fa-camera" /> Change
          </span>
        </div>
      ) : (
        <div className="upload-dropzone-status">
          <span className="nf nf-fa-cloud_upload upload-dropzone-icon" />
          <span>Drop an image or click to browse</span>
        </div>
      )}
    </div>
  );
}