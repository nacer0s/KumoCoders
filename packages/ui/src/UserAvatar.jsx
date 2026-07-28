import { useState, useEffect } from 'react';

function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

function faviconUrl(theme) {
  const reverse = theme === 'dark' ? 'light' : 'dark';
  return `/favicon-${reverse}.svg`;
}

export default function UserAvatar({ user, className = '' }) {
  const [theme, setTheme] = useState(getTheme);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [user?.avatar_url, user?.username]);

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  if (!user) return null;

  const isKumoCoders = user.username?.toLowerCase() === 'kumocoders';
  const hasImg = (isKumoCoders || user.avatar_url) && !imgFailed;

  if (hasImg) {
    return (
      <img
        className={className}
        src={isKumoCoders ? faviconUrl(theme) : user.avatar_url}
        alt=""
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span className={className}>
      {(user.display_name || user.username || '?').charAt(0).toUpperCase()}
    </span>
  );
}
