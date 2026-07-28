import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';
import CommunityLayout from '../components/CommunityLayout.jsx';
import RichTextEditor from '@kumocoders/ui/RichTextEditor.jsx';

export default function EditPost({ id }) {
  const { user, token } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('published');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    fetch(`/api/community/posts/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Post not found');
        return r.json();
      })
      .then((d) => {
        const post = d.post;
        if (!user || (post.user_id !== user.id && user.role_id !== 1)) {
          navigateTo('/');
          return;
        }
        setTitle(post.title);
        setBody(post.body);
        setTags(post.tags || '');
        setStatus(post.status || 'published');
      })
      .catch(() => navigateTo('/'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e, newStatus) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/community/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          tags: tags.trim() || null,
          status: newStatus || status,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update post');
      }

      navigateTo(newStatus === 'draft' ? '/' : `/post/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <CommunityLayout>
        <div className="community-loading">
          <div className="community-loading-spinner" />
          <p>Loading post...</p>
        </div>
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <div className="community-form-page">
        <button className="community-btn community-btn--ghost community-back-btn" onClick={() => navigateTo(status === 'draft' ? '/' : `/post/${id}`)}>
          <span className="nf nf-fa-arrow_left" /> Back
        </button>

        <div className="community-form-card">
          <h1>{status === 'draft' ? 'Edit Draft' : 'Edit Post'}</h1>
          {status === 'draft' && <p className="community-text-muted text-sm mb-space-md">This post is still a draft.</p>}

          <form onSubmit={(e) => handleSubmit(e, status === 'draft' ? 'published' : status)}>
            {error && <div className="community-error">{error}</div>}

            <div className="community-form-group">
              <label htmlFor="edit-title">Title</label>
              <input
                id="edit-title"
                type="text"
                className="community-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="community-form-group">
              <label>Body</label>
              <RichTextEditor
                placeholder="Share your thoughts..."
                value={body}
                onChange={setBody}
              />
            </div>

            <div className="community-form-group">
              <label htmlFor="edit-tags">Tags</label>
              <input
                id="edit-tags"
                type="text"
                className="community-input"
                placeholder="comma, separated, tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <span className="community-form-hint">Separate tags with commas</span>
            </div>

            <div className="community-form-actions">
              <button
                type="button"
                className="community-btn community-btn--ghost"
                disabled={submitting || !title.trim() || !body.trim()}
                onClick={(e) => handleSubmit(e, 'draft')}
              >
                {submitting ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="submit"
                className="community-btn community-btn--primary"
                disabled={submitting || !title.trim() || !body.trim()}
              >
                {submitting ? 'Saving...' : status === 'draft' ? 'Publish' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </CommunityLayout>
  );
}
