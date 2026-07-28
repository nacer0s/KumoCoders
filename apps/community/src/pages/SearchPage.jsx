import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';
import PostCard from '../components/PostCard.jsx';
import TagBadge from '../components/TagBadge.jsx';
import SkeletonCard from '../components/skeletons/SkeletonCard.jsx';

export default function SearchPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [activeTag, setActiveTag] = useState('');
  const [sort, setSort] = useState('new');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const sentinelRef = useRef(null);

  // Parse query from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    setQuery(q);
  }, []);

  // Fetch tags
  useEffect(() => {
    fetch('/api/community/tags')
      .then((r) => r.json())
      .then((d) => setAllTags(d.tags || []))
      .catch(() => {});
  }, []);

  // Fetch results
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '20');
    params.set('sort', sort);
    if (activeTag) params.set('tag', activeTag);
    params.set('search', query);

    fetch(`/api/community/posts?${params}`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Search failed');
        return r.json();
      })
      .then((d) => {
        const fetched = d.posts || [];
        setResults((prev) => page === 1 ? fetched : [...prev, ...fetched]);
        setHasMore(d.hasMore || d.total > page * 20);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query, page, activeTag, sort, token]);

  // Infinite scroll
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

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    const params = new URLSearchParams(window.location.search);
    params.set('q', query);
    window.history.replaceState(null, '', `/community/search?${params}`);
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

  const hasQuery = query.trim().length > 0;

  return (
    <div className="community-page">
      <div className="community-page-header">
        <h1><span className="nf nf-fa-magnifying_glass" /> Search</h1>
        <p>Find posts across the community</p>
      </div>

      <form className="community-search-form" onSubmit={handleSearch} style={{ marginBottom: 24 }}>
        <span className="nf nf-fa-magnifying_glass community-search-icon" />
        <input
          type="text"
          className="community-input"
          placeholder="Search posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button
            type="button"
            className="community-search-clear"
            onClick={() => { setQuery(''); setResults([]); setPage(1); }}
          >
            <span className="nf nf-fa-xmark" />
          </button>
        )}
      </form>

      {/* Filters */}
      {hasQuery && (
        <>
          <div className="community-sort-tabs" style={{ marginBottom: 16 }}>
            {[
              { key: 'new', label: 'New', icon: 'nf-fa-clock' },
              { key: 'top', label: 'Top', icon: 'nf-fa-arrow_up_wide_short' },
              { key: 'hot', label: 'Hot', icon: 'nf-fa-fire' },
            ].map((opt) => (
              <button
                key={opt.key}
                className={`community-sort-tab ${sort === opt.key ? 'community-sort-tab--active' : ''}`}
                onClick={() => handleSortChange(opt.key)}
              >
                <span className={`nf ${opt.icon}`} /> {opt.label}
              </button>
            ))}
          </div>

          {allTags.length > 0 && (
            <div className="community-tag-filters" style={{ marginBottom: 16 }}>
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
        </>
      )}

      {/* Results */}
      {error && (
        <div className="community-error">
          {error}
          <button className="community-btn community-btn--ghost" onClick={() => setPage(1)} style={{ marginLeft: 8 }}>
            <span className="nf nf-fa-rotate" /> Retry
          </button>
        </div>
      )}

      {loading && page === 1 ? (
        <div className="community-post-list"><SkeletonCard count={5} /></div>
      ) : hasQuery && results.length === 0 && !loading ? (
        <div className="community-empty" style={{ marginTop: 48 }}>
          <span className="nf nf-fa-search text-5xl opacity-30 block mb-4" />
          <h3>No results for "{query}"</h3>
          <p>Try a different search term or filter</p>
        </div>
      ) : (
        <div className="community-post-list">
          {results.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {hasMore && <div ref={sentinelRef} className="community-scroll-sentinel" />}
      {loading && page > 1 && <SkeletonCard count={2} />}
    </div>
  );
}
