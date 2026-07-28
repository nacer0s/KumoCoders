import { useState, useEffect } from 'react'

export default function WikiDetail({ slug, navigateTo }) {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError('')

    fetch(`/api/wiki/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Wiki page not found')
        return res.json()
      })
      .then((data) => {
        setPage(data.page)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <section className="wiki-section">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading wiki page...</p>
        </div>
      </section>
    )
  }

  if (error || !page) {
    return (
      <section className="wiki-section">
        <div className="error-state">
          <span className="nf nf-fa-triangle_exclamation text-font-size-2xl mb-space-md block" />
          <p>{error || 'Wiki page not found'}</p>
          <button
            onClick={() => navigateTo('/wiki')}
            className="project-detail__btn mt-space-lg inline-flex"
          >
            <span className="nf nf-fa-arrow_left" /> Back to Wiki
          </button>
        </div>
      </section>
    )
  }

  return (
    <article className="wiki-detail">
      <button className="wiki-detail__back" onClick={() => navigateTo('/wiki')}>
        <span className="nf nf-fa-arrow_left" /> Back to Wiki
      </button>

      <h1 className="wiki-detail__title">{page.title}</h1>

      <div className="wiki-detail__meta">
        {page.category && (
          <span className="wiki-detail__category">{page.category}</span>
        )}
        {page.created_at && (
          <span>
            {new Date(page.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        )}
      </div>

      {page.body && (
        <div className="wiki-detail__body">{page.body}</div>
      )}
    </article>
  )
}
