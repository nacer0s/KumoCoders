import { useState, useEffect, useRef } from 'react';

const CATEGORY_LABELS = {
  communicate: 'Communicate',
  organize: 'Organize',
  create: 'Create',
  explore: 'Explore',
  people: 'People',
  manage: 'Manage',
  operate: 'Operations',
};

export default function CommandPalette({ items, onNavigate, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIdx]) {
      onNavigate(filtered[selectedIdx].key);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div className="s-palette-backdrop" onClick={onClose}>
      <div className="s-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="s-palette-input"
          placeholder="Search apps..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="s-palette-results">
          {filtered.length === 0 ? (
            <div className="s-palette-empty">No results</div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.key}
                className={`s-palette-item ${idx === selectedIdx ? 's-palette-item--active' : ''}`}
                onClick={() => { onNavigate(item.key); onClose(); }}
                onMouseEnter={() => setSelectedIdx(idx)}
              >
                <span className={`nf ${item.icon}`} />
                <span className="s-palette-item-label">{item.label}</span>
                <span className="s-palette-category">
                  {CATEGORY_LABELS[item.cat] || item.cat}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
