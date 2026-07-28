import { useState, useEffect } from 'react';
import GlassCard from '@kumocoders/ui/GlassCard.jsx';
import ScrollReveal from '../components/ScrollReveal.jsx';
import AnimatedCounter from '../components/AnimatedCounter.jsx';

export default function Stats({ data, error }) {
  const [liveStats, setLiveStats] = useState(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stats/public')
      .then((r) => {
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then((d) => {
        if (!cancelled) setLiveStats(d.stats);
      })
      .catch(() => {
        if (!cancelled) setFetchError(true);
      });
    return () => { cancelled = true; };
  }, []);

  const items = liveStats || data?.metadata?.items || [];
  const title = data?.title || 'By the Numbers';
  const subtitle = data?.subtitle || null;

  if (error && !liveStats) return null;

  return (
    <section className="section--full" id="stats">
      <div className="section">
        <ScrollReveal>
          <h2 className="section__title">{title}</h2>
          {subtitle && <p className="section__subtitle">{subtitle}</p>}
        </ScrollReveal>

        {items.length > 0 && (
          <div className="grid grid-cols-4 max-md:grid-cols-2 gap-space-lg max-md:gap-space-md">
            {items.map((item, i) => (
              <ScrollReveal key={item.label || i} delay={i + 1}>
                <GlassCard padding="none" className="text-center p-space-2xl max-md:p-space-lg px-space-lg">
                  <div className="font-headline text-[clamp(2.5rem,6vw,3.5rem)] max-md:text-[clamp(1.8rem,8vw,2.5rem)] font-font-weight-bold leading-none mb-space-sm text-text">
                    <span className="inline-flex items-baseline">
                      <AnimatedCounter
                        value={String(item.value ?? 0)}
                        suffix=""
                        duration={item.duration || 2000}
                      />
                      {item.suffix && (
                        <span className="text-[0.6em] opacity-50">{item.suffix}</span>
                      )}
                    </span>
                  </div>
                  <div className="text-font-size-sm text-text-muted font-font-weight-medium uppercase tracking-wider">{item.label}</div>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
