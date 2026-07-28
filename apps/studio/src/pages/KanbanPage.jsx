import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';

const COLORS = ['#4af', '#f84', '#4c6', '#e4e', '#fa4', '#4dd', '#f66', '#84f', '#8c8', '#fa8'];

export default function KanbanPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState(['Backlog', 'Todo', 'In Progress', 'Review', 'Done']);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCol, setNewCol] = useState(columns[0]);
  const [dragId, setDragId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  function fetchData() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/kanban/data`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setItems(d); }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, [teamId, token]);

  async function handleCreate(e) {
    e.preventDefault();
    const res = await fetch(`/api/studio/teams/${teamId}/apps/kanban/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { title: newTitle, column: newCol, color: COLORS[Math.floor(Math.random() * COLORS.length)] } }),
    });
    if (res.ok) { setShowCreate(false); setNewTitle(''); fetchData(); showToast('Card created', 'success'); }
  }

  function handleDragStart(e, id) {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDragId(id);
  }

  function handleDragOver(e, col) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  }

  function handleDragLeave(col) {
    setDragOverCol(prev => prev === col ? null : prev);
  }

  async function handleDrop(e, col) {
    e.preventDefault();
    setDragOverCol(null);
    const id = e.dataTransfer.getData('text/plain') || dragId;
    if (!id) return;
    const item = items.find(i => i.id === id);
    if (!item) return;
    const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
    await fetch(`/api/studio/apps/data/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ appData: { ...data, column: col } }),
    });
    setDragId(null);
    fetchData();
    showToast('Card moved', 'success');
  }

  async function handleDelete(id) {
    await fetch(`/api/studio/apps/data/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchData();
    showToast('Card deleted', 'success');
  }

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  if (loading) return <LoadingSkeleton.Page />;

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-columns" /> Kanban Board</h1>
        <button className="studio-btn studio-btn--primary" onClick={() => setShowCreate(true)}><span className="nf nf-fa-plus" /> Add Card</button>
      </div>
      <div className="s-kanban">
        {columns.map(col => (
          <div
            key={col}
            className={`s-kanban-col ${dragOverCol === col ? 's-kanban-col--drag-over' : ''}`}
            onDragOver={e => handleDragOver(e, col)}
            onDragLeave={() => handleDragLeave(col)}
            onDrop={e => handleDrop(e, col)}
          >
            <div className="s-kanban-col-header">{col}</div>
            <div className="s-kanban-cards">
              {items.filter(i => parse(i).column === col).map(item => {
                const d = parse(item);
                return (
                  <div
                    key={item.id}
                    className={`s-kanban-card ${dragId === item.id ? 's-kanban-card--dragging' : ''}`}
                    draggable="true"
                    onDragStart={e => handleDragStart(e, item.id)}
                    style={{ borderLeftColor: d.color || '#777' }}
                  >
                    <div className="s-kanban-card-top">
                      <strong>{d.title}</strong>
                      <button className="studio-btn studio-btn--icon" onClick={() => handleDelete(item.id)} style={{ minWidth: 'auto', padding: '2px' }}><span className="nf nf-fa-trash" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal">
            <div className="studio-modal-header"><h2>Add Card</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleCreate} className="studio-form">
              <label className="studio-label">Title <input className="studio-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} required autoFocus /></label>
              <label className="studio-label">Column <select className="studio-input" value={newCol} onChange={e => setNewCol(e.target.value)}>{columns.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
              <div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Create</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
