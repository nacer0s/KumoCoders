import { useState, useEffect } from 'react'
import ScrollReveal from '../components/ScrollReveal.jsx'

export default function LatestGallery() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/gallery?limit=3')
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (items.length === 0) return null

  return (
    <>
      <section className="section scroll-mt-[var(--navbar-height)]" id="latest-gallery">
        <ScrollReveal>
          <h2 className="section__title">Gallery</h2>
          <p className="section__subtitle">Visual showcase of our work</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg mb-space-2xl">
          {items.map((item, i) => (
            <ScrollReveal key={item.id} delay={i + 1}>
              <a href={`/gallery/${item.slug}`} className="block bg-glass-bg backdrop-blur-glass border border-border rounded-radius-lg shadow-glass overflow-hidden transition-all duration-base cursor-pointer no-underline hover:bg-surface-hover hover:-translate-y-1 hover:shadow-lg">
                <img className="w-full h-[220px] object-cover" src={item.image_url} alt={item.title} loading="lazy" />
                <div className="px-space-lg py-space-md bg-glass-bg backdrop-blur-glass">
                  <h3 className="font-headline text-font-size-base font-font-weight-semibold">{item.title}</h3>
                  <span className="text-font-size-xs text-text-muted uppercase tracking-wider">{item.category}</span>
                </div>
              </a>
            </ScrollReveal>
          ))}
        </div>

        <div className="flex justify-center">
          <a href="/gallery" className="inline-flex items-center gap-space-sm px-7 py-2.5 rounded-radius-full text-font-size-sm font-font-weight-medium bg-surface border border-border text-text transition-all duration-fast no-underline hover:bg-surface-hover hover:border-text-muted hover:-translate-y-0.5">
            View Full Gallery <span className="nf nf-fa-arrow_right"></span>
          </a>
        </div>
      </section>

      <div className="section-divider" />
    </>
  )
}
