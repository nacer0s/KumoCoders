import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import PostCard from '../components/PostCard.jsx';
import TagBadge from '../components/TagBadge.jsx';
import TrendingTags from '../components/TrendingTags.jsx';
import SkeletonCard from '../components/skeletons/SkeletonCard.jsx';

const SORT_OPTIONS = [
  { key: 'new', label: 'New', icon: 'nf-fa-clock' },
  { key: 'top', label: 'Top', icon: 'nf-fa-arrow_up_wide_short' },
  { key: 'hot', label: 'Hot', icon: 'nf-fa-fire' },
];

export default function Feed() {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [pinnedPosts, setPinnedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sort, setSort] = useState('new');
  const [following, setFollowing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const sentinelRef = useRef(null);

  // Parse search + tag from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tagParam = params.get('tag');
    const searchParam = params.get('search');
    if (tagParam) setActiveTag(tagParam);
    if (searchParam) setSearch(searchParam);
  }, []);

  // Fetch tags
  useEffect(() => {
    fetch('/api/community/tags')
      .then((r) => r.json())
      .then((d) => setAllTags(d.tags || []))
      .catch(() => {});
  }, []);

  // Fetch posts
  useEffect(() => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '20');
    params.set('sort', sort);
    if (activeTag) params.set('tag', activeTag);
    if (search) params.set('search', search);
    if (following) params.set('following', 'true');

    fetch(`/api/community/posts?${params}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load posts');
        return r.json();
      })
      .then((d) => {
        const fetched = d.posts || [];
        setPosts((prev) => page === 1 ? fetched : [...prev, ...fetched]);
        setHasMore(d.hasMore || d.total > page * 20);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, activeTag, search, sort, retryCount]);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !loading) setPage((p) => p + 1); },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  // Fetch pinned posts separately
  useEffect(() => {
    fetch('/api/community/posts/pinned', {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
      .then((r) => r.json())
      .then((d) => setPinnedPosts(d.posts || []))
      .catch(() => {});
  }, [token]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
  }

  function handleTagClick(tag) {
    setActiveTag(activeTag === tag ? '' : tag);
    setPage(1);
  }

  function handleSortChange(newSort) {
    if (newSort === sort) return;
    setSort(newSort);
    setPage(1);
  }

  return (
    <div className="community-feed">
      <div className="community-feed-layout">
      <div className="community-feed-main">
      {/* ─── Header ─── */}
      <div className="community-feed-header">
        <h1>Community Feed</h1>
        <p>Discuss, share, and connect with fellow developers</p>
      </div>

      {/* ─── Sort Tabs ─── */}
      <div className="community-sort-tabs">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            className={`community-sort-tab ${sort === opt.key ? 'community-sort-tab--active' : ''}`}
            onClick={() => handleSortChange(opt.key)}
          >
            <span className={`nf ${opt.icon}`} />
            <span>{opt.label}</span>
          </button>
        ))}
        <button
          className={`community-sort-tab ${following ? 'community-sort-tab--active' : ''}`}
          onClick={() => { setFollowing(!following); setPage(1); }}
        >
          <span className="nf nf-fa-users" />
          <span>Following</span>
        </button>
      </div>

      {/* ─── Search & Filter ─── */}
      <div className="community-feed-controls">
        <form className="community-search-form" onSubmit={handleSearch}>
          <span className="nf nf-fa-magnifying_glass community-search-icon" />
          <input
            type="text"
            className="community-input"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="community-search-clear"
              onClick={() => { setSearch(''); setPage(1); }}
            >
              <span className="nf nf-fa-xmark" />
            </button>
          )}
        </form>

        {allTags.length > 0 && (
          <div className="community-tag-filters">
            {allTags.slice(0, 15).map((t) => (
              <button
                key={t.name}
                className={`community-tag-filter-btn ${activeTag === t.name ? 'community-tag-filter-btn--active' : ''}`}
                onClick={() => handleTagClick(t.name)}
              >
                #{t.name}
                <span className="community-tag-count">{t.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Content ─── */}
      {error && (
        <div className="community-error">
          <div className="mb-2">{error}</div>
          <button className="community-btn community-btn--ghost community-error-retry" onClick={() => setRetryCount(c => c + 1)}>
            <span className="nf nf-fa-rotate" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="community-post-list">
          <SkeletonCard count={5} />
        </div>
      ) : (
        <>
          {/* Pinned posts — only show on "new" sort */}
          {pinnedPosts.length > 0 && sort === 'new' && (
            <div className="community-pinned-section">
              <h3 className="community-section-title">
                <span className="nf nf-fa-thumbtack" /> Pinned
              </h3>
              {pinnedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Post list */}
          {posts.length === 0 ? (
            <div className="community-empty">
              <span className="nf nf-fa-newspaper text-4xl opacity-40" />
              <h3>No posts yet</h3>
              <p>Be the first to start a discussion!</p>
            </div>
          ) : (
            <div className="community-post-list">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {hasMore && <div ref={sentinelRef} className="community-scroll-sentinel" />}
          {loading && <SkeletonCard count={2} />}
        </>
      )}
      </div>

      <aside className="community-feed-sidebar">
        <TrendingTags />
      </aside>
      </div>
    </div>
  );
}
