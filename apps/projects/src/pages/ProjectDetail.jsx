import { useState, useEffect } from 'react'

export default function ProjectDetail({ slug, navigateTo }) {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError('')

    fetch(`/api/projects/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Project not found')
        return res.json()
      })
      .then((data) => {
        setProject(data.project)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <section className="projects-section">
        <div className="projects-loading">
          <div className="projects-loading-spinner" />
          <p>Loading project...</p>
        </div>
      </section>
    )
  }

  if (error || !project) {
    return (
      <section className="projects-section">
        <div className="projects-error">
          <span className="nf nf-fa-triangle_exclamation text-font-size-2xl mb-space-md block" />
          <p>{error || 'Project not found'}</p>
          <button
            onClick={() => navigateTo('/projects')}
            className="project-detail__btn mt-space-lg inline-flex"
          >
            <span className="nf nf-fa-arrow_left" /> Back to Projects
          </button>
        </div>
      </section>
    )
  }

  const techStack = project.tech_stack
    ? project.tech_stack.split(',').map((t) => t.trim())
    : []

  const statusClass =
    project.status === 'active'
      ? 'project-detail__status--active'
      : project.status === 'archived'
        ? 'project-detail__status--archived'
        : 'project-detail__status--planned'

  return (
    <article className="project-detail">
      <button className="project-detail__back" onClick={() => navigateTo('/projects')}>
        <span className="nf nf-fa-arrow_left" /> Back to Projects
      </button>

      {project.image_url ? (
        <img className="project-detail__image" src={project.image_url} alt={project.title} />
      ) : (
        <div className="project-detail__image-placeholder">
          <span className="nf nf-fa-code" />
        </div>
      )}

      <div className="project-detail__header">
        <h1 className="project-detail__title">{project.title}</h1>
        <span className={`project-detail__status ${statusClass}`}>
          {project.status}
        </span>
      </div>

      {techStack.length > 0 && (
        <div className="project-detail__tech">
          {techStack.map((tech, i) => (
            <span key={i} className="project-detail__tech-tag">{tech}</span>
          ))}
        </div>
      )}

      {project.description && (
        <p className="project-detail__description">{project.description}</p>
      )}

      {project.long_description && (
        <div className="project-detail__long-description">{project.long_description}</div>
      )}

      {(project.live_url || project.github_url) && (
        <div className="project-detail__actions">
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="project-detail__btn project-detail__btn--primary"
            >
              <span className="nf nf-fa-arrow_up_right_from_square" /> View Live
            </a>
          )}
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="project-detail__btn"
            >
              <span className="nf nf-fa-github" /> View Source
            </a>
          )}
        </div>
      )}
    </article>
  )
}
