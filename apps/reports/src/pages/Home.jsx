import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'

const REPORT_TYPES = [
  { value: 'bug', label: 'Bug Report', icon: 'nf-fa-bug', desc: 'Report a bug or issue' },
  { value: 'feature', label: 'Feature Request', icon: 'nf-fa-lightbulb', desc: 'Suggest a new feature' },
  { value: 'feedback', label: 'Feedback', icon: 'nf-fa-comment', desc: 'Share your thoughts' },
  { value: 'other', label: 'Other', icon: 'nf-fa-ellipsis', desc: 'Something else' },
]

const SEVERITIES = [
  { value: 'low', label: 'Low', desc: 'Minor issue' },
  { value: 'medium', label: 'Medium', desc: 'Moderate impact' },
  { value: 'high', label: 'High', desc: 'Major issue' },
  { value: 'critical', label: 'Critical', desc: 'Blocking progress' },
]

export default function Home() {
  const { user, token } = useAuth()
  const [type, setType] = useState('bug')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!token) {
      setError('You must be signed in to submit a report.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, title, description, severity }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to submit report')
      }
      const data = await res.json()
      setSuccess(data.report)
      setTitle('')
      setDescription('')
      setType('bug')
      setSeverity('medium')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="reports-page">
        <div className="reports-card" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', color: 'var(--color-success)', marginBottom: 'var(--space-md)' }}>
            <span className="nf nf-fa-check_circle" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 'var(--font-size-2xl)', fontWeight: 600 }}>Report Submitted!</h2>
          <p className="reports-text-muted" style={{ marginTop: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            Your <strong>{success.type}</strong> report has been received. Our team will review it.
          </p>
          <p className="reports-text-muted" style={{ marginBottom: 'var(--space-lg)' }}>
            Report ID: <strong>#{success.id}</strong>
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
            <button className="reports-btn reports-btn--primary" onClick={() => setSuccess(null)}>
              Submit Another
            </button>
            <button className="reports-btn" onClick={() => window.history.pushState(null, '', '/reports/my') || window.dispatchEvent(new Event('popstate'))}>
              View My Reports
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reports-page">
      <div className="reports-page-header">
        <h1>Submit a Report</h1>
        <p className="reports-text-muted">
          Found a bug? Have an idea? Let us know and we'll look into it.
        </p>
      </div>

      {!token && (
        <div className="reports-info-box">
          <span className="nf nf-fa-info_circle" />
          <span>Sign in to submit reports and track their status.</span>
        </div>
      )}

      {error && <div className="reports-error">{error}</div>}

      <div className="reports-card reports-card--compact">
        <form className="reports-form" onSubmit={handleSubmit}>
          <div className="reports-form-group">
            <label>Report Type</label>
            <div className="reports-type-grid">
              {REPORT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`reports-type-btn ${type === t.value ? 'reports-type-btn--active' : ''}`}
                  onClick={() => setType(t.value)}
                >
                  <span className={`nf ${t.icon}`} />
                  <span>{t.label}</span>
                  <span className="reports-type-btn-desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="reports-form-group">
            <label htmlFor="report-title">Title</label>
            <input
              id="report-title"
              type="text"
              className="reports-input"
              placeholder="Brief summary of your report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={255}
            />
          </div>

          <div className="reports-form-group">
            <label>Severity</label>
            <div className="reports-severity-grid">
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={`reports-severity-btn ${severity === s.value ? 'reports-severity-btn--active' : ''}`}
                  onClick={() => setSeverity(s.value)}
                >
                  <div className={`reports-severity-dot reports-severity-dot--${s.value}`} />
                  <span>{s.label}</span>
                  <span className="reports-type-btn-desc">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="reports-form-group">
            <label htmlFor="report-desc">Description</label>
            <textarea
              id="report-desc"
              className="reports-textarea"
              placeholder="Detailed description of the issue, feature, or feedback..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
            />
          </div>

          <div className="reports-form-actions">
            <button type="submit" className="reports-btn reports-btn--primary" disabled={submitting || !token}>
              {submitting ? 'Submitting...' : (title && description ? `Submit ${type.replace('_', ' ')}` : 'Submit Report')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
