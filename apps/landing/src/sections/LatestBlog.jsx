import { useState, useEffect } from 'react'
import ScrollReveal from '../components/ScrollReveal.jsx'

export default function LatestBlog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/blog?limit=3')
      .then((res) => res.json())
      .then((data) => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (posts.length === 0) return null

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      <section className="section scroll-mt-[var(--navbar-height)]" id="latest-blog">
        <ScrollReveal>
          <h2 className="section__title">Blog</h2>
          <p className="section__subtitle">Latest articles and updates</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg mb-space-2xl">
          {posts.map((post, i) => (
            <ScrollReveal key={post.id} delay={i + 1}>
              <a href={`/blog/${post.slug}`} className="block bg-glass-bg backdrop-blur-glass border border-border rounded-radius-lg shadow-glass overflow-hidden transition-all duration-base cursor-pointer no-underline hover:bg-surface-hover hover:-translate-y-1 hover:shadow-lg">
                {post.image_url ? (
                  <img className="w-full h-40 object-cover border-b border-border" src={post.image_url} alt={post.title} loading="lazy" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-surface text-text-muted text-2xl border-b border-border"><span className="nf nf-fa-pencil" /></div>
                )}
                <div className="px-space-lg pb-space-lg pt-space-md">
                  <h3 className="font-headline text-font-size-lg font-font-weight-semibold mb-space-xs">{post.title}</h3>
                  {post.excerpt && <p className="text-font-size-sm text-text-muted leading-relaxed line-clamp-2">{post.excerpt}</p>}
                  <p className="text-font-size-xs text-text-muted mt-space-sm">{formatDate(post.published_at || post.created_at)}</p>
                </div>
              </a>
            </ScrollReveal>
          ))}
        </div>

        <div className="flex justify-center">
          <a href="/blog" className="inline-flex items-center gap-space-sm px-7 py-2.5 rounded-radius-full text-font-size-sm font-font-weight-medium bg-surface border border-border text-text transition-all duration-fast no-underline hover:bg-surface-hover hover:border-text-muted hover:-translate-y-0.5">
            View All Posts <span className="nf nf-fa-arrow_right"></span>
          </a>
        </div>
      </section>

      <div className="section-divider" />
    </>
  )
}
