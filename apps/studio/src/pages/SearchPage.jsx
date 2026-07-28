import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navigateTo } from '../utils/navigate.js';

const SEARCH_SOURCES = [
  {
    key: 'tasks', label: 'Tasks', icon: 'nf-fa-list_check',
    endpoint: (tid) => `/api/studio/teams/${tid}/tasks`,
    match: (item, q) => (item.title || '').toLowerCase().includes(q),
    title: (item) => item.title,
    excerpt: (item) => item.description,
    link: (tid) => `/teams/${tid}/tasks`,
  },
  {
    key: 'files', label: 'Files', icon: 'nf-fa-folder_open',
    endpoint: (tid) => `/api/studio/teams/${tid}/files`,
    match: (item, q) => (item.filename || '').toLowerCase().includes(q),
    title: (item) => item.filename,
    excerpt: (item) => item.description,
    link: (tid) => `/teams/${tid}/files`,
  },
  {
    key: 'documents', label: 'Documents', icon: 'nf-fa-file_lines',
    endpoint: (tid) => `/api/studio/teams/${tid}/documents`,
    match: (item, q) => (item.title || '').toLowerCase().includes(q),
    title: (item) => item.title,
    excerpt: (item) => (item.content || '').substring(0, 120),
    link: (tid) => `/teams/${tid}/docs`,
  },
  {
    key: 'events', label: 'Events', icon: 'nf-fa-calendar_days',
    endpoint: (tid) => `/api/studio/teams/${tid}/events`,
    match: (item, q) => (item.title || '').toLowerCase().includes(q),
    title: (item) => item.title,
    excerpt: (item) => item.description,
    link: (tid) => `/teams/${tid}/calendar`,
  },
  {
    key: 'wiki', label: 'Wiki', icon: 'nf-fa-book',
    endpoint: (tid) => `/api/studio/teams/${tid}/apps/wiki/data`,
    match: (item, q) => ((item.title || item.itemKey || '')).toLowerCase().includes(q),
    title: (item) => item.title || item.itemKey,
    excerpt: (item) => (item.content || '').substring(0, 120),
    link: (tid) => `/teams/${tid}/wiki`,
  },
  {
    key: 'forms', label: 'Forms', icon: 'nf-fa-list',
    endpoint: (tid) => `/api/studio/teams/${tid}/apps/forms/data`,
    match: (item, q) => ((item.title || item.itemKey || '')).toLowerCase().includes(q),
    title: (item) => item.title || item.itemKey,
    excerpt: () => '',
    link: (tid) => `/teams/${tid}/forms`,
  },
  {
    key: 'kanban', label: 'Kanban', icon: 'nf-fa-columns',
    endpoint: (tid) => `/api/studio/teams/${tid}/apps/kanban/data`,
    match: (item, q) => ((item.title || item.itemKey || '')).toLowerCase().includes(q),
    title: (item) => item.title || item.itemKey,
    excerpt: (item) => item.description,
    link: (tid) => `/teams/${tid}/kanban`,
  },
];

export default function SearchPage({ teamId }) {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults({}); setSearched(false); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setSearched(true);

      const fetches = SEARCH_SOURCES.map((src) =>
        fetch(src.endpoint(teamId), {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => (r.ok ? r.json() : []))
          .then((data) => {
            const items = Array.isArray(data)
              ? data.filter((item) => src.match(item, q)).map((item) => ({
                  id: item.id,
                  title: src.title(item),
                  excerpt: src.excerpt(item),
                  link: src.link(teamId),
                  icon: src.icon,
                  source: src.key,
                }))
              : [];
            return { key: src.key, label: src.label, icon: src.icon, items };
          })
          .catch(() => ({ key: src.key, label: src.label, icon: src.icon, items: [] }))
      );

      Promise.all(fetches).then((allResults) => {
        const grouped = {};
        for (const r of allResults) {
          if (r.items.length > 0) grouped[r.key] = r;
        }
        setResults(grouped);
        setLoading(false);
      });
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, teamId, token]);

  function handleResultClick(link) {
    navigateTo(link);
  }

  const hasResults = Object.keys(results).length > 0;

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-magnifying_glass" /> Search</h1>
      </div>

      <div style={{ position: 'relative', marginBottom: 'var(--space-lg)' }}>
        <div
          className="glass"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            padding: '0 var(--space-md)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            transition: 'border-color 0.15s',
          }}
        >
          <span className="nf nf-fa-magnifying_glass" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-lg)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, files, documents, events, and more..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '14px 0',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text)',
              fontSize: 'var(--font-size-base)',
              outline: 'none',
            }}
          />
          {query && (
            <button
              className="studio-btn studio-btn--ghost"
              style={{ padding: '4px', fontSize: 'var(--font-size-lg)' }}
              onClick={() => setQuery('')}
            >
              <span className="nf nf-fa-xmark" />
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl)' }}>
          <div className="studio-loading-spinner" />
        </div>
      )}

      {!loading && searched && !hasResults && (
        <div className="studio-empty">
          <div className="studio-empty-icon">
            <span className="nf nf-fa-magnifying_glass" />
          </div>
          <h3>No results found</h3>
          <p>Try a different search term</p>
        </div>
      )}

      {!loading && hasResults && (
        <div
          className="glass"
          style={{
            borderRadius: 'var(--radius-lg)',
            border: 'var(--glass-border)',
            overflow: 'hidden',
            maxHeight: 'calc(100vh - 320px)',
            overflowY: 'auto',
          }}
        >
          {Object.entries(results).map(([key, group]) => (
            <div key={key}>
              <div
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  borderBottom: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                <span className={`nf ${group.icon}`} />
                <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}>
                  {group.label}
                </span>
                <span className="studio-badge">{group.items.length}</span>
              </div>
              {group.items.map((item) => (
                <div
                  key={`${key}-${item.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-md)',
                    padding: 'var(--space-md) var(--space-lg)',
                    borderBottom: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  className="studio-search-hover"
                  onClick={() => handleResultClick(item.link)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleResultClick(item.link); }}
                  tabIndex={0}
                  role="button"
                >
                  <span className={`nf ${item.icon}`} style={{ marginTop: 2, color: 'var(--color-text-muted)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>
                      {item.title}
                    </div>
                    {item.excerpt && (
                      <div
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-muted)',
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                        }}
                      >
                        {item.excerpt}
                      </div>
                    )}
                  </div>
                  <span className="nf nf-fa-chevron_right" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
