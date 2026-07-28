import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';
import AdminLayout from '../components/AdminLayout.jsx';

export default function EditProject({ projectId }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [techStack, setTechStack] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [status, setStatus] = useState('active');
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    if (!token || !projectId) return;
    setLoading(true);

    fetch(`/api/projects/admin/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Project not found');
        const data = await res.json();
        // If fetched by ID but route expects slug, we need to find it differently
        const p = data.project || data;
        setTitle(p.title);
        setSlug(p.slug);
        setDescription(p.description || '');
        setLongDescription(p.long_description || '');
        setImageUrl(p.image_url || '');
        setTechStack(p.tech_stack || '');
        setLiveUrl(p.live_url || '');
        setGithubUrl(p.github_url || '');
        setStatus(p.status || 'active');
        setFeatured(!!p.featured);
        setSortOrder(p.sort_order || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, projectId]);

  function generateSlug() {
    const s = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setSlug(s);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          long_description: longDescription.trim(),
          image_url: imageUrl.trim(),
          tech_stack: techStack.trim(),
          live_url: liveUrl.trim(),
          github_url: githubUrl.trim(),
          status,
          featured,
          sort_order: parseInt(sortOrder) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setSuccess('Project saved!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Edit Project">
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading project...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Edit: ${title || 'Project'}`}>
      <div className="admin-card glass">
        {error && <div className="admin-error">{error}</div>}
        {success && <div className="admin-success">{success}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="grid grid-cols-2 gap-space-md gap-x-space-lg">
            <div className="admin-input-group">
              <label className="admin-label">Title</label>
              <input type="text" className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="admin-input-group">
              <label className="admin-label">
                Slug
                <button type="button" onClick={generateSlug} className="ml-space-sm text-font-size-xs bg-transparent border-none text-text-muted cursor-pointer underline">
                  Generate
                </button>
              </label>
              <input type="text" className="admin-input" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>

            <div className="admin-input-group col-span-2">
              <label className="admin-label">Short Description</label>
              <textarea className="admin-textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            <div className="admin-input-group col-span-2">
              <label className="admin-label">Long Description</label>
              <textarea className="admin-textarea" value={longDescription} onChange={(e) => setLongDescription(e.target.value)} rows={5} />
            </div>

            <div className="admin-input-group">
              <label className="admin-label">Image URL</label>
              <input type="url" className="admin-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="admin-input-group">
              <label className="admin-label">Tech Stack</label>
              <input type="text" className="admin-input" value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="React, Node.js, MySQL" />
            </div>

            <div className="admin-input-group">
              <label className="admin-label">Live URL</label>
              <input type="url" className="admin-input" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="admin-input-group">
              <label className="admin-label">GitHub URL</label>
              <input type="url" className="admin-input" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
            </div>

            <div className="admin-input-group">
              <label className="admin-label">Status</label>
              <select className="admin-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="planned">Planned</option>
              </select>
            </div>

            <div className="admin-input-group">
              <label className="admin-label">Sort Order</label>
              <input type="number" className="admin-input" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
          </div>

          <div className="admin-input-group flex-row items-center gap-space-md">
            <label className="admin-checkbox cursor-pointer">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              <span className="admin-checkbox-label">Featured project (shown on homepage)</span>
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => navigateTo('/admin/projects')}>
              <span className="nf nf-fa-arrow_left" /> Back to Projects
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
