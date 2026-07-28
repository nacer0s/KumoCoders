import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';
import AdminLayout from '../components/AdminLayout.jsx';
import SearchFilterBar from '../components/SearchFilterBar.jsx';

export default function ProjectList() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchProjects();
  }, [token]);

  function fetchProjects() {
    setLoading(true);
    fetch('/api/projects/admin/all', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch projects');
        return res.json();
      })
      .then((data) => {
        setProjects(data.projects || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function handleEdit(id) {
    navigateTo(`/admin/projects/edit/${id}`);
  }

  async function handleDelete(project) {
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      setSuccess(`"${project.title}" deleted`);
      fetchProjects();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newTitle.trim()) { setError('Title is required'); return; }

    let slug = newSlug.trim();
    if (!slug) {
      slug = newTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug,
          description: newDesc.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project');
      setSuccess(`"${newTitle}" created!`);
      setShowCreate(false);
      setNewTitle('');
      setNewSlug('');
      setNewDesc('');
      fetchProjects();
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
    <AdminLayout title="Projects">
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <div className="admin-card glass">
        <div className="admin-card-header flex items-center justify-between">
          <div>
            <h2>All Projects</h2>
            <p className="admin-text-muted">Manage your project showcase portfolio.</p>
          </div>
          {!showCreate && (
            <button className="admin-btn admin-btn--glass" onClick={() => { setShowCreate(true); setError(''); setSuccess(''); }}>
              <span className="nf nf-fa-plus" /> New Project
            </button>
          )}
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="admin-form mb-space-xl">
            <div className="flex gap-space-md items-end flex-wrap">
              <div className="admin-input-group flex-[1_1_200px] mb-0">
                <label className="admin-label">Title</label>
                <input type="text" className="admin-input" placeholder="Project title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required autoFocus />
              </div>
              <div className="admin-input-group flex-[1_1_200px] mb-0">
                <label className="admin-label">Slug (optional)</label>
                <input type="text" className="admin-input" placeholder="auto-generated" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
              </div>
              <div className="admin-input-group flex-[1_1_250px] mb-0">
                <label className="admin-label">Short Description</label>
                <input type="text" className="admin-input" placeholder="Brief description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              </div>
              <div className="flex gap-space-sm pb-[2px]">
                <button type="submit" className="admin-btn admin-btn--primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => { setShowCreate(false); setNewTitle(''); setNewSlug(''); setNewDesc(''); }}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {loading && (
          <div className="admin-loading">
            <div className="admin-loading-spinner" />
            <p>Loading projects...</p>
          </div>
        )}

        {!loading && projects.length === 0 && (
          <p className="admin-text-muted">No projects yet. Create your first one!</p>
        )}

        {!loading && projects.length > 0 && (
          <SearchFilterBar
            data={projects}
            searchFields={['title', 'slug', 'tech_stack']}
            placeholder="Search by title, slug, or tech stack…"
            filters={[
              {
                label: 'All Statuses',
                key: 'status',
                options: [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'archived', label: 'Archived' },
                ],
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
                  <p className="admin-text-muted">No projects match your search.</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Title</th>
                          <th>Status</th>
                          <th>Featured</th>
                          <th>Tech Stack</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p) => (
                          <tr key={p.id}>
                            <td><code>{p.sort_order}</code></td>
                            <td><strong>{p.title}</strong><br /><span className="text-font-size-xs text-text-muted">{p.slug}</span></td>
                            <td><span className={`admin-role-badge ${p.status === 'active' ? 'admin-role-badge--admin' : 'admin-role-badge--member'}`}>{p.status}</span></td>
                            <td>{p.featured ? <span className="nf nf-fa-star text-warning" /> : '—'}</td>
                            <td className="admin-cell-truncate">{p.tech_stack || '—'}</td>
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
