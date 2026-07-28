import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

let nid = 0;
function nuid() { return `n${++nid}_${Date.now()}`; }

export default function MindMapPage({ teamId }) {
  const { token } = useAuth();
  const [maps, setMaps] = useState([]);
  const [active, setActive] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editNode, setEditNode] = useState(null);
  const canvasRef = useRef(null);
  const dragged = useRef(null);
  const offset = useRef({ x: 0, y: 0 });

  function fetchMaps() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps/mindmap/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setMaps(d); }).catch(() => {});
  }

  useEffect(() => { fetchMaps(); }, [teamId, token]);

  function parse(item) { return typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {}); }

  async function handleCreate(e) {
    e.preventDefault();
    const res = await fetch(`/api/studio/teams/${teamId}/apps/mindmap/data`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemKey: Date.now().toString(), data: { title: newTitle, nodes: [{ id: nuid(), label: 'Central Idea', x: 300, y: 200, color: '#4af' }] } }),
    });
    if (res.ok) { setShowCreate(false); setNewTitle(''); fetchMaps(); }
  }

  function openMap(map) {
    setActive(map); const d = parse(map);
    setNodes(d.nodes || []); setEditNode(null);
  }

  async function saveNodes(newNodes) {
    if (!active) return;
    await fetch(`/api/studio/apps/data/${active.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ appData: { title: parse(active).title, nodes: newNodes } }) });
    setNodes(newNodes);
  }

  function addNode() {
    const newNode = { id: nuid(), label: 'Idea', x: 100 + Math.random() * 400, y: 100 + Math.random() * 300, color: ['#4af', '#f84', '#4c6', '#e4e', '#fa4'][Math.floor(Math.random() * 5)] };
    const next = [...nodes, newNode];
    saveNodes(next);
  }

  function handleMouseDown(e, node) {
    dragged.current = node;
    offset.current = { x: e.clientX - node.x, y: e.clientY - node.y };
  }

  function handleMouseMove(e) {
    if (!dragged.current) return;
    const node = dragged.current;
    const next = nodes.map(n => n.id === node.id ? { ...n, x: e.clientX - offset.current.x, y: e.clientY - offset.current.y } : n);
    setNodes(next);
  }

  function handleMouseUp() {
    if (dragged.current) {
      saveNodes(nodes);
      dragged.current = null;
    }
  }

  function startEdit(node) {
    setEditNode(node); setEditLabel(node.label);
  }

  async function saveEdit() {
    if (!editNode) return;
    const next = nodes.map(n => n.id === editNode.id ? { ...n, label: editLabel } : n);
    await saveNodes(next); setEditNode(null);
  }

  async function deleteNode(id) {
    await saveNodes(nodes.filter(n => n.id !== id));
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-diagram_project" /> Mind Map</h1>
        <div className="studio-page-actions">
          <button className="studio-btn studio-btn--ghost" onClick={addNode} disabled={!active}><span className="nf nf-fa-plus" /> Node</button>
          <button className="studio-btn studio-btn--primary" onClick={() => setShowCreate(true)}><span className="nf nf-fa-plus" /> New Map</button>
        </div>
      </div>
      <div className="studio-docs-layout">
        <div className="studio-docs-sidebar">
          {maps.map(m => (
            <button key={m.id} className={`studio-docs-item ${active?.id === m.id ? 'studio-docs-item--active' : ''}`} onClick={() => openMap(m)}>
              <span className="nf nf-fa-diagram_project" />
              <div><strong>{parse(m).title}</strong><span className="studio-text-muted">{m.author_name}</span></div>
            </button>
          ))}
        </div>
        <div className="studio-docs-content-wrap">
          {active ? (
            <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 500, overflow: 'hidden', cursor: 'grab' }} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {nodes.map(n => nodes.filter(o => o.parentId === n.id).map(child => (
                  <line key={`${n.id}-${child.id}`} x1={n.x + 75} y1={n.y + 25} x2={child.x + 75} y2={child.y + 25} stroke="#555" strokeWidth={2} />
                )))}
              </svg>
              {nodes.map(n => (
                <div key={n.id} className="s-mindmap-node" style={{ left: n.x, top: n.y, borderColor: n.color || '#4af' }}
                  onMouseDown={e => handleMouseDown(e, n)}
                  onDoubleClick={() => startEdit(n)}
                >
                  {editNode?.id === n.id ? (
                    <input className="studio-input" value={editLabel} onChange={e => setEditLabel(e.target.value)} onBlur={saveEdit} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); }} autoFocus style={{ width: 80, padding: 0, border: 'none', background: 'transparent', textAlign: 'center' }} />
                  ) : (
                    <span>{n.label}</span>
                  )}
                  <button className="studio-btn studio-btn--icon" onClick={(e) => { e.stopPropagation(); deleteNode(n.id); }} style={{ position: 'absolute', top: -8, right: -8, minWidth: 'auto', padding: 0, width: 20, height: 20, fontSize: 10, background: 'var(--color-surface)', borderRadius: '50%', border: '1px solid var(--color-border)' }}><span className="nf nf-fa-xmark" /></button>
                </div>
              ))}
            </div>
          ) : (
            <div className="studio-empty"><span className="nf nf-fa-diagram_project studio-empty-icon" /><h3>Select a map</h3></div>
          )}
        </div>
      </div>
      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal"><div className="studio-modal-header"><h2>New Mind Map</h2><button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}><span className="nf nf-fa-xmark" /></button></div>
            <form onSubmit={handleCreate} className="studio-form"><label className="studio-label">Title <input className="studio-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} required autoFocus /></label><div className="studio-form-actions"><button type="submit" className="studio-btn studio-btn--primary">Create</button></div></form>
          </div>
        </>
      )}
    </div>
  );
}
