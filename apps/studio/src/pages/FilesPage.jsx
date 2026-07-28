import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const PREVIEW_EXTS = new Set([
  'jpg','jpeg','png','gif','svg','webp','bmp','ico',
  'mp4','webm','ogg','mov','avi',
  'pdf',
  'txt','md','json','js','jsx','ts','tsx','css','html','xml','yaml','yml',
  'py','java','cpp','c','h','rs','go','rb','php','sql','sh','bash','zsh','env','gitignore',
]);

const TEXT_EXTS = new Set([
  'txt','md','json','js','jsx','ts','tsx','css','html','xml','yaml','yml',
  'py','java','cpp','c','h','rs','go','rb','php','sql','sh','bash','zsh','env','gitignore',
]);

function getExt(name) {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i + 1).toLowerCase();
}

function isPreviewable(file) {
  const name = file.original_name || file.filename || '';
  return PREVIEW_EXTS.has(getExt(name));
}

function isTextFile(file) {
  return TEXT_EXTS.has(getExt(file.original_name || file.filename || ''));
}

export default function FilesPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);

  function fetchFiles() {
    if (!token) { setLoading(false); return; }
    fetch(`/api/studio/teams/${teamId}/files`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then((data) => { if (Array.isArray(data)) setFiles(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchFiles(); }, [teamId, token]);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const res = await fetch(`/api/studio/teams/${teamId}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            filename: file.name,
            originalName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            content: base64,
          }),
        });
        if (res.ok) { fetchFiles(); showToast('File uploaded', 'success'); }
      } catch { showToast('Upload failed', 'error'); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function handleDropFiles(fileList) {
    for (const file of fileList) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        try {
          await fetch(`/api/studio/teams/${teamId}/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              filename: file.name,
              originalName: file.name,
              mimeType: file.type,
              sizeBytes: file.size,
              content: base64,
            }),
          });
        } catch { showToast('Upload failed', 'error'); }
      };
      reader.readAsDataURL(file);
    }
    setTimeout(() => { fetchFiles(); showToast('Files uploaded', 'success'); }, 500);
  }

  function handleDragOver(e) { e.preventDefault(); e.stopPropagation(); setDragOver(true); }
  function handleDragEnter(e) { e.preventDefault(); e.stopPropagation(); setDragOver(true); }
  function handleDragLeave(e) { e.preventDefault(); e.stopPropagation(); setDragOver(false); }
  function handleDrop(e) { e.preventDefault(); e.stopPropagation(); setDragOver(false); if (e.dataTransfer.files.length) handleDropFiles(e.dataTransfer.files); }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/studio/files/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { fetchFiles(); showToast('File deleted', 'success'); }
    } catch { showToast('Failed to delete file', 'error'); }
  }

  function handlePreview(file) {
    if (isTextFile(file)) {
      setPreviewContent(null);
      fetch(file.storage_path)
        .then(r => r.ok ? r.text() : 'Failed to load file content')
        .then(t => setPreviewContent(t))
        .catch(() => setPreviewContent('Failed to load file content'));
    }
    setPreviewFile(file);
  }

  function closePreview() {
    setPreviewFile(null);
    setPreviewContent(null);
  }

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') closePreview();
  }, []);

  useEffect(() => {
    if (previewFile) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [previewFile, handleKeyDown]);

  function getFileIcon(mime) {
    if (mime?.startsWith('image/')) return 'nf-fa-file_image';
    if (mime?.startsWith('video/')) return 'nf-fa-file_video';
    if (mime?.startsWith('audio/')) return 'nf-fa-file_audio';
    if (mime?.includes('pdf')) return 'nf-fa-file_pdf';
    if (mime?.includes('zip') || mime?.includes('rar')) return 'nf-fa-file_zipper';
    if (mime?.includes('text') || mime?.includes('json') || mime?.includes('javascript')) return 'nf-fa-file_code';
    return 'nf-fa-file';
  }

  return (
    <div className="studio-page"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: 'relative', minHeight: '40vh' }}
    >
      {dragOver && (
        <div className="s-dropzone-overlay">
          <div className="s-dropzone-content">
            <span className="nf nf-fa-cloud_upload" style={{ fontSize: '2.5rem', opacity: 0.6 }} />
            <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>Drop files here</span>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Upload to team storage</span>
          </div>
        </div>
      )}
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-folder_open" style={{ color: '#777' }} /> Files</h1>
        <label className="studio-btn studio-btn--primary" style={{ cursor: 'pointer' }}>
          <span className="nf nf-fa-upload" /> Upload
          <input type="file" style={{ display: 'none' }} onChange={handleUpload} />
        </label>
      </div>

      {loading ? (
        <LoadingSkeleton.Page />
      ) : files.length === 0 ? (
        <div className="studio-empty">
          <span className="nf nf-fa-folder_open studio-empty-icon" />
          <h3>No files yet</h3>
          <p>Upload files to share with your team</p>
        </div>
      ) : (
        <div className="studio-files-grid">
          {files.map((file) => (
            <div key={file.id} className="studio-file-card glass" style={{ cursor: 'pointer' }} onClick={() => { if (!file.storage_path) return; if (isPreviewable(file)) { handlePreview(file); } else { const a = document.createElement('a'); a.href = file.storage_path; a.download = file.original_name || file.filename; a.click(); } }}>
              <div className="studio-file-icon">
                <span className={`nf ${getFileIcon(file.mime_type)}`} />
              </div>
              <div className="studio-file-info">
                <strong>{file.original_name || file.filename}</strong>
                <span className="studio-text-muted">{formatSize(file.size_bytes)}</span>
                <span className="studio-text-muted">by {file.uploader_name || file.uploader_username}</span>
              </div>
              <button className="studio-btn studio-btn--icon" onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}>
                <span className="nf nf-fa-trash" />
              </button>
            </div>
          ))}
        </div>
      )}

      {previewFile && (
        <>
          <div className="studio-backdrop" onClick={closePreview} />
          <div className="s-preview-modal glass">
            <div className="s-preview-header">
              <strong>{previewFile.original_name || previewFile.filename}</strong>
              <div className="s-preview-actions">
                <a href={previewFile.storage_path} download={previewFile.original_name || previewFile.filename} className="studio-btn studio-btn--sm">
                  <span className="nf nf-fa-download" /> Download
                </a>
                <button className="studio-btn studio-btn--ghost" onClick={closePreview}>
                  <span className="nf nf-fa-xmark" />
                </button>
              </div>
            </div>
            <div className="s-preview-body">
              {(() => {
                const ext = getExt(previewFile.original_name || previewFile.filename || '');
                if (['jpg','jpeg','png','gif','svg','webp','bmp','ico'].includes(ext))
                  return <img src={previewFile.storage_path} alt={previewFile.original_name} className="s-preview-media" />;
                if (['mp4','webm','ogg','mov','avi'].includes(ext))
                  return <video src={previewFile.storage_path} controls className="s-preview-media" />;
                if (ext === 'pdf')
                  return <iframe src={previewFile.storage_path} className="s-preview-iframe" title={previewFile.original_name} />;
                return <pre className="s-preview-text">{previewContent ?? 'Loading...'}</pre>;
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}