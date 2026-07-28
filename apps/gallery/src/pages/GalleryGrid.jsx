import { useState, useEffect } from 'react'

const CATEGORIES = ['all', 'design', 'development', 'photography', 'other']

export default function GalleryGrid({ navigateTo }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/gallery?limit=50')
      .then((res) => { if (!res.ok) throw new Error('Failed to fetch'); return res.json() })
      .then((data) => setItems(data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter)

  if (loading) {
    return (
      <section className="gallery-section">
        <div className="projects-loading"><div className="projects-loading-spinner" /><p>Loading gallery...</p></div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="gallery-section">
        <div className="projects-error"><p>{error}</p></div>
      </section>
    )
  }

  return (
    <section className="gallery-section">
      <div className="gallery-section__header">
        <h1 className="gallery-section__title">Gallery</h1>
        <p className="gallery-section__subtitle">A showcase of our design, development, and photography work.</p>
      </div>

      <div className="gallery__filter-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`gallery__filter-btn ${filter === cat ? 'gallery__filter-btn--active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-text-muted p-space-3xl">
          No items in this category yet.
        </p>
      ) : (
        <div className="gallery-grid">
          {filtered.map((item) => (
            <div key={item.id} className="gallery-card" onClick={() => navigateTo(`/gallery/${item.slug}`)}>
              <img className="gallery-card__image" src={item.image_url} alt={item.title} loading="lazy" />
              <div className="gallery-card__body">
                <h3 className="gallery-card__title">{item.title}</h3>
                <span className="gallery-card__category">{item.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
