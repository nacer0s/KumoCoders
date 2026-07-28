import GlassCard from '@kumocoders/ui/GlassCard.jsx'
import Button from '@kumocoders/ui/Button.jsx'
import ScrollReveal from '../components/ScrollReveal.jsx'

export default function CTA({ data, error }) {
  if (error || !data) return null

  const { title, body, metadata } = data
  const ctaPrimary = metadata?.cta_primary
  const ctaSecondary = metadata?.cta_secondary

  return (
    <section className="text-center px-space-lg py-space-3xl max-w-page mx-auto" id="cta">
      <ScrollReveal>
        <GlassCard padding="none" className="p-space-3xl max-md:p-space-xl text-center">
          <h2 className="font-headline text-font-size-3xl max-md:text-font-size-2xl font-font-weight-bold mb-space-md">{title}</h2>
          {body && <p className="text-font-size-lg text-text-muted leading-relaxed max-w-[520px] mx-auto mb-space-2xl">{body}</p>}
          <div className="flex gap-space-md justify-center flex-wrap">
            {ctaPrimary && (
              <a href={ctaPrimary.link}>
                <Button variant="primary" size="lg">{ctaPrimary.text}</Button>
              </a>
            )}
            {ctaSecondary && (
              <a href={ctaSecondary.link}>
                <Button variant="outline" size="lg">{ctaSecondary.text}</Button>
              </a>
            )}
          </div>
        </GlassCard>
      </ScrollReveal>
    </section>
  )
}
