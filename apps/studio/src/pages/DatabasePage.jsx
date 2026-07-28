import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function DatabasePage({ teamId }) {
  const { token } = useAuth();
  const [tables, setTables] = useState([]);
  const [active, setActive] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  function fetchTables() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/database/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setTables(d); }).catch(() => {});
  }

  useEffect(() => { fetchTables(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  async function handleCreate(e) {
    e.preventDefault();
    const res = await fetch(`/api/studio/teams/${teamId}/apps/database/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { title: newTitle, columns: [{ key: 'col1', name: 'Column 1', type: 'text' }], rows: [{ id: 1, col1: '' }] } }),
    });
    if (res.ok) { setShowCreate(false); setNewTitle(''); fetchTables(); }
  }

  function openTable(tbl) {
    setActive(tbl);
  }

  async function addColumn() {
    if (!active) return;
    const d = parse(active);
    const key = `col${Date.now()}`;
    d.columns = [...(d.columns || []), { key, name: 'New Column', type: 'text' }];
    d.rows = (d.rows || []).map(r => ({ ...r, [key]: '' }));
    await fetch(`/api/studio/apps/data/${active.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    fetchTables();
  }

  async function addRow() {
    if (!active) return;
    const d = parse(active);
    const row = { id: Date.now() };
    (d.columns || []).forEach(c => { row[c.key] = ''; });
    d.rows = [...(d.rows || []), row];
    await fetch(`/api/studio/apps/data/${active.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    fetchTables();
  }

  async function updateCell(rowId, key, val) {
    if (!active) return;
    const d = parse(active);
    d.rows = (d.rows || []).map(r => r.id === rowId ? { ...r, [key]: val } : r);
    await fetch(`/api/studio/apps/data/${active.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    fetchTables();
  }

  async function deleteRow(rowId) {
    if (!active) return;
    const d = parse(active);
    d.rows = (d.rows || []).filter(r => r.id !== rowId);
    await fetch(`/api/studio/apps/data/${active.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    fetchTables();
  }

  async function renameColumn(oldKey, newName) {
    if (!active) return;
    const d = parse(active);
    d.columns = (d.columns || []).map(c => c.key === oldKey ? { ...c, name: newName } : c);
    await fetch(`/api/studio/apps/data/${active.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: d }) });
    fetchTables();
  }

  async function deleteTable(id) {
    await fetch(`/api/studio/apps/data/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (active?.id === id) setActive(null);
    fetchTables();
  }

  if (active) {
    const d = parse(active);
    return (
      <div className="studio-page">
        <div className="studio-page-header"><h1><span className="nf nf-fa-table" /> {d.title}</h1><div className="studio-page-actions"><button className="studio-btn studio-btn--ghost" onClick={() => setActive(null)}><span className="nf nf-fa-arrow_left" /> Back</button><button className="studio-btn studio-btn--ghost" onClick={addColumn}><span className="nf nf-fa-plus" /> Column</button><button className="studio-btn studio-btn--primary" onClick={addRow}><span className="nf nf-fa-plus" /> Row</button></div></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="s-table"><thead><tr>{(d.columns || []).map(c => <th key={c.key}><input className="studio-input" value={c.name} onChange={e => renameColumn(c.key, e.target.value)} style={{ fontWeight: 600, border: 'none', background: 'transparent', padding: 0, fontSize: 'inherit' }} /></th>)}<th style={{ width: 40 }}></th></tr></thead><tbody>{(d.rows || []).map(row => <tr key={row.id}>{(d.columns || []).map(c => <td key={c.key}><input className="studio-input" value={row[c.key] || ''} onChange={e => updateCell(row.id, c.key, e.target.value)} style={{ border: 'none', background: 'transparent', padding: 0, width: '100%' }} /></td>)}<td><button className="studio-btn studio-btn--icon" onClick={() => deleteRow(row.id)} style={{ minWidth: 'auto', padding: 2 }}><span className="nf nf-fa-trash" /></button></td></tr>)}</tbody></table>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-table" /> Database / Tables</h1><button className="studio-btn studio-btn--primary" onClick={() => setShowCreate(true)}><span className="nf nf-fa-plus" /> New Table</button></div>
      {tables.map(tbl => {
        const d = parse(tbl);
        return (
          <div key={tbl.id} className="s-list-item" onClick={() => openTable(tbl)} style={{ cursor: 'pointer' }}>
            <span className="nf nf-fa-table" style={{ marginRight: 8, opacity: 0.5 }} />
            <div className="s-list-item-info"><strong>{d.title}</strong><span className="studio-text-muted">{(d.columns || []).length} cols, {(d.rows || []).length} rows</span></div>
            <button className="studio-btn studio-btn--icon" onClick={e => { e.stopPropagation(); deleteTable(tbl.id); }}><span className="nf nf-fa-trash" /></button>
          </div>
        );
      })}
      {tables.length === 0 && <div className="studio-empty"><span className="nf nf-fa-table studio-empty-icon" /><h3>No tables yet</h3></div>}
      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>New Table</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleCreate} className="studio-form"><label className="studio-label">Name <input className="studio-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} required autoFocus /></label><div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Create</button></div></form>
          </div>
        </>
      )}
    </div>
  );
}
