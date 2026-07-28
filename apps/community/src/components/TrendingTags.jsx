import { useState, useEffect } from 'react';
import { navigateTo } from '../App.jsx';

export default function TrendingTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/community/posts/trending-tags')
      .then((r) => r.json())
      .then((d) => setTags(d.tags || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <div className="community-trending-tags">
      <h3 className="community-trending-tags-title">
        <span className="nf nf-fa-fire" /> Trending Tags
      </h3>
      <div className="community-trending-tags-list">
        {tags.map(({ tag, count }) => (
          <button
            key={tag}
            className="community-trending-tag"
            onClick={() => navigateTo(`/?tag=${encodeURIComponent(tag)}`)}
          >
            <span className="community-trending-tag-name">#{tag}</span>
            <span className="community-trending-tag-count">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
