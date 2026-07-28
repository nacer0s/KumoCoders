import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function InvoicesPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ number: `INV-${Date.now()}`, client: '', amount: '', dueDate: '', status: 'draft', lineItems: '' });

  function loadData() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/invoices/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setItems(d); }).catch(() => {});
  }
  useEffect(() => { loadData(); }, [teamId, token]);

  function parse(i) { return typeof i.data === 'string' ? JSON.parse(i.data) : (i.data || {}); }

  async function save(e) {
    e.preventDefault();
    const body = { ...form, amount: parseFloat(form.amount) || 0 };
    await fetch(`/api/studio/teams/${teamId}/apps/invoices/data`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itemKey: Date.now().toString(), data: body }) });
    setShow(false); setForm({ number: `INV-${Date.now()}`, client: '', amount: '', dueDate: '', status: 'draft', lineItems: '' }); loadData();
    showToast('Invoice created', 'success');
  }

  async function updateStatus(item, status) {
    const d = parse(item);
    await fetch(`/api/studio/apps/data/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: { ...d, status } }) });
    loadData();
    showToast('Status updated', 'success');
  }

  const totalDue = items.filter(i => parse(i).status === 'sent').reduce((s, i) => s + (parseFloat(parse(i).amount) || 0), 0);
  const statusColors = { draft: '#888', sent: '#4af', paid: '#4c6', overdue: '#f66', cancelled: '#888' };

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-file_invoice" /> Invoices <span className="studio-text-muted" style={{ fontSize: 14, fontWeight: 400 }}>(${totalDue.toFixed(2)} due)</span></h1>
        <button className="studio-btn studio-btn--primary" onClick={() => setShow(true)}><span className="nf nf-fa-plus" /> New Invoice</button>
      </div>
      <div className="s-list">
        {items.map(item => {
          const d = parse(item);
          return (
            <div key={item.id} className="s-list-item">
              <span className="nf nf-fa-file_invoice" style={{ opacity: 0.5 }} />
              <div className="s-list-item-info"><strong>{d.number}</strong><span className="studio-text-muted">{d.client} · ${parseFloat(d.amount || 0).toFixed(2)} · Due: {d.dueDate || 'N/A'}</span></div>
              <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: (statusColors[d.status] || '#888') + '22', color: statusColors[d.status] || '#888' }}>{d.status}</span>
              <div className="s-list-item-actions">
                {d.status === 'draft' && <button className="studio-btn studio-btn--ghost" onClick={() => updateStatus(item, 'sent')} style={{ fontSize: 11 }}>Send</button>}
                {d.status === 'sent' && <button className="studio-btn studio-btn--ghost" onClick={() => updateStatus(item, 'paid')} style={{ fontSize: 11 }}>Mark Paid</button>}
              </div>
            </div>
          );
        })}
        {items.length === 0 && <div className="studio-empty"><span className="nf nf-fa-file_invoice studio-empty-icon" /><h3>No invoices</h3></div>}
      </div>
      {show && (
        <>
          <div className="studio-backdrop" onClick={() => setShow(false)} />
          <div className="studio-modal s-modal-wide"><div className="studio-modal-header"><h2>New Invoice</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShow(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={save} className="studio-form">
              <label className="studio-label">Invoice # <input className="studio-input" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} required /></label>
              <label className="studio-label">Client <input className="studio-input" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} required /></label>
              <label className="studio-label">Amount ($) <input type="number" className="studio-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} step="0.01" required /></label>
              <label className="studio-label">Due Date <input type="date" className="studio-input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label>
              <label className="studio-label">Line Items <textarea className="studio-input" rows={4} value={form.lineItems} onChange={e => setForm({ ...form, lineItems: e.target.value })} placeholder="One item per line: Description | Qty | Unit Price" /></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Create</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
