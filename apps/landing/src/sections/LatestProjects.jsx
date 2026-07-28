import { useState, useEffect } from 'react'
import ScrollReveal from '../components/ScrollReveal.jsx'

export default function LatestProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects?limit=3')
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (projects.length === 0) return null

  return (
    <>
      <section className="section scroll-mt-[var(--navbar-height)]" id="latest-projects">
        <ScrollReveal>
          <h2 className="section__title">Projects</h2>
          <p className="section__subtitle">Our latest work and open-source contributions</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg mb-space-2xl">
          {projects.map((project, i) => (
            <ScrollReveal key={project.id} delay={i + 1}>
              <a href={`/projects/${project.slug}`} className="block bg-glass-bg backdrop-blur-glass border border-border rounded-radius-lg shadow-glass overflow-hidden transition-all duration-base cursor-pointer no-underline hover:bg-surface-hover hover:-translate-y-1 hover:shadow-lg">
                {project.image_url ? (
                  <img className="w-full h-40 object-cover border-b border-border" src={project.image_url} alt={project.title} loading="lazy" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-surface text-text-muted text-2xl border-b border-border"><span className="nf nf-fa-code" /></div>
                )}
                <div className="px-space-lg pb-space-lg pt-space-md">
                  <h3 className="font-headline text-font-size-lg font-font-weight-semibold mb-space-xs">{project.title}</h3>
                  {project.description && <p className="text-font-size-sm text-text-muted leading-relaxed line-clamp-2">{project.description}</p>}
                  {project.tech_stack && (
                    <div className="flex flex-wrap gap-space-xs mt-space-sm">
                      {project.tech_stack.split(',').slice(0, 4).map((tech, ti) => (
                        <span key={ti} className="inline-block px-2 py-0.5 text-[0.65rem] bg-surface border border-border rounded-radius-full text-text-muted">{tech.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            </ScrollReveal>
          ))}
        </div>

        <div className="flex justify-center">
          <a href="/projects" className="inline-flex items-center gap-space-sm px-7 py-2.5 rounded-radius-full text-font-size-sm font-font-weight-medium bg-surface border border-border text-text transition-all duration-fast no-underline hover:bg-surface-hover hover:border-text-muted hover:-translate-y-0.5">
            View All Projects <span className="nf nf-fa-arrow_right"></span>
          </a>
        </div>
      </section>

      <div className="section-divider" />
    </>
  )
}
