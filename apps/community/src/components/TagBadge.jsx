import { navigateTo } from '../App.jsx';

export default function TagBadge({ tag, clickable = true }) {
  function handleClick(e) {
    if (!clickable) return;
    e.stopPropagation();
    e.preventDefault();
    navigateTo(`/?tag=${encodeURIComponent(tag)}`);
  }

  return (
    <span
      className="community-tag-badge"
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => { if (clickable && e.key === 'Enter') handleClick(e); }}
    >
      #{tag}
    </span>
  );
}
