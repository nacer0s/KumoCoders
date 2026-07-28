import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function APIPlaygroundPage({ teamId }) {
  const { token } = useAuth();
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState('Content-Type: application/json');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState([]);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState('');

  async function sendRequest() {
    setLoading(true); setError(''); setResponse(null);
    try {
      const hdrs = {};
      headers.split('\n').filter(Boolean).forEach(line => {
        const idx = line.indexOf(':');
        if (idx > 0) hdrs[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      });
      const opts = { method, headers: hdrs };
      if (method !== 'GET' && method !== 'HEAD' && body.trim()) opts.body = body;
      const res = await fetch(url, opts);
      let data;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('json')) data = await res.json();
      else data = await res.text();
      setResponse({ status: res.status, statusText: res.statusText, headers: [...res.headers].map(([k, v]) => `${k}: ${v}`).join('\n'), data: typeof data === 'string' ? data : JSON.stringify(data, null, 2) });
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    await fetch(`/api/studio/teams/${teamId}/apps/apiplayground/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { name: saveName, method, url, headers, body } }),
    });
    setShowSave(false); setSaveName(''); fetchSaved();
  }

  function fetchSaved() {
    fetch(`/api/studio/teams/${teamId}/apps/apiplayground/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setSaved(d); }).catch(() => {});
  }

  function loadSaved(item) {
    const d = typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {});
    setMethod(d.method); setUrl(d.url); setHeaders(d.headers); setBody(d.body || '');
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-code" /> API Playground</h1><button className="studio-btn studio-btn--ghost" onClick={fetchSaved}>Saved</button></div>
      <div className="s-api">
        <div className="s-api-request">
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <select className="studio-input" value={method} onChange={e => setMethod(e.target.value)} style={{ width: 100, flexShrink: 0 }}>
              <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
            </select>
            <input className="studio-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.example.com/endpoint" style={{ flex: 1 }} />
            <button className="studio-btn studio-btn--primary" onClick={sendRequest} disabled={loading || !url}>{loading ? 'Sending...' : 'Send'}</button>
            <button className="studio-btn studio-btn--ghost" onClick={() => setShowSave(true)}><span className="nf nf-fa-bookmark" /></button>
          </div>
          <textarea className="studio-input" value={headers} onChange={e => setHeaders(e.target.value)} rows={3} placeholder="Headers (one per line)" style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 8, width: '100%' }} />
          {method !== 'GET' && <textarea className="studio-input" value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Request body" style={{ fontFamily: 'monospace', fontSize: 12, width: '100%' }} />}
        </div>
        <div className="s-api-response">
          {error && <div style={{ color: 'var(--color-danger)', padding: 16 }}>Error: {error}</div>}
          {response && (
            <>
              <div style={{ padding: '8px 16px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`s-api-status s-api-status--${Math.floor(response.status / 100)}`}>{response.status} {response.statusText}</span>
              </div>
              <div style={{ padding: '4px 16px', fontFamily: 'monospace', fontSize: 11, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'pre-wrap', maxHeight: 100, overflow: 'auto' }}>{response.headers}</div>
              <pre style={{ padding: 16, fontFamily: 'monospace', fontSize: 12, overflow: 'auto', maxHeight: 400, margin: 0 }}>{response.data}</pre>
            </>
          )}
        </div>
      </div>
      {saved.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 8 }}>Saved Requests</h3>
          {saved.map(s => {
            const d = typeof s.data === 'string' ? JSON.parse(s.data) : (s.data || {});
            return <div key={s.id} className="s-list-item" onClick={() => loadSaved(s)} style={{ cursor: 'pointer' }}><span className="nf nf-fa-bookmark" style={{ marginRight: 8 }} /><strong>{d.name}</strong><span className="studio-text-muted" style={{ marginLeft: 8 }}>{d.method} {d.url}</span></div>;
          })}
        </div>
      )}
      {showSave && (
        <>
          <div className="studio-backdrop" onClick={() => setShowSave(false)} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>Save Request</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShowSave(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleSave} className="studio-form"><label className="studio-label">Name <input className="studio-input" value={saveName} onChange={e => setSaveName(e.target.value)} required autoFocus /></label><div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Save</button></div></form>
          </div>
        </>
      )}
    </div>
  );
}
