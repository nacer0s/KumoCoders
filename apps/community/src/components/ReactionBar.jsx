import { useState } from 'react';
import { navigateTo } from '../App.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const EMOJIS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '🙏', label: 'Pray' },
];

export default function ReactionBar({ postId, reactions = [], userReactions = [], size = 'sm' }) {
  const { token } = useAuth();
  const [localReactions, setLocalReactions] = useState(reactions);
  const [localUserReactions, setLocalUserReactions] = useState(userReactions);

  async function handleReact(emoji) {
    if (!token) return navigateTo('/login');

    const already = localUserReactions.includes(emoji);
    const prevReactions = localReactions;
    const prevUser = localUserReactions;

    // Optimistic update
    if (already) {
      setLocalReactions((prev) =>
        prev
          .map((r) => (r.reaction === emoji ? { ...r, count: r.count - 1 } : r))
          .filter((r) => r.count > 0)
      );
      setLocalUserReactions((prev) => prev.filter((e) => e !== emoji));
    } else {
      setLocalReactions((prev) => {
        const existing = prev.find((r) => r.reaction === emoji);
        if (existing) return prev.map((r) => (r.reaction === emoji ? { ...r, count: r.count + 1 } : r));
        return [...prev, { reaction: emoji, count: 1 }];
      });
      setLocalUserReactions((prev) => [...prev, emoji]);
    }

    try {
      const res = await fetch('/api/community/reactions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ post_id: postId, reaction: emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocalReactions(data.reactions);
        if (data.reacted) {
          setLocalUserReactions((prev) => {
            if (!prev.includes(emoji)) return [...prev, emoji];
            return prev;
          });
        } else {
          setLocalUserReactions((prev) => prev.filter((e) => e !== emoji));
        }
      } else {
        setLocalReactions(prevReactions);
        setLocalUserReactions(prevUser);
      }
    } catch {
      setLocalReactions(prevReactions);
      setLocalUserReactions(prevUser);
    }
  }

  return (
    <div className={`community-reaction-bar ${size === 'sm' ? 'community-reaction-bar--sm' : ''}`}>
      {EMOJIS.map(({ emoji, label }) => {
        const count = localReactions.find((r) => r.reaction === emoji)?.count || 0;
        const active = localUserReactions.includes(emoji);
        return (
          <button
            key={emoji}
            className={`community-reaction-btn ${active ? 'community-reaction-btn--active' : ''}`}
            onClick={() => handleReact(emoji)}
            title={label}
          >
            <span className="community-reaction-emoji">{emoji}</span>
            {count > 0 && <span className="community-reaction-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
