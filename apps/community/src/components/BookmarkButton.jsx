import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../App.jsx';

export default function BookmarkButton({ postId, bookmarked: initialBookmarked }) {
  const { token } = useAuth();
  const [bookmarked, setBookmarked] = useState(!!initialBookmarked);
  const [animating, setAnimating] = useState(false);

  async function handleToggle(e) {
    e.stopPropagation();
    if (!token) {
      navigateTo('/login');
      return;
    }

    const prev = bookmarked;
    setBookmarked(!bookmarked);

    try {
      const res = await fetch('/api/community/bookmarks/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ post_id: postId }),
      });
      if (!res.ok) throw new Error('Bookmark failed');
      const data = await res.json();
      setBookmarked(data.bookmarked);
    } catch {
      setBookmarked(prev);
    }
  }

  return (
    <button
      className={`community-bookmark-btn ${bookmarked ? 'community-bookmark-btn--active' : ''}`}
      onClick={handleToggle}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
    >
      <span className={`nf ${bookmarked ? 'nf-fa-bookmark' : 'nf-fa-bookmark_o'}`} />
    </button>
  );
}
