import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';
import MentionTextarea from './MentionTextarea.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';

export default function CommentForm({ postId, onCommentAdded }) {
  const { user, token } = useAuth();
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="community-comment-login-prompt">
        <span className="nf nf-fa-message" />
        <span>
          <button className="community-link-btn" onClick={() => navigateTo('/login')}>Sign in</button>
          {' '}or{' '}
          <button className="community-link-btn" onClick={() => navigateTo('/register')}>register</button>
          {' '}to leave a comment
        </span>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: body.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to add comment');
      }

      const data = await res.json();
      setBody('');
      if (onCommentAdded) onCommentAdded(data.comment);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="community-comment-form" onSubmit={handleSubmit}>
      <div className="community-comment-form-header">
        <div className="community-avatar community-avatar--xs">
          <UserAvatar user={user} />
        </div>
        <span className="community-comment-form-name">{user.display_name || user.username}</span>
      </div>

      <MentionTextarea
        className="community-textarea"
        placeholder="Write a comment... (@ to mention)"
        value={body}
        onChange={setBody}
        rows={3}
        required
      />

      {error && <div className="community-error">{error}</div>}

      <div className="community-comment-form-actions">
        <button
          type="submit"
          className="community-btn community-btn--primary"
          disabled={submitting || !body.trim()}
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
}
