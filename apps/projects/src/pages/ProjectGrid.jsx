import { useState, useEffect } from 'react'

export default function ProjectGrid({ navigateTo }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/projects?limit=50')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch projects')
        return res.json()
      })
      .then((data) => {
        setProjects(data.projects || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handleProjectClick(slug) {
    navigateTo(`/projects/${slug}`)
  }

  function handleLinkClick(e, url) {
    e.stopPropagation()
    if (url) window.open(url, '_blank', 'noopener')
  }

  if (loading) {
    return (
      <section className="projects-section">
        <div className="projects-loading">
          <div className="projects-loading-spinner" />
          <p>Loading projects...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="projects-section">
        <div className="projects-error">
          <span className="nf nf-fa-triangle_exclamation text-font-size-2xl mb-space-md block" />
          <p>{error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="projects-section">
      <div className="projects-section__header">
        <h1 className="projects-section__title">Our Projects</h1>
        <p className="projects-section__subtitle">
          A showcase of the work we build — from web apps and tools to open-source contributions.
        </p>
      </div>

      {projects.length === 0 ? (
        <p className="text-center text-text-muted p-space-3xl">
          No projects published yet. Check back soon!
        </p>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => handleProjectClick(project.slug)}
            >
              {project.image_url ? (
                <img
                  className="project-card__image"
                  src={project.image_url}
                  alt={project.title}
                  loading="lazy"
                />
              ) : (
                <div className="project-card__image-placeholder">
                  <span className="nf nf-fa-code" />
                </div>
              )}

              <div className="project-card__body">
                <h3 className="project-card__title">{project.title}</h3>
                <p className="project-card__description">
                  {project.description || 'No description provided.'}
                </p>

                {project.tech_stack && (
                  <div className="project-card__tech">
                    {project.tech_stack.split(',').map((tech, i) => (
                      <span key={i} className="project-card__tech-tag">
                        {tech.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="project-card__footer">
                <span>
                  {project.featured ? (
                    <><span className="nf nf-fa-star text-warning" /> Featured</>
                  ) : project.status}
                </span>
                <div className="project-card__links">
                  {project.live_url && (
                    <a
                      href={project.live_url}
                      onClick={(e) => handleLinkClick(e, project.live_url)}
                      title="Live site"
                    >
                      <span className="nf nf-fa-arrow_up_right_from_square" /> Live
                    </a>
                  )}
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      onClick={(e) => handleLinkClick(e, project.github_url)}
                      title="Source code"
                    >
                      <span className="nf nf-fa-github" /> Code
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
