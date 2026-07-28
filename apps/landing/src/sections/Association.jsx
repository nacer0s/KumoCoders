import GlassCard from '@kumocoders/ui/GlassCard.jsx'
import Button from '@kumocoders/ui/Button.jsx'
import ScrollReveal from '../components/ScrollReveal.jsx'

export default function Association({ data, error }) {
  if (error || !data) return null

  const { title, subtitle, body, metadata } = data
  const badge = metadata?.badge
  const buttonText = metadata?.buttonText || 'Learn More'
  const buttonLink = metadata?.buttonLink || '#'

  return (
    <section className="section" id="association">
      <ScrollReveal>
        <h2 className="section__title">{title}</h2>
        {subtitle && <p className="section__subtitle">{subtitle}</p>}
      </ScrollReveal>

      <ScrollReveal delay={1}>
        <div className="max-w-[800px] mx-auto text-center">
          <GlassCard padding="none" className="p-space-2xl max-md:p-space-xl text-center">
            {badge && (
              <div className="inline-flex items-center gap-space-sm border border-success rounded-radius-full px-space-md py-space-xs text-font-size-sm text-success mb-space-lg bg-[rgba(34,197,94,0.05)]">
                <span className="nf nf-fa-check_circle" />
                {badge}
              </div>
            )}

            {subtitle && <h3 className="text-font-size-2xl max-md:text-font-size-xl font-font-weight-bold mb-space-md">{subtitle}</h3>}
            {body && <p className="text-font-size-lg text-text-muted leading-relaxed mb-space-lg max-w-[600px] mx-auto">{body}</p>}

            <a href={buttonLink}>
              <Button variant="outline">{buttonText}</Button>
            </a>
          </GlassCard>
        </div>
      </ScrollReveal>
    </section>
  )
}
