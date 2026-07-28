import Button from '@kumocoders/ui/Button.jsx'
import MatrixRain from '../components/MatrixRain.jsx'
import TypingAnimation from '../components/TypingAnimation.jsx'

export default function Hero({ theme, data, error }) {
  if (error || !data) return null

  const { title, metadata } = data
  const ctaPrimary = metadata?.cta_primary
  const ctaSecondary = metadata?.cta_secondary

  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden flex flex-col items-center justify-center text-center" id="hero">
      <MatrixRain theme={theme} />
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: `radial-gradient(
            ellipse 80% 60% at 50% 50%,
            transparent 0%,
            ${theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'} 100%
          )`,
        }}
      />

      <div className="relative z-[2] flex flex-col items-center gap-space-xl px-space-lg max-w-[820px] w-full">
        <h1 className="font-headline text-[clamp(2rem,5vw,4rem)] font-font-weight-bold text-text leading-[1.15] tracking-[-0.03em] text-center">
          {title}
        </h1>

        <div className="flex items-center gap-space-sm border border-border rounded-radius-full px-space-md py-space-xs bg-glass-bg backdrop-blur-sm text-[clamp(0.8rem,1.3vw,0.95rem)] text-text-muted max-w-full">
          <span className="opacity-40 text-[0.8em] nf nf-fa-code" />
          <div className="min-h-[1.6em] flex items-center justify-center leading-relaxed font-text">
            <TypingAnimation />
          </div>
        </div>

        <div className="flex gap-space-md flex-wrap justify-center mt-space-sm">
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
      </div>

      <div className="absolute bottom-space-xl left-1/2 -translate-x-1/2 z-[2] flex flex-col items-center gap-space-sm text-text-muted text-font-size-xs opacity-40">
        <div className="w-px h-6 bg-border" />
        <span>Scroll</span>
      </div>
    </section>
  )
}
