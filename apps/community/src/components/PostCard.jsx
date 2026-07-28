import { navigateTo } from '../App.jsx';
import TagBadge from './TagBadge.jsx';
import LikeButton from './LikeButton.jsx';
import BookmarkButton from './BookmarkButton.jsx';
import ReportButton from './ReportButton.jsx';
import ReactionBar from './ReactionBar.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';
import MentionText from '../utils/mentionParser.jsx';
import PollCard from './PollCard.jsx';
import ShareButton from './ShareButton.jsx';
import CollectButton from './CollectButton.jsx';

/** Strip HTML tags and markdown syntax for plain-text previews */
function stripMarkdown(text) {
  return text
    .replace(/<[^>]*>/g, '')          // HTML tags (RichTextEditor output)
    .replace(/^#{1,6}\s+/gm, '')      // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')  // bold
    .replace(/\*(.+?)\*/g, '$1')      // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // inline code / code blocks
    .replace(/```[\s\S]*?```/g, '')   // fenced code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^>\s+/gm, '')           // blockquotes
    .replace(/^[-*+]\s+/gm, '')       // list items
    .replace(/^(\d+)\.\s+/gm, '$1. ') // numbered list items
    .replace(/(\n){3,}/g, '\n\n')     // extra whitespace
    .trim();
}

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

export default function PostCard({ post }) {
  const bodyPreview = (() => {
    const plain = stripMarkdown(post.body);
    return plain.length > 200 ? plain.slice(0, 200) + '...' : plain;
  })();

  const tags = post.tags
    ? post.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <article
      className="community-post-card"
      data-post-id={post.id}
      onClick={() => navigateTo(`/post/${post.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigateTo(`/post/${post.id}`); }}
    >
      <div className="community-post-card-header">
        <div className="community-post-card-author">
          <div className="community-avatar community-avatar--sm">
            <UserAvatar user={{ username: post.author_username, display_name: post.author_display_name, avatar_url: post.author_avatar_url }} />
          </div>
          <div className="community-post-card-author-info">
            <span
              className="community-post-card-author-name cursor-pointer"
              onClick={(e) => { e.stopPropagation(); navigateTo(`/profile/${post.author_username}`); }}
            >
              {post.author_display_name || post.author_username || 'Unknown'}
              {post.author_is_verified === 1 && (
                <span className={`nf nf-md-check_decagram community-verified-badge${post.author_role_id !== 2 ? ' community-verified-badge--gold' : ''}`} title={post.author_role_id !== 2 ? 'Member Verified Account' : 'Community Verified Account'} />
              )}
            </span>
            <span className="community-post-card-date">{timeAgo(post.created_at)}</span>
          </div>
        </div>
        {post.is_pinned === 1 && (
          <span className="community-pinned-badge">
            <span className="nf nf-fa_thumbtack" /> Pinned
          </span>
        )}
      </div>

      <h3 className="community-post-card-title">{post.title}</h3>
      <p className="community-post-card-body">
        <MentionText text={bodyPreview} />
      </p>

      {post.poll && <PollCard poll={post.poll} postId={post.id} />}

      <div className="community-post-card-footer" onClick={(e) => e.stopPropagation()}>
        <div className="community-post-card-tags">
          {tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
        <ReactionBar postId={post.id} reactions={post.reactions} userReactions={post.user_reactions} size="sm" />
        <div className="community-post-card-stats">
          <LikeButton targetType="post" targetId={post.id} count={post.like_count} liked={post.liked} size="sm" />
          <span className="community-stat">
            <span className="nf nf-fa-comment" /> {post.comment_count}
          </span>
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
          <ReportButton targetType="post" targetId={post.id} />
        </div>
      </div>
    </article>
  );
}
