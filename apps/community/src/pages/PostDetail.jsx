import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { navigateTo } from '../App.jsx';
import { marked } from 'marked';
import TagBadge from '../components/TagBadge.jsx';
import LikeButton from '../components/LikeButton.jsx';
import BookmarkButton from '../components/BookmarkButton.jsx';
import ReactionBar from '../components/ReactionBar.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';
import PollDisplay from '../components/PollDisplay.jsx';
import CommentForm from '../components/CommentForm.jsx';
import CommentItem from '../components/CommentItem.jsx';
import ReportButton from '../components/ReportButton.jsx';
import ShareButton from '../components/ShareButton.jsx';
import CollectButton from '../components/CollectButton.jsx';
import EditHistoryModal from '../components/EditHistoryModal.jsx';
import SkeletonCard from '../components/skeletons/SkeletonCard.jsx';

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

export default function PostDetail({ id }) {
  const { user, token } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');

    fetch(`/api/community/posts/${id}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Post not found');
        return r.json();
      })
      .then((d) => {
        setPost(d.post);
        setComments(d.comments || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, retryCount]);

  function handleCommentAdded(comment) {
    setComments((prev) => [...prev, comment]);
    setPost((prev) => prev ? { ...prev, comment_count: prev.comment_count + 1 } : prev);
    showToast('Comment added!', 'success');
  }

  function handleCommentDeleted(commentId) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setPost((prev) => prev ? { ...prev, comment_count: Math.max(0, prev.comment_count - 1) } : prev);
  }

  function handleCommentUpdated(updatedComment) {
    setComments((prev) => prev.map((c) => c.id === updatedComment.id ? updatedComment : c));
  }

  async function handleDeletePost() {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/community/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      showToast('Post deleted', 'info');
      setDeleted(true);
    } catch {
      showToast('Failed to delete post', 'error');
      setDeleting(false);
    }
  }

  // useMemo must be before any early returns to keep hook count stable
  const renderedBody = useMemo(() => {
    if (!post?.body) return '';
    try {
      // Convert @mentions to markdown links before rendering
      const withMentions = post.body.replace(
        /@([a-zA-Z0-9_-]+)/g,
        '[@$1](/profile/$1)'
      );
      return marked.parse(withMentions, { breaks: true });
    } catch {
      return post.body;
    }
  }, [post?.body]);

  if (deleted) {
    return (
      <div className="community-empty p-12 px-4 text-center">
        <span className="nf nf-fa-trash_can text-4xl opacity-40" />
        <h3>Post deleted</h3>
        <p>This post has been deleted.</p>
        <button className="community-btn community-btn--primary" onClick={() => navigateTo('/')}>
          Back to Feed
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-xl) var(--space-md)' }}>
        <SkeletonCard count={1} />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="community-empty p-12 px-4 text-center">
        <span className="nf nf-fa-circle_exclamation text-4xl opacity-40" />
        <h3>{error || 'Post not found'}</h3>
        <div className="flex gap-3 justify-center mt-4">
          <button className="community-btn community-btn--ghost" onClick={() => setRetryCount(c => c + 1)}>
            <span className="nf nf-fa-rotate" /> Retry
          </button>
          <button className="community-btn community-btn--primary" onClick={() => navigateTo('/')}>
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

	  const isOwner = user && (user.id === post.user_id || user.role_id === 1);
	  const tags = post.tags
	    ? post.tags.split(',').map((t) => t.trim()).filter(Boolean)
	    : [];

	  return (
    <div className="community-post-detail">
      <button className="community-btn community-btn--ghost community-back-btn" onClick={() => navigateTo('/')}>
        <span className="nf nf-fa-arrow_left" /> Back to Feed
      </button>

      <article className="community-post-full">
        <div className="community-post-full-header">
          <div className="community-post-full-author">
            <div className="community-avatar community-avatar--md">
              <UserAvatar user={{ username: post.author_username, display_name: post.author_display_name, avatar_url: post.author_avatar_url }} />
            </div>
            <div>
              <span
                className="community-post-full-author-name cursor-pointer"
                onClick={() => navigateTo(`/profile/${post.author_username}`)}
              >
                {post.author_display_name || post.author_username || 'Unknown'}
                {post.author_is_verified === 1 && (
                  <span className={`nf nf-md-check_decagram community-verified-badge${post.author_role_id !== 2 ? ' community-verified-badge--gold' : ''}`} title={post.author_role_id !== 2 ? 'Member Verified Account' : 'Community Verified Account'} />
                )}
              </span>
              <span className="community-post-full-date">{timeAgo(post.created_at)}</span>
              {post.created_at !== post.updated_at && (
                <span className="community-post-full-edited">(edited)</span>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="community-post-full-actions">
              <button
                className="community-btn community-btn--icon"
                onClick={() => navigateTo(`/edit/${post.id}`)}
                aria-label="Edit post"
              >
                <span className="nf nf-fa-pen" />
              </button>
              <button
                className="community-btn community-btn--icon"
                onClick={() => setShowHistory(true)}
                aria-label="Edit history"
              >
                <span className="nf nf-fa-clock_rotate_left" />
              </button>
              <button
                className="community-btn community-btn--icon community-btn--danger"
                onClick={handleDeletePost}
                disabled={deleting}
                aria-label="Delete post"
              >
                <span className="nf nf-fa-trash_can" />
              </button>
            </div>
          )}
          {!isOwner && (
            <ReportButton targetType="post" targetId={post.id} />
          )}
        </div>

        <h1 className="community-post-full-title">{post.title}</h1>

        <div
          className="community-post-full-body community-markdown-body"
          dangerouslySetInnerHTML={{ __html: renderedBody }}
        />

        <PollDisplay postId={post.id} />

        {tags.length > 0 && (
          <div className="community-post-full-tags">
            {tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}

        <ReactionBar postId={post.id} reactions={post.reactions} userReactions={post.user_reactions} />

        <div className="community-post-full-stats">
          <LikeButton
            targetType="post"
            targetId={post.id}
            count={post.like_count}
            liked={post.liked}
          />
          <BookmarkButton postId={post.id} bookmarked={post.bookmarked} />
          <ShareButton
            postId={post.id}
            postTitle={post.title}
            postBody={post.body}
            authorUsername={post.author_username}
            authorDisplayName={post.author_display_name}
            authorAvatarUrl={post.author_avatar_url}
            authorIsVerified={post.author_is_verified}
            tags={post.tags}
            createdAt={post.created_at}
            commentCount={post.comment_count}
          />
          <CollectButton postId={post.id} />
        </div>
      </article>

      {showHistory && <EditHistoryModal postId={post.id} onClose={() => setShowHistory(false)} />}

      {/* ─── Comments Section ─── */}
      <section className="community-comments-section">
        <h2 className="community-section-title">
          <span className="nf nf-fa-comment" /> Comments ({comments.length})
        </h2>

        <CommentForm postId={id} onCommentAdded={handleCommentAdded} />

        {comments.length === 0 ? (
          <div className="community-empty py-8">
            <p>No comments yet. Be the first!</p>
          </div>
        ) : (
          <div className="community-comments-list">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onDeleted={handleCommentDeleted}
                onUpdated={handleCommentUpdated}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
