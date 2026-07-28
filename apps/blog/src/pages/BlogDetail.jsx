import { useState, useEffect } from 'react'

export default function BlogDetail({ slug, navigateTo }) {
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError('')

    fetch(`/api/blog/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Post not found')
        return res.json()
      })
      .then((data) => {
        setPost(data.post)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <section className="blog-section">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading post...</p>
        </div>
      </section>
    )
  }

  if (error || !post) {
    return (
      <section className="blog-section">
        <div className="error-state">
          <span className="nf nf-fa-triangle_exclamation text-font-size-2xl mb-space-md block" />
          <p>{error || 'Post not found'}</p>
          <button
            onClick={() => navigateTo('/blog')}
            className="project-detail__btn mt-space-lg inline-flex"
          >
            <span className="nf nf-fa-arrow_left" /> Back to Blog
          </button>
        </div>
      </section>
    )
  }

  return (
    <article className="blog-detail">
      <button className="blog-detail__back" onClick={() => navigateTo('/blog')}>
        <span className="nf nf-fa-arrow_left" /> Back to Blog
      </button>

      {post.image_url && (
        <img className="blog-detail__image" src={post.image_url} alt={post.title} />
      )}

      <h1 className="blog-detail__title">{post.title}</h1>

      {post.published_at && (
        <p className="blog-detail__date">
          {new Date(post.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      )}

      {post.body && (
        <div className="blog-detail__body">{post.body}</div>
      )}
    </article>
  )
}
