import { useState, useEffect } from 'react'

export default function GalleryDetail({ slug, navigateTo }) {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError('')
    fetch(`/api/gallery/${encodeURIComponent(slug)}`)
      .then((res) => { if (!res.ok) throw new Error('Item not found'); return res.json() })
      .then((data) => setItem(data.item))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <section className="gallery-section">
        <div className="projects-loading"><div className="projects-loading-spinner" /><p>Loading...</p></div>
      </section>
    )
  }

  if (error || !item) {
    return (
      <section className="gallery-section">
        <div className="projects-error">
          <p>{error || 'Item not found'}</p>
          <button onClick={() => navigateTo('/gallery')} className="gallery-detail__back mt-space-lg inline-flex">
            <span className="nf nf-fa-arrow_left" /> Back to Gallery
          </button>
        </div>
      </section>
    )
  }

  return (
    <article className="gallery-detail">
      <button className="gallery-detail__back" onClick={() => navigateTo('/gallery')}>
        <span className="nf nf-fa-arrow_left" /> Back to Gallery
      </button>

      <img className="gallery-detail__image" src={item.image_url} alt={item.title} />

      <h1 className="gallery-detail__title">{item.title}</h1>

      <div className="gallery-detail__meta">
        <span className="gallery-detail__category">{item.category}</span>
        {item.featured && <span className="gallery-detail__featured"><span className="nf nf-fa-star" /> Featured</span>}
      </div>

      {item.description && (
        <p className="gallery-detail__description">{item.description}</p>
      )}
    </article>
  )
}
