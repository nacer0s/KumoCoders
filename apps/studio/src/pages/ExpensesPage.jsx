import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function ExpensesPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'office', date: new Date().toISOString().slice(0, 10), status: 'pending' });
  const [edit, setEdit] = useState(null);

  function loadData() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/expenses/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setItems(d); }).catch(() => {});
  }
  useEffect(() => { loadData(); }, [teamId, token]);

  function parse(i) { return typeof i.data === 'string' ? JSON.parse(i.data) : (i.data || {}); }

  async function save(e) {
    e.preventDefault();
    const body = { ...form, amount: parseFloat(form.amount) || 0 };
    if (edit) { await fetch(`/api/studio/apps/data/${edit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: body }) }); }
    else { await fetch(`/api/studio/teams/${teamId}/apps/expenses/data`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itemKey: Date.now().toString(), data: body }) }); }
    setShow(false); setEdit(null); setForm({ description: '', amount: '', category: 'office', date: new Date().toISOString().slice(0, 10), status: 'pending' }); loadData();
    showToast(edit ? 'Expense updated' : 'Expense created', 'success');
  }

  const cats = ['office', 'travel', 'meals', 'software', 'hardware', 'services', 'other'];
  const total = items.reduce((s, i) => s + (parseFloat(parse(i).amount) || 0), 0);
  const statusColors = { pending: '#fa4', approved: '#4c6', rejected: '#f66' };

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-money_bill" /> Expenses <span className="studio-text-muted" style={{ fontSize: 14, fontWeight: 400 }}>(${total.toFixed(2)})</span></h1>
        <button className="studio-btn studio-btn--primary" onClick={() => { setEdit(null); setForm({ description: '', amount: '', category: 'office', date: new Date().toISOString().slice(0, 10), status: 'pending' }); setShow(true); }}><span className="nf nf-fa-plus" /> Add Expense</button>
      </div>
      <div className="s-list">
        {items.map(item => {
          const d = parse(item);
          return (
            <div key={item.id} className="s-list-item" onClick={() => { setEdit(item); setForm({ description: d.description, amount: String(d.amount || ''), category: d.category, date: d.date, status: d.status }); setShow(true); }} style={{ cursor: 'pointer' }}>
              <span className="nf nf-fa-receipt" style={{ opacity: 0.5 }} />
              <div className="s-list-item-info"><strong>{d.description}</strong><span className="studio-text-muted">${parseFloat(d.amount || 0).toFixed(2)} · {d.category} · {d.date}</span></div>
              <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: statusColors[d.status] + '22', color: statusColors[d.status] }}>{d.status}</span>
            </div>
          );
        })}
        {items.length === 0 && <div className="studio-empty"><span className="nf nf-fa-money_bill studio-empty-icon" /><h3>No expenses</h3></div>}
      </div>
      {show && (
        <>
          <div className="studio-backdrop" onClick={() => setShow(false)} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>{edit ? 'Edit' : 'New'} Expense</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShow(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={save} className="studio-form">
              <label className="studio-label">Description <input className="studio-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required autoFocus /></label>
              <label className="studio-label">Amount ($) <input type="number" className="studio-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} step="0.01" min="0" /></label>
              <label className="studio-label">Category <select className="studio-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{cats.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
              <label className="studio-label">Date <input type="date" className="studio-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
              <label className="studio-label">Status <select className="studio-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">{edit ? 'Update' : 'Create'}</button>
                {edit && <button type="button" className="studio-btn studio-btn--ghost" onClick={async () => { await fetch(`/api/studio/apps/data/${edit.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); setShow(false); loadData(); showToast('Expense deleted', 'success'); }}>Delete</button>}
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
