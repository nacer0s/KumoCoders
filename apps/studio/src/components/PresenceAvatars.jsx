import { useAuth } from '../contexts/AuthContext.jsx';
import usePresence from '../hooks/usePresence.js';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';

export default function PresenceAvatars({ teamId, appKey }) {
  const onlineUsers = usePresence(teamId, appKey);
  const { user } = useAuth();

  // Filter out current user
  const others = onlineUsers.filter(u => u.user_id !== user?.id);
  if (others.length === 0) return null;

  const visible = others.slice(0, 5);
  const overflow = others.length - 5;

  return (
    <div className="s-presence-bar">
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginRight: 4 }}>Online:</span>
      {visible.map(u => (
        <div key={u.user_id} className="s-presence-dot" title={(u.display_name || u.username)}>
          <UserAvatar user={u} />
        </div>
      ))}
      {overflow > 0 && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>+{overflow}</span>}
    </div>
  );
}
