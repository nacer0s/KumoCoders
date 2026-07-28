import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function usePresence(teamId, appKey) {
  const { token, user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!teamId || !appKey || !token) return;

    // Fetch initial online users via REST
    fetch(`/api/studio/teams/${teamId}/presence`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.ok ? r.json() : []).then(users => {
      if (Array.isArray(users)) setOnlineUsers(users);
    }).catch(() => {});

    // Poll every 10 seconds
    const interval = setInterval(() => {
      fetch(`/api/studio/teams/${teamId}/presence`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.ok ? r.json() : []).then(users => {
        if (Array.isArray(users)) setOnlineUsers(users);
      }).catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, [teamId, appKey, token]);

  return onlineUsers;
}
