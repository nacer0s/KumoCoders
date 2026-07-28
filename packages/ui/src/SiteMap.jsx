import { useState, useEffect, useRef } from 'react';

const SECTIONS = [
  { label: 'Home', href: '/', icon: 'nf-fa-house', desc: 'Landing page' },
  { label: 'Community', href: '/community', icon: 'nf-fa-comments', desc: 'Discussion forum' },
  { label: 'Blog', href: '/blog', icon: 'nf-fa-pencil', desc: 'Articles & news' },
  { label: 'Gallery', href: '/gallery', icon: 'nf-fa-image', desc: 'Visual showcase' },
  { label: 'Projects', href: '/projects', icon: 'nf-fa-layer_group', desc: 'Our work' },
  { label: 'Wiki', href: '/wiki', icon: 'nf-fa-book', desc: 'Knowledge base' },
  { label: 'Studio', href: '/studio', icon: 'nf-fa-cubes', desc: 'Team workspace hub' },
  { label: 'Reports', href: '/reports', icon: 'nf-fa-flag', desc: 'Bug reports & feedback' },
  { label: 'Join', href: '/join', icon: 'nf-fa-user_plus', desc: 'Become a member' },
  { label: 'Admin', href: '/admin', icon: 'nf-fa-shield', desc: 'Administration', adminOnly: true },
];

export default function SiteMap({ isAdmin }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const items = SECTIONS.filter(s => !s.adminOnly || isAdmin);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Site map"
        className="flex items-center justify-center w-10 h-10 rounded-radius-full bg-surface border border-border text-text text-lg transition-all duration-fast cursor-pointer hover:bg-surface-hover hover:border-text-muted"
      >
        <span className="nf nf-fa-sitemap" />
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 199 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: 8,
              zIndex: 200,
              minWidth: 240,
              background: 'var(--color-glass-bg)',
              border: 'var(--glass-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-glass)',
              padding: 8,
            }}
          >
            <div style={{
              padding: '8px 12px 4px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Site Map
            </div>
            {items.map((section) => (
              <a
                key={section.href}
                href={section.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                  fontSize: 'var(--font-size-sm)',
                  transition: 'background var(--transition-fast)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span className={`nf ${section.icon}`} style={{ fontSize: '1.1rem', width: 20, textAlign: 'center', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{section.label}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{section.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
