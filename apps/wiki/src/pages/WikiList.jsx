import { useState, useEffect } from 'react'

export default function WikiList({ navigateTo }) {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/wiki?limit=50')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch wiki pages')
        return res.json()
      })
      .then((data) => {
        setPages(data.pages || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handlePageClick(slug) {
    navigateTo(`/wiki/${slug}`)
  }

  if (loading) {
    return (
      <section className="wiki-section">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading wiki pages...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="wiki-section">
        <div className="error-state">
          <span className="nf nf-fa-triangle_exclamation text-font-size-2xl mb-space-md block" />
          <p>{error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="wiki-section">
      <div className="wiki-section__header">
        <h1 className="wiki-section__title">Wiki</h1>
        <p className="wiki-section__subtitle">
          Documentation, guides, and knowledge base from the KumoCoders team.
        </p>
      </div>

      {pages.length === 0 ? (
        <p className="text-center text-text-muted p-space-3xl">
          No wiki pages published yet. Check back soon!
        </p>
      ) : (
        <div className="wiki-grid">
          {pages.map((page) => (
            <div
              key={page.id}
              className="wiki-card"
              onClick={() => handlePageClick(page.slug)}
            >
              <div className="wiki-card__icon">
                <span className="nf nf-fa-book" />
              </div>
              <h3 className="wiki-card__title">{page.title}</h3>
              {page.category && (
                <div className="wiki-card__category">{page.category}</div>
              )}
              <p className="wiki-card__excerpt">
                {page.body
                  ? page.body.length > 150
                    ? page.body.substring(0, 150) + '…'
                    : page.body
                  : 'No content available.'}
              </p>
              {page.created_at && (
                <div className="wiki-card__date">
                  {new Date(page.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
