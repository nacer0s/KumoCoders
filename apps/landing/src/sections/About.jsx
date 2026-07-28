import GlassCard from '@kumocoders/ui/GlassCard.jsx'
import ScrollReveal from '../components/ScrollReveal.jsx'

export default function About({ data, error }) {
  if (error || !data) return null

  const { title, subtitle, body, metadata } = data
  const highlights = metadata?.highlights || []
  const quickInfo = metadata?.quickInfo || []

  return (
    <section className="section scroll-mt-[var(--navbar-height)]" id="about">
      <ScrollReveal>
        <h2 className="section__title">{title}</h2>
        {subtitle && <p className="section__subtitle">{subtitle}</p>}
      </ScrollReveal>

      {body && (
        <ScrollReveal delay={1}>
          <p className="text-font-size-lg max-md:text-font-size-base leading-relaxed text-text-muted text-center max-w-[720px] mx-auto mb-space-lg mt-space-lg">
            {body}
          </p>
        </ScrollReveal>
      )}

      {highlights.length > 0 && (
        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-space-lg max-md:gap-space-md max-w-[800px] mx-auto mb-space-2xl">
          {highlights.map((item, i) => (
            <ScrollReveal key={item.title || i} delay={i + 2}>
              <GlassCard hover padding="none" className="p-space-lg text-center">
                <h3 className="text-font-size-base font-font-weight-semibold mb-space-xs">{item.title}</h3>
                <p className="text-font-size-sm text-text-muted leading-relaxed">{item.description}</p>
              </GlassCard>
            </ScrollReveal>
          ))}
        </div>
      )}

      {quickInfo.length > 0 && (
        <div className="flex gap-space-md max-md:gap-space-sm flex-wrap justify-center">
          {quickInfo.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-space-sm border border-border rounded-radius-full px-space-md py-space-xs text-font-size-sm text-text-muted bg-glass-bg backdrop-blur-sm">
              {item.icon && <span className={`nf ${item.icon} text-[0.85em] opacity-50`} />}
              {item.text}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
