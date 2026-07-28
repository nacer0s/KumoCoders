import { useState, useEffect } from 'react'

export default function BlogList({ navigateTo }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/blog?limit=50')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch posts')
        return res.json()
      })
      .then((data) => {
        setPosts(data.posts || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handlePostClick(slug) {
    navigateTo(`/blog/${slug}`)
  }

  if (loading) {
    return (
      <section className="blog-section">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading posts...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="blog-section">
        <div className="error-state">
          <span className="nf nf-fa-triangle_exclamation text-font-size-2xl mb-space-md block" />
          <p>{error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="blog-section">
      <div className="blog-section__header">
        <h1 className="blog-section__title">Blog</h1>
        <p className="blog-section__subtitle">
          Thoughts, tutorials, and updates from the KumoCoders team.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-text-muted p-space-3xl">
          No posts published yet. Check back soon!
        </p>
      ) : (
        <div className="blog-grid">
          {posts.map((post) => (
            <div
              key={post.id}
              className="blog-card"
              onClick={() => handlePostClick(post.slug)}
            >
              {post.image_url ? (
                <img
                  className="blog-card__image"
                  src={post.image_url}
                  alt={post.title}
                  loading="lazy"
                />
              ) : (
                <div className="blog-card__image-placeholder">
                  <span className="nf nf-fa-pencil" />
                </div>
              )}

              <div className="blog-card__body">
                <h3 className="blog-card__title">{post.title}</h3>
                <p className="blog-card__excerpt">
                  {post.excerpt || 'No excerpt available.'}
                </p>
              </div>

              <div className="blog-card__date">
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
