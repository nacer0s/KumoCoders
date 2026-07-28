import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { navigateTo } from '../App.jsx';
import CommunityLayout from '../components/CommunityLayout.jsx';
import PollCreator from '../components/PollCreator.jsx';
import RichTextEditor from '@kumocoders/ui/RichTextEditor.jsx';

export default function NewPost() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [poll, setPoll] = useState(null);

  async function handleSubmit(e, status = 'published') {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          tags: tags.trim() || null,
          poll: poll || undefined,
          status,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create post');
      }

      const data = await res.json();
      showToast(status === 'draft' ? 'Draft saved!' : 'Post created!', 'success');
      navigateTo(status === 'draft' ? '/' : `/post/${data.post.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CommunityLayout>
      <div className="community-form-page">
        <button className="community-btn community-btn--ghost community-back-btn" onClick={() => navigateTo('/')}>
          <span className="nf nf-fa-arrow_left" /> Back to Feed
        </button>

        <div className="community-form-card">
          <h1>Create New Post</h1>

          <form onSubmit={(e) => handleSubmit(e, 'published')}>
            {error && <div className="community-error">{error}</div>}

            <div className="community-form-group">
              <label htmlFor="post-title">Title</label>
              <input
                id="post-title"
                type="text"
                className="community-input"
                placeholder="What's on your mind?"
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
              <label htmlFor="post-tags">Tags</label>
              <input
                id="post-tags"
                type="text"
                className="community-input"
                placeholder="comma, separated, tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <span className="community-form-hint">Separate tags with commas</span>
            </div>

            <PollCreator onPollChange={setPoll} />

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
                {submitting ? 'Posting...' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </CommunityLayout>
  );
}
