import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';
import AdminLayout from '../components/AdminLayout.jsx';
import SearchFilterBar from '../components/SearchFilterBar.jsx';

export default function WikiList() {
  const { token } = useAuth();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchPages();
  }, [token]);

  function fetchPages() {
    setLoading(true);
    fetch('/api/wiki/admin/all', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch wiki pages');
        return res.json();
      })
      .then((data) => setPages(data.pages || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function handleEdit(id) {
    navigateTo(`/admin/wiki/edit/${id}`);
  }

  async function handleDelete(page) {
    if (!confirm(`Delete "${page.title}"?`)) return;
    try {
      const res = await fetch(`/api/wiki/${page.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      setSuccess(`"${page.title}" deleted`);
      fetchPages();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) { setError('Title and body are required'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle.trim(), body: newBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setSuccess(`"${newTitle}" created!`);
      setShowCreate(false);
      setNewTitle('');
      setNewBody('');
      fetchPages();
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
    <AdminLayout title="Wiki Pages">
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <div className="admin-card glass">
        <div className="admin-card-header flex items-center justify-between">
          <div>
            <h2>All Wiki Pages</h2>
            <p className="admin-text-muted">Manage your wiki documentation.</p>
          </div>
          {!showCreate && (
            <button className="admin-btn admin-btn--glass" onClick={() => { setShowCreate(true); setError(''); setSuccess(''); }}>
              <span className="nf nf-fa-plus" /> New Page
            </button>
          )}
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="admin-form mb-space-xl">
            <div className="flex gap-space-md items-end flex-wrap">
              <div className="admin-input-group flex-[1_1_200px] mb-0">
                <label className="admin-label">Title</label>
                <input type="text" className="admin-input" placeholder="Page title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required autoFocus />
              </div>
              <div className="admin-input-group flex-[1_1_300px] mb-0">
                <label className="admin-label">Body (minimal)</label>
                <input type="text" className="admin-input" placeholder="Page body" value={newBody} onChange={(e) => setNewBody(e.target.value)} required />
              </div>
              <div className="flex gap-space-sm pb-[2px]">
                <button type="submit" className="admin-btn admin-btn--primary" disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => { setShowCreate(false); setNewTitle(''); setNewBody(''); }}>Cancel</button>
              </div>
            </div>
          </form>
        )}

        {loading && (
          <div className="admin-loading"><div className="admin-loading-spinner" /><p>Loading...</p></div>
        )}

        {!loading && pages.length === 0 && (
          <p className="admin-text-muted">No wiki pages yet.</p>
        )}

        {!loading && pages.length > 0 && (
          <SearchFilterBar
            data={pages}
            searchFields={['title', 'slug', 'category']}
            placeholder="Search by title, slug, or category…"
          >
            {(filtered) => (
              <>
                {filtered.length === 0 ? (
                  <p className="admin-text-muted">No pages match your search.</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p) => (
                          <tr key={p.id}>
                            <td><strong>{p.title}</strong><br /><span className="text-font-size-xs text-text-muted">{p.slug}</span></td>
                            <td>{p.category || '—'}</td>
                            <td>{formatDate(p.created_at)}</td>
                            <td>
                              <div className="flex gap-space-sm">
                                <button className="admin-btn admin-btn--glass px-space-md py-1.5 text-font-size-sm" onClick={() => handleEdit(p.id)}>
                                  <span className="nf nf-fa-edit" /> Edit
                                </button>
                                <button className="admin-btn px-space-md py-1.5 text-font-size-sm bg-red-500/10 text-error border border-red-500/20" onClick={() => handleDelete(p)}>
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
