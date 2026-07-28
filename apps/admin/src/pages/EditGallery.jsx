import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';
import AdminLayout from '../components/AdminLayout.jsx';

export default function EditGallery({ itemId }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('other');
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    if (!token || !itemId) return;
    setLoading(true);
    fetch(`/api/gallery/admin/${itemId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Gallery item not found');
        const data = await res.json();
        const item = data.item || data;
        setTitle(item.title);
        setSlug(item.slug);
        setDescription(item.description || '');
        setImageUrl(item.image_url || '');
        setCategory(item.category || 'other');
        setFeatured(!!item.featured);
        setSortOrder(item.sort_order || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, itemId]);

  function generateSlug() {
    setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await fetch(`/api/gallery/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          image_url: imageUrl.trim(),
          category,
          featured,
          sort_order: parseInt(sortOrder) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setSuccess('Gallery item saved!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Edit Gallery Item">
        <div className="admin-loading"><div className="admin-loading-spinner" /><p>Loading...</p></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Edit: ${title || 'Gallery Item'}`}>
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
              <label className="admin-label">Description</label>
              <textarea className="admin-textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="admin-input-group col-span-2">
              <label className="admin-label">Image URL</label>
              <input type="url" className="admin-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." required />
              {imageUrl && (
                <img src={imageUrl} alt="Preview" className="mt-space-sm max-h-[120px] rounded-radius-sm border border-border" />
              )}
            </div>
            <div className="admin-input-group">
              <label className="admin-label">Category</label>
              <select className="admin-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="photography">Photography</option>
                <option value="other">Other</option>
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
              <span className="admin-checkbox-label">Featured item</span>
            </label>
          </div>
          <div className="admin-form-actions">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => navigateTo('/admin/gallery')}>
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
