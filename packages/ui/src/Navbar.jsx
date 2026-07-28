import { useState, useEffect, useRef } from 'react';
import SiteMap from './SiteMap.jsx';

const navLinks = [
  { label: 'About', href: '#about', icon: 'nf-fa-users' },
  { label: 'Timeline', href: '#timeline', icon: 'nf-fa-timeline' },
  { label: 'Stats', href: '#stats', icon: 'nf-fa-chart_simple' },
  { label: 'Association', href: '#association', icon: 'nf-fa-building' },
  { label: 'Projects', href: '/projects', icon: 'nf-fa-layer_group' },
  { label: 'Gallery', href: '/gallery', icon: 'nf-fa-image' },
  { label: 'Community', href: '/community', icon: 'nf-fa-comments' },
  { label: 'Wiki', href: '/wiki', icon: 'nf-fa-book' },
  { label: 'Blog', href: '/blog', icon: 'nf-fa-pencil' },
];

export default function Navbar({
  logoLight,
  logoDark,
  currentTheme,
  onToggleTheme,
  transparent = true,
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const sections = ['hero', 'about', 'timeline', 'stats', 'association'];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (mobileOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileOpen]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const logo = currentTheme === 'dark' ? logoDark : logoLight;

  const isActive = (href) => {
    if (href.startsWith('#')) {
      return activeSection === href.slice(1);
    }
    return false;
  };

  function handleMobileNav(href) {
    setMobileOpen(false);
    if (href.startsWith('#')) {
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const linkClasses = (href) =>
    `relative text-font-size-sm font-font-weight-medium text-text-muted transition-colors duration-fast py-space-xs whitespace-nowrap no-underline after:content-[''] after:absolute after:bottom-[-2px] after:left-1/2 after:w-0 after:h-0.5 after:bg-text after:transition-all after:duration-base after:-translate-x-1/2 hover:text-text hover:after:w-full ${isActive(href) ? 'text-text after:w-full' : ''}`;

  const mobileItemClasses = (href) =>
    `flex items-center gap-space-md px-space-lg py-space-md text-font-size-base text-text-muted transition-all duration-fast no-underline border-l-3 border-transparent hover:text-text hover:bg-surface ${isActive(href) ? 'text-text bg-surface border-l-text' : ''}`;

  return (
    <nav
      ref={menuRef}
      className={`fixed top-0 left-0 right-0 z-50 h-[var(--navbar-height)] flex items-center justify-center transition-all duration-base ${scrolled ? 'bg-nav-bg backdrop-blur-glass border-b border-border' : ''}`}
    >
      <div className="w-full max-w-page px-space-lg flex items-center justify-between">
        <a href="/" className="flex items-center gap-space-sm font-font-weight-bold text-font-size-xl text-text no-underline shrink-0">
          <img src={logo} alt="KumoCoders" className="h-8 w-auto transition-opacity duration-base hover:opacity-80" />
          <span>KumoCoders</span>
        </a>

        <div className="hidden lg:flex items-center gap-space-xl">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className={linkClasses(link.href)}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-space-md">
          <SiteMap />

          <button
            className="flex items-center justify-center w-10 h-10 rounded-radius-full bg-surface border border-border text-text text-lg transition-all duration-fast cursor-pointer hover:bg-surface-hover hover:border-text-muted"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {currentTheme === 'dark' ? (
              <span className="nf nf-md-white_balance_sunny"></span>
            ) : (
              <span className="nf nf-md-moon_waning_crescent"></span>
            )}
          </button>

          <button
            className={`lg:hidden flex flex-col gap-1 p-2 bg-transparent border-none cursor-pointer rounded-radius-sm transition-colors duration-fast hover:bg-surface`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span className={`block w-[22px] h-0.5 bg-text rounded-sm transition-all duration-fast origin-center ${mobileOpen ? 'rotate-45 translate-x-[5px] translate-y-[5px]' : ''}`}></span>
            <span className={`block w-[22px] h-0.5 bg-text rounded-sm transition-all duration-fast origin-center ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`}></span>
            <span className={`block w-[22px] h-0.5 bg-text rounded-sm transition-all duration-fast origin-center ${mobileOpen ? '-rotate-45 translate-x-[5px] -translate-y-[5px]' : ''}`}></span>
          </button>
        </div>
      </div>

      <div
        className={`fixed top-[var(--navbar-height)] left-0 right-0 bottom-0 bg-black/40 z-40 transition-opacity duration-250 ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      <div
        className={`fixed top-[var(--navbar-height)] left-0 right-0 max-h-[calc(100vh-var(--navbar-height))] overflow-y-auto bg-nav-bg backdrop-blur-2xl border-b border-border py-space-md z-50 transition-all duration-250 ${mobileOpen ? 'translate-y-0 opacity-100' : '-translate-y-2.5 opacity-0 pointer-events-none'}`}
      >
        <div className="px-space-lg py-space-md text-font-size-xs font-font-weight-semibold text-text-muted uppercase tracking-widest">Navigation</div>
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={mobileItemClasses(link.href)}
            onClick={() => handleMobileNav(link.href)}
          >
            <span className={`nf ${link.icon} text-font-size-lg w-6 text-center shrink-0`} />
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
