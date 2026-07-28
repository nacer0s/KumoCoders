import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';
import AdminLayout from '../components/AdminLayout.jsx';
import SearchFilterBar from '../components/SearchFilterBar.jsx';

export default function BlogList() {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchPosts();
  }, [token]);

  function fetchPosts() {
    setLoading(true);
    fetch('/api/blog/admin/all', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch blog posts');
        return res.json();
      })
      .then((data) => setPosts(data.posts || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function handleEdit(id) {
    navigateTo(`/admin/blog/edit/${id}`);
  }

  async function handleDelete(post) {
    if (!confirm(`Delete "${post.title}"?`)) return;
    try {
      const res = await fetch(`/api/blog/${post.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      setSuccess(`"${post.title}" deleted`);
      fetchPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) { setError('Title and body are required'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/blog', {
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
      fetchPosts();
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
    <AdminLayout title="Blog Posts">
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <div className="admin-card glass">
        <div className="admin-card-header flex items-center justify-between">
          <div>
            <h2>All Posts</h2>
            <p className="admin-text-muted">Manage your blog posts.</p>
          </div>
          {!showCreate && (
            <button className="admin-btn admin-btn--glass" onClick={() => { setShowCreate(true); setError(''); setSuccess(''); }}>
              <span className="nf nf-fa-plus" /> New Post
            </button>
          )}
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="admin-form mb-space-xl">
            <div className="flex gap-space-md items-end flex-wrap">
              <div className="admin-input-group flex-[1_1_200px] mb-0">
                <label className="admin-label">Title</label>
                <input type="text" className="admin-input" placeholder="Post title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required autoFocus />
              </div>
              <div className="admin-input-group flex-[1_1_300px] mb-0">
                <label className="admin-label">Body (minimal)</label>
                <input type="text" className="admin-input" placeholder="Post body" value={newBody} onChange={(e) => setNewBody(e.target.value)} required />
              </div>
              <div className="flex gap-space-sm pb-[2px]">
                <button type="submit" className="admin-btn admin-btn--primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => { setShowCreate(false); setNewTitle(''); setNewBody(''); }}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {loading && (
          <div className="admin-loading">
            <div className="admin-loading-spinner" />
            <p>Loading posts...</p>
          </div>
        )}

        {!loading && posts.length === 0 && (
          <p className="admin-text-muted">No blog posts yet.</p>
        )}

        {!loading && posts.length > 0 && (
          <SearchFilterBar
            data={posts}
            searchFields={['title', 'slug']}
            placeholder="Search by title or slug…"
            filters={[
              {
                label: 'Status',
                key: 'published_at',
                options: [
                  { value: '__published__', label: 'Published' },
                  { value: '__draft__', label: 'Drafts' },
                ],
                filterMatch: (item, val) => {
                  if (val === '__published__') return !!item.published_at
                  if (val === '__draft__') return !item.published_at
                  return true
                },
              },
            ]}
          >
            {(filtered) => (
              <>
                {filtered.length === 0 ? (
                  <p className="admin-text-muted">No posts match your search.</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Published</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p) => (
                          <tr key={p.id}>
                            <td><strong>{p.title}</strong><br /><span className="text-font-size-xs text-text-muted">{p.slug}</span></td>
                            <td>{p.published_at ? formatDate(p.published_at) : <span className="text-warning">Draft</span>}</td>
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
