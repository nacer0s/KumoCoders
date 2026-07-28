import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { navigateTo } from '../App.jsx';
import LikeButton from './LikeButton.jsx';
import ReportButton from './ReportButton.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';
import MentionText from '../utils/mentionParser.jsx';

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CommentItem({ comment, onDeleted, onUpdated }) {
  const { user, token } = useAuth();
  const isOwner = user && (user.id === comment.user_id || user.role_id === 1);
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this comment?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/community/comments/${comment.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      if (onDeleted) onDeleted(comment.id);
    } catch {
      setDeleting(false);
    }
  }

  function handleEdit() {
    setEditBody(comment.body);
    setEditing(true);
  }

  function handleCancelEdit() {
    setEditing(false);
    setEditBody(comment.body);
  }

  async function handleSaveEdit() {
    if (!editBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/community/comments/${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: editBody.trim() }),
      });
      if (!res.ok) throw new Error('Edit failed');
      const data = await res.json();
      setEditing(false);
      if (onUpdated) onUpdated(data.comment);
      showToast('Comment updated', 'success');
    } catch {
      showToast('Failed to update comment', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="community-comment-item">
      <div className="community-comment-item-header">
        <div className="community-avatar community-avatar--xs">
          <UserAvatar user={{ username: comment.author_username, display_name: comment.author_display_name, avatar_url: comment.author_avatar_url }} />
        </div>
        <div className="community-comment-item-author">
          <span
            className="community-comment-item-name cursor-pointer"
            onClick={() => navigateTo(`/profile/${comment.author_username}`)}
          >
            {comment.author_display_name || comment.author_username || 'Unknown'}
            {comment.author_is_verified === 1 && (
              <span className={`nf nf-md-check_decagram community-verified-badge${comment.author_role_id !== 2 ? ' community-verified-badge--gold' : ''}`} title={comment.author_role_id !== 2 ? 'Member Verified Account' : 'Community Verified Account'} />
            )}
          </span>
          <span className="community-comment-item-date">{timeAgo(comment.created_at)}</span>
        </div>
        <div className="community-comment-item-header-actions">
          {isOwner && !editing && (
            <>
              <button
                className="community-btn community-btn--icon"
                onClick={handleEdit}
                aria-label="Edit comment"
                title="Edit"
              >
                <span className="nf nf-fa-pen" />
              </button>
              <button
                className="community-btn community-btn--icon community-btn--danger"
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Delete comment"
              >
                <span className="nf nf-fa-trash_can" />
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="community-comment-item-edit">
          <textarea
            className="community-textarea"
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className="community-comment-item-edit-actions">
            <button
              className="community-btn community-btn--primary"
              onClick={handleSaveEdit}
              disabled={submitting || !editBody.trim()}
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
            <button
              className="community-btn community-btn--ghost"
              onClick={handleCancelEdit}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="community-comment-item-body">
          <MentionText text={comment.body} />
        </div>
      )}

      {!editing && (
        <div className="community-comment-item-actions">
          <LikeButton
            targetType="comment"
            targetId={comment.id}
            count={comment.like_count}
            liked={comment.liked}
            size="sm"
          />
          <ReportButton targetType="comment" targetId={comment.id} />
        </div>
      )}
    </div>
  );
}
