import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function PushSetup() {
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission();
      return;
    }

    if (Notification.permission !== 'granted') return;

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: undefined }).then((sub) => {
        const data = sub.toJSON();
        if (data.endpoint) {
          fetch('/api/community/push/subscribe', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: data.endpoint, keys: { auth: data.keys?.auth || '', p256dh: data.keys?.p256dh || '' } }),
          }).catch(() => {});
        }
      }).catch(() => {});
    }).catch(() => {});
  }, [user, token]);

  return null;
}
