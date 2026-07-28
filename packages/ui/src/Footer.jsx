export default function Footer({ logoLight, logoDark, currentTheme, data }) {
  const logo = currentTheme === 'dark' ? logoDark : logoLight;
  const social = data?.metadata?.social || [
    { icon: 'nf-fa-github', url: 'https://github.com/KumoCoders', label: 'GitHub' },
    { icon: 'nf-fa-twitter', url: 'https://twitter.com/KumoCoders', label: 'X / Twitter' },
    { icon: 'nf-fa-discord', url: 'https://discord.gg/kumocoders', label: 'Discord' },
  ];

  return (
    <footer className="relative bg-bg-secondary pt-space-3xl pb-space-xl">
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-page mx-auto px-space-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-space-xl md:gap-space-2xl mb-space-2xl">
          <div className="flex flex-col gap-space-md md:col-span-1">
            <img src={logo} alt="KumoCoders" className="h-7 w-auto self-start" />
            <p className="text-font-size-sm text-text-muted leading-relaxed max-w-[280px]">
              A technology-driven development entity and independent developer team
              based in Casablanca, Morocco — specializing in web solutions, digital
              innovation, and tech hackathons.
            </p>
          </div>

          <div>
            <h4 className="text-font-size-xs font-font-weight-semibold mb-space-lg uppercase tracking-widest text-text-muted">Platform</h4>
            <a href="/community" className="block text-font-size-sm text-text-muted py-space-xs transition-colors duration-fast no-underline hover:text-text">Community</a>
            <a href="/wiki" className="block text-font-size-sm text-text-muted py-space-xs transition-colors duration-fast no-underline hover:text-text">Wiki</a>
            <a href="/blog" className="block text-font-size-sm text-text-muted py-space-xs transition-colors duration-fast no-underline hover:text-text">Blog</a>
            <a href="/join" className="block text-font-size-sm text-text-muted py-space-xs transition-colors duration-fast no-underline hover:text-text">Join Us</a>
          </div>

          <div>
            <h4 className="text-font-size-xs font-font-weight-semibold mb-space-lg uppercase tracking-widest text-text-muted">About</h4>
            <a href="/#about" className="block text-font-size-sm text-text-muted py-space-xs transition-colors duration-fast no-underline hover:text-text">Our Story</a>
            <a href="/#association" className="block text-font-size-sm text-text-muted py-space-xs transition-colors duration-fast no-underline hover:text-text">Association</a>
            <a href="/#stats" className="block text-font-size-sm text-text-muted py-space-xs transition-colors duration-fast no-underline hover:text-text">Stats</a>
          </div>

          <div>
            <h4 className="text-font-size-xs font-font-weight-semibold mb-space-lg uppercase tracking-widest text-text-muted">Legal &amp; Disclaimers</h4>
            <a href="/privacy" className="block text-font-size-sm text-text-muted py-space-xs transition-colors duration-fast no-underline hover:text-text">Privacy Policy</a>
            <a href="/terms" className="block text-font-size-sm text-text-muted py-space-xs transition-colors duration-fast no-underline hover:text-text">Terms of Service</a>
            <a href="/cookies" className="block text-font-size-sm text-text-muted py-space-xs transition-colors duration-fast no-underline hover:text-text">Cookie Policy</a>
          </div>
        </div>

        <div className="border-t border-border pt-space-lg flex flex-col md:flex-row justify-between items-center gap-space-md">
          <p className="text-font-size-xs text-text-muted">&copy; 2025 - {new Date().getFullYear()} KumoCoders. All rights reserved.</p>
          <div className="flex gap-space-md">
            {social.map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                title={item.label}
                className="flex items-center justify-center w-9 h-9 rounded-radius-full bg-surface border border-border text-text-muted text-font-size-sm transition-all duration-fast no-underline hover:text-text hover:border-text-muted hover:bg-surface-hover hover:-translate-y-0.5"
              >
                <span className={`nf ${item.icon}`} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
