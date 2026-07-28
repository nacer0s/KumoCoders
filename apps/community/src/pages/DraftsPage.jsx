import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';
import CommunityLayout from '../components/CommunityLayout.jsx';
import PostCard from '../components/PostCard.jsx';

export default function DraftsPage() {
  const { token } = useAuth();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/community/posts/drafts', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setDrafts(d.drafts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <CommunityLayout>
      <div className="community-feed-page">
        <div className="community-feed-header">
          <h1>My Drafts</h1>
          <p className="community-text-muted text-sm">Posts you haven't published yet</p>
        </div>

        {loading ? (
          <div className="community-loading">
            <div className="community-loading-spinner" />
            <p>Loading drafts...</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="community-empty">
            <span className="nf nf-fa-pencil_square community-empty-icon" />
            <p>No drafts yet</p>
            <button className="community-btn community-btn--primary" onClick={() => navigateTo('/new')}>
              Create a Post
            </button>
          </div>
        ) : (
          <div className="community-feed-list">
            {drafts.map((post) => (
              <div key={post.id} className="community-post-card community-draft-card" onClick={() => navigateTo(`/edit/${post.id}`)}>
                <div className="community-post-card-header">
                  <div className="community-post-card-author">
                    <span className="community-draft-badge">Draft</span>
                  </div>
                  <span className="community-post-card-date">
                    {new Date(post.updated_at || post.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="community-post-card-title">{post.title || 'Untitled'}</h3>
                <p className="community-post-card-body community-text-muted">
                  {post.body ? post.body.replace(/<[^>]*>/g, '').slice(0, 150) : 'No content'}
                </p>
                <div className="community-post-card-footer">
                  <button className="community-btn community-btn--primary community-btn--sm" onClick={(e) => { e.stopPropagation(); navigateTo(`/edit/${post.id}`); }}>
                    Edit Draft
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CommunityLayout>
  );
}
