import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import PostCard from '../components/PostCard.jsx';

export default function CollectionsPage() {
  const { token } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetch('/api/community/collections', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setCollections(d.collections || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  function selectCollection(col) {
    setSelected(col);
    setPostsLoading(true);
    fetch(`/api/community/collections/${col.id}/posts`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));
  }

  async function createCollection() {
    if (!newName.trim()) return;
    const res = await fetch('/api/community/collections', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }) });
    if (res.ok) {
      const col = (await res.json()).collection;
      setCollections((prev) => [...prev, col]);
      setNewName(''); setNewDesc(''); setShowCreate(false);
    }
  }

  async function deleteCollection(id) {
    if (!confirm('Delete this collection?')) return;
    await fetch(`/api/community/collections/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setCollections((prev) => prev.filter((c) => c.id !== id));
    if (selected?.id === id) { setSelected(null); setPosts([]); }
  }

  if (loading) {
    return <div className="community-loading"><div className="community-loading-spinner" /><p>Loading collections...</p></div>;
  }

  return (
    <div className="community-page">
      <div className="community-page-header">
        <h1><span className="nf nf-fa-folder" /> My Collections</h1>
        <button className="community-btn community-btn--primary" onClick={() => setShowCreate(true)}>
          <span className="nf nf-fa-plus" /> New Collection
        </button>
      </div>

      {showCreate && (
        <div className="community-card">
          <input className="community-input" placeholder="Collection name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input className="community-input" placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <div className="community-form-actions">
            <button className="community-btn community-btn--primary" onClick={createCollection}>Create</button>
            <button className="community-btn community-btn--ghost" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {collections.length === 0 ? (
        <div className="community-empty">
          <span className="nf nf-fa-folder_open community-empty-icon" />
          <h3>No collections yet</h3>
          <p>Save posts into collections to organize them.</p>
        </div>
      ) : (
        <div className="community-collections-layout">
          <div className="community-collections-sidebar">
            {collections.map((col) => (
              <div
                key={col.id}
                className={`community-list-item ${selected?.id === col.id ? 'community-list-item--active' : ''}`}
                onClick={() => selectCollection(col)}
              >
                <div className="community-collection-info">
                  <div className="community-collection-name">{col.name}</div>
                  {col.description && <div className="community-collection-desc">{col.description}</div>}
                </div>
                <button className="community-btn community-btn--icon community-btn--danger community-btn--sm" onClick={(e) => { e.stopPropagation(); deleteCollection(col.id); }} aria-label="Delete">
                  <span className="nf nf-fa-trash_can" />
                </button>
              </div>
            ))}
          </div>
          <div className="community-collections-content">
            {!selected ? (
              <div className="community-empty"><p>Select a collection to view its posts</p></div>
            ) : postsLoading ? (
              <div className="community-loading"><div className="community-loading-spinner" /></div>
            ) : posts.length === 0 ? (
              <div className="community-empty"><p>No posts in this collection</p></div>
            ) : (
              <div className="community-post-list">
                {posts.map((post) => <PostCard key={post.id} post={post} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
