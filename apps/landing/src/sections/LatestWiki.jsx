import { useState, useEffect } from 'react'
import ScrollReveal from '../components/ScrollReveal.jsx'

export default function LatestWiki() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wiki?limit=3')
      .then((res) => res.json())
      .then((data) => setPages(data.pages || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (pages.length === 0) return null

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      <section className="section scroll-mt-[var(--navbar-height)]" id="latest-wiki">
        <ScrollReveal>
          <h2 className="section__title">Wiki</h2>
          <p className="section__subtitle">Documentation and knowledge base</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg mb-space-2xl">
          {pages.map((page, i) => (
            <ScrollReveal key={page.id} delay={i + 1}>
              <a href={`/wiki/${page.slug}`} className="block bg-glass-bg backdrop-blur-glass border border-border rounded-radius-lg shadow-glass p-space-lg transition-all duration-base cursor-pointer no-underline hover:bg-surface-hover hover:-translate-y-1 hover:shadow-lg">
                <div className="text-2xl mb-space-sm text-text-muted"><span className="nf nf-fa-book" /></div>
                <h3 className="font-headline text-font-size-lg font-font-weight-semibold mb-space-xs">{page.title}</h3>
                {page.category && <p className="text-font-size-xs text-text-muted uppercase tracking-wider mb-space-sm">{page.category}</p>}
                <p className="text-font-size-sm text-text-muted leading-relaxed line-clamp-2">{page.body?.replace(/<[^>]*>/g, '').substring(0, 150)}</p>
                <p className="text-font-size-xs text-text-muted mt-space-sm">{formatDate(page.created_at)}</p>
              </a>
            </ScrollReveal>
          ))}
        </div>

        <div className="flex justify-center">
          <a href="/wiki" className="inline-flex items-center gap-space-sm px-7 py-2.5 rounded-radius-full text-font-size-sm font-font-weight-medium bg-surface border border-border text-text transition-all duration-fast no-underline hover:bg-surface-hover hover:border-text-muted hover:-translate-y-0.5">
            View All Pages <span className="nf nf-fa-arrow_right"></span>
          </a>
        </div>
      </section>

      <div className="section-divider" />
    </>
  )
}
