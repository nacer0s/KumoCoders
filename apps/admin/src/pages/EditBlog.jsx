import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';
import AdminLayout from '../components/AdminLayout.jsx';

export default function EditBlog({ postId }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [publishedAt, setPublishedAt] = useState('');

  useEffect(() => {
    if (!token || !postId) return;
    setLoading(true);
    fetch(`/api/blog/admin/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Blog post not found');
        const data = await res.json();
        const p = data.post || data;
        setTitle(p.title);
        setSlug(p.slug);
        setExcerpt(p.excerpt || '');
        setBody(p.body || '');
        setImageUrl(p.image_url || '');
        setPublishedAt(p.published_at || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, postId]);

  function generateSlug() {
    setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await fetch(`/api/blog/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          excerpt: excerpt.trim(),
          body: body.trim(),
          image_url: imageUrl.trim(),
          published_at: publishedAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setSuccess('Blog post saved!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Edit Blog Post">
        <div className="admin-loading"><div className="admin-loading-spinner" /><p>Loading...</p></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Edit: ${title || 'Blog Post'}`}>
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
                Slug <button type="button" onClick={generateSlug} className="ml-space-sm text-font-size-xs bg-transparent border-none text-text-muted cursor-pointer underline">Generate</button>
              </label>
              <input type="text" className="admin-input" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
            <div className="admin-input-group col-span-2">
              <label className="admin-label">Excerpt</label>
              <textarea className="admin-textarea" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
            </div>
            <div className="admin-input-group col-span-2">
              <label className="admin-label">Body</label>
              <textarea className="admin-textarea" value={body} onChange={(e) => setBody(e.target.value)} rows={8} required />
            </div>
            <div className="admin-input-group">
              <label className="admin-label">Image URL</label>
              <input type="url" className="admin-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="admin-input-group">
              <label className="admin-label">Published At</label>
              <input type="datetime-local" className="admin-input" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
            </div>
          </div>
          <div className="admin-form-actions">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => navigateTo('/admin/blog')}>
              <span className="nf nf-fa-arrow_left" /> Back
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
