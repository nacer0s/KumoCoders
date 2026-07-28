import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const STATUS_COLORS = { draft: '#888', sent: '#4af', signed: '#4c6', expired: '#f66' };
const TYPES = ['nda', 'service', 'sale', 'lease'];

export default function ContractsPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState({ title: '', client: '', type: 'service', value: '', startDate: '', endDate: '', status: 'draft', fileUrl: '' });

  function loadData() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/contracts/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setItems(d); }).catch(() => {});
  }
  useEffect(() => { loadData(); }, [teamId, token]);

  function parse(i) { return typeof i.data === 'string' ? JSON.parse(i.data) : (i.data || {}); }

  async function handleSave(e) {
    e.preventDefault();
    const body = { ...form, value: parseFloat(form.value) || 0 };
    await fetch(`/api/studio/teams/${teamId}/apps/contracts/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: body }),
    });
    setShow(false); setForm({ title: '', client: '', type: 'service', value: '', startDate: '', endDate: '', status: 'draft', fileUrl: '' }); loadData();
    showToast('Contract created', 'success');
  }

  async function updateStatus(item, status) {
    const d = parse(item);
    await fetch(`/api/studio/apps/data/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: { ...d, status } }) });
    loadData();
    showToast('Status updated', 'success');
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-file_signature" /> Contracts</h1><button className="studio-btn studio-btn--primary" onClick={() => setShow(true)}><span className="nf nf-fa-plus" /> New Contract</button></div>
      <div className="s-list">
        {items.map(item => {
          const d = parse(item);
          const days = daysUntil(d.endDate);
          return (
            <div key={item.id} className="s-list-item" onClick={() => setViewing(item)} style={{ cursor: 'pointer' }}>
              <span className="nf nf-fa-file_contract" style={{ opacity: 0.5 }} />
              <div className="s-list-item-info"><strong>{d.title}</strong><span className="studio-text-muted">{d.client} · {d.type} · ${parseFloat(d.value || 0).toFixed(2)}</span></div>
              <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: (STATUS_COLORS[d.status] || '#888') + '22', color: STATUS_COLORS[d.status] || '#888' }}>{d.status}</span>
              {days !== null && days <= 30 && days > 0 && <span style={{ fontSize: 11, color: '#fa4' }}>{days}d left</span>}
              {days !== null && days <= 0 && <span style={{ fontSize: 11, color: '#f66' }}>Expired</span>}
            </div>
          );
        })}
        {items.length === 0 && <div className="studio-empty"><span className="nf nf-fa-file_signature studio-empty-icon" /><h3>No contracts</h3></div>}
      </div>
      {viewing && (() => { const d = parse(viewing); const days = daysUntil(d.endDate); return (
        <>
          <div className="studio-backdrop" onClick={() => setViewing(null)} />
          <div className="studio-modal s-modal-wide">
            <div className="studio-modal-header"><h2>{d.title}</h2><button className="studio-btn studio-btn--ghost" onClick={() => setViewing(null)}><span className="nf nf-fa-xmark" /></button></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <div><strong>Client:</strong> {d.client}</div>
              <div><strong>Type:</strong> {d.type} · <strong>Value:</strong> ${parseFloat(d.value || 0).toFixed(2)}</div>
              <div><strong>Period:</strong> {d.startDate || 'N/A'} → {d.endDate || 'N/A'}</div>
              <div><strong>Status:</strong> <span style={{ color: STATUS_COLORS[d.status] || '#888' }}>{d.status}</span></div>
              {days !== null && days > 0 && days <= 30 && <div style={{ color: '#fa4' }}>⚠ Expires in {days} day{days !== 1 ? 's' : ''}</div>}
              {days !== null && days <= 0 && <div style={{ color: '#f66' }}>⚠ This contract has expired</div>}
              {d.fileUrl && <div><strong>File:</strong> <a href={d.fileUrl} target="_blank" rel="noopener noreferrer">{d.fileUrl}</a></div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {d.status === 'draft' && <button className="studio-btn studio-btn--primary studio-btn--sm" onClick={() => { updateStatus(viewing, 'sent'); setViewing(null); }}>Send</button>}
                {d.status === 'sent' && <button className="studio-btn studio-btn--primary studio-btn--sm" onClick={() => { updateStatus(viewing, 'signed'); setViewing(null); }}>Mark Signed</button>}
              </div>
            </div>
          </div>
        </>
      ); })()}
      {show && (
        <>
          <div className="studio-backdrop" onClick={() => setShow(false)} />
          <div className="studio-modal s-modal-wide"><div className="studio-modal-header"><h2>New Contract</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShow(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleSave} className="studio-form">
              <div className="studio-form-row">
                <label className="studio-label">Title <input className="studio-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus /></label>
                <label className="studio-label">Client <input className="studio-input" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} required /></label>
              </div>
              <div className="studio-form-row">
                <label className="studio-label">Type <select className="studio-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></label>
                <label className="studio-label">Value ($) <input type="number" className="studio-input" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} step="0.01" /></label>
              </div>
              <div className="studio-form-row">
                <label className="studio-label">Start Date <input type="date" className="studio-input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></label>
                <label className="studio-label">End Date <input type="date" className="studio-input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></label>
              </div>
              <label className="studio-label">File URL <input className="studio-input" type="url" value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." /></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Create</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
