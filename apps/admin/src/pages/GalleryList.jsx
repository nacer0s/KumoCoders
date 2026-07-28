import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';
import AdminLayout from '../components/AdminLayout.jsx';
import SearchFilterBar from '../components/SearchFilterBar.jsx';

export default function GalleryList() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newImage, setNewImage] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchItems();
  }, [token]);

  function fetchItems() {
    setLoading(true);
    fetch('/api/gallery/admin/all', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch gallery items');
        return res.json();
      })
      .then((data) => setItems(data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function handleEdit(id) {
    navigateTo(`/admin/gallery/edit/${id}`);
  }

  async function handleDelete(item) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    try {
      const res = await fetch(`/api/gallery/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      setSuccess(`"${item.title}" deleted`);
      fetchItems();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newImage.trim()) { setError('Title and image URL are required'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle.trim(), image_url: newImage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setSuccess(`"${newTitle}" created!`);
      setShowCreate(false);
      setNewTitle('');
      setNewImage('');
      fetchItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <AdminLayout title="Gallery">
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <div className="admin-card glass">
        <div className="admin-card-header flex items-center justify-between">
          <div>
            <h2>All Items</h2>
            <p className="admin-text-muted">Manage your gallery showcase.</p>
          </div>
          {!showCreate && (
            <button className="admin-btn admin-btn--glass" onClick={() => { setShowCreate(true); setError(''); setSuccess(''); }}>
              <span className="nf nf-fa-plus" /> New Item
            </button>
          )}
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="admin-form mb-space-xl">
            <div className="flex gap-space-md items-end flex-wrap">
              <div className="admin-input-group flex-[1_1_200px] mb-0">
                <label className="admin-label">Title</label>
                <input type="text" className="admin-input" placeholder="Item title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required autoFocus />
              </div>
              <div className="admin-input-group flex-[1_1_300px] mb-0">
                <label className="admin-label">Image URL</label>
                <input type="url" className="admin-input" placeholder="https://..." value={newImage} onChange={(e) => setNewImage(e.target.value)} required />
              </div>
              <div className="flex gap-space-sm pb-[2px]">
                <button type="submit" className="admin-btn admin-btn--primary" disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => { setShowCreate(false); setNewTitle(''); setNewImage(''); }}>Cancel</button>
              </div>
            </div>
          </form>
        )}

        {loading && (
          <div className="admin-loading"><div className="admin-loading-spinner" /><p>Loading...</p></div>
        )}

        {!loading && items.length === 0 && (
          <p className="admin-text-muted">No gallery items yet.</p>
        )}

        {!loading && items.length > 0 && (
          <SearchFilterBar
            data={items}
            searchFields={['title', 'category']}
            placeholder="Search by title or category…"
            filters={[
              {
                label: 'All Categories',
                key: 'category',
              },
              {
                label: 'Featured',
                key: 'featured',
                options: [
                  { value: '1', label: 'Featured' },
                  { value: '0', label: 'Not Featured' },
                ],
              },
            ]}
          >
            {(filtered) => (
              <>
                {filtered.length === 0 ? (
                  <p className="admin-text-muted">No items match your search.</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Preview</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Featured</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((item) => (
                          <tr key={item.id}>
                            <td>
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.title} className="w-12 h-9 object-cover rounded-radius-sm" />
                              ) : '—'}
                            </td>
                            <td><strong>{item.title}</strong></td>
                            <td>{item.category}</td>
                            <td>{item.featured ? <span className="nf nf-fa-star text-warning" /> : '—'}</td>
                            <td>{formatDate(item.created_at)}</td>
                            <td>
                              <div className="flex gap-space-sm">
                                <button className="admin-btn admin-btn--glass px-space-md py-1.5 text-font-size-sm" onClick={() => handleEdit(item.id)}>
                                  <span className="nf nf-fa-edit" /> Edit
                                </button>
                                <button className="admin-btn px-space-md py-1.5 text-font-size-sm bg-red-500/10 text-error border border-red-500/20" onClick={() => handleDelete(item)}>
                                  <span className="nf nf-fa-trash_can" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </SearchFilterBar>
        )}
      </div>
    </AdminLayout>
  );
}
