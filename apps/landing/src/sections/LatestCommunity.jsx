import { useState, useEffect } from 'react'
import ScrollReveal from '../components/ScrollReveal.jsx'

export default function LatestCommunity() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/community/posts?limit=3')
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
      <section className="section scroll-mt-[var(--navbar-height)]" id="latest-community">
        <ScrollReveal>
          <h2 className="section__title">Community</h2>
          <p className="section__subtitle">Latest discussions from our community</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg mb-space-2xl">
          {posts.map((post, i) => (
            <ScrollReveal key={post.id} delay={i + 1}>
              <a href={`/community/post/${post.id}`} className="block bg-glass-bg backdrop-blur-glass border border-border rounded-radius-lg shadow-glass p-space-lg transition-all duration-base cursor-pointer no-underline hover:bg-surface-hover hover:-translate-y-1 hover:shadow-lg">
                <h3 className="font-headline text-font-size-lg font-font-weight-semibold mb-space-sm leading-tight">{post.title}</h3>
                <p className="text-font-size-sm text-text-muted leading-relaxed mb-space-md line-clamp-2">{post.body?.replace(/<[^>]*>/g, '').substring(0, 150)}</p>
                <div className="text-font-size-xs text-text-muted flex gap-space-md">
                  <span><span className="nf nf-fa-user" /> {post.author_name || 'Anonymous'}</span>
                  <span><span className="nf nf-fa-heart" /> {post.like_count || 0}</span>
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </a>
            </ScrollReveal>
          ))}
        </div>

        <div className="flex justify-center">
          <a href="/community" className="inline-flex items-center gap-space-sm px-7 py-2.5 rounded-radius-full text-font-size-sm font-font-weight-medium bg-surface border border-border text-text transition-all duration-fast no-underline hover:bg-surface-hover hover:border-text-muted hover:-translate-y-0.5">
            View All Discussions <span className="nf nf-fa-arrow_right"></span>
          </a>
        </div>
      </section>

      <div className="section-divider" />
    </>
  )
}
