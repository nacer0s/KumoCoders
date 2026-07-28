import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { navigateTo } from '../App.jsx';

export default function LikeButton({ targetType, targetId, count: initialCount, liked: initialLiked, size = 'md' }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [liked, setLiked] = useState(!!initialLiked);
  const [count, setCount] = useState(initialCount || 0);
  const [animating, setAnimating] = useState(false);

  async function handleToggle(e) {
    e.stopPropagation();
    if (!token) {
      navigateTo('/login');
      return;
    }

    const prevLiked = liked;
    const prevCount = count;

    // Optimistic update
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    try {
      const res = await fetch('/api/community/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ target_type: targetType, target_id: targetId }),
      });
      if (!res.ok) throw new Error('Like failed');
      const data = await res.json();
      // Use server response
      setLiked(data.liked);
      setCount(data.likeCount);
      showToast(data.liked ? 'Liked!' : 'Removed like', 'success');
    } catch {
      // Revert on error
      setLiked(prevLiked);
      setCount(prevCount);
    }
  }

  return (
    <button
      className={`community-like-btn ${liked ? 'community-like-btn--liked' : ''} community-like-btn--${size}`}
      onClick={handleToggle}
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      <span className={`nf ${liked ? 'nf-fa-heart' : 'nf-fa-heart_o'}`} />
      <span>{count}</span>
    </button>
  );
}
