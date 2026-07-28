import GlassCard from '@kumocoders/ui/GlassCard.jsx'
import ScrollReveal from '../components/ScrollReveal.jsx'

export default function Timeline({ data, error }) {
  if (error || !data) return null

  const { title, subtitle, metadata } = data
  const milestones = metadata?.milestones || []

  return (
    <section className="section scroll-mt-[var(--navbar-height)]" id="timeline">
      <ScrollReveal>
        <h2 className="section__title">{title}</h2>
        {subtitle && <p className="section__subtitle">{subtitle}</p>}
      </ScrollReveal>

      {milestones.length > 0 && (
        <div className="relative max-w-[900px] mx-auto py-space-lg">
          <div className="absolute top-0 bottom-0 left-1/2 max-md:left-4 -translate-x-1/2 max-md:translate-x-0 w-px bg-border" />

          <div className="flex flex-col gap-space-2xl relative">
            {milestones.map((item, i) => {
              const isLeft = i % 2 === 0
              const isCurrent = i === milestones.length - 1

              return (
                <div key={i} className="flex items-start gap-space-2xl max-md:gap-space-md max-md:pl-10 relative">
                  <div
                    className={`absolute left-1/2 max-md:left-4 -translate-x-1/2 max-md:translate-x-0 w-3 h-3 rounded-full bg-[var(--color-bg)] border-2 border-border z-[3] top-7 ${isCurrent ? '!w-3.5 !h-3.5 !border-success !bg-success' : ''}`}
                  />

                  <ScrollReveal delay={i + 1}>
                    <GlassCard
                      hover
                      padding="none"
                      className={`w-[calc(50%-var(--space-2xl))] max-md:w-full ${isLeft ? 'max-md:text-left' : 'ml-auto max-md:ml-0'} ${isLeft ? '' : 'text-right max-md:text-left'}`}
                    >
                      <div className="p-space-lg">
                        {item.year && (
                          <span className="inline-block font-headline text-font-size-xs font-font-weight-bold text-text-muted border border-border rounded-radius-full px-space-sm py-0.5 mb-space-sm tracking-wider">
                            {item.year}
                          </span>
                        )}
                        <h3 className="font-headline text-font-size-xl font-font-weight-bold mb-space-sm text-text">{item.title}</h3>
                        {item.description && (
                          <p className="text-font-size-sm text-text-muted leading-relaxed">{item.description}</p>
                        )}
                      </div>
                    </GlassCard>
                  </ScrollReveal>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
