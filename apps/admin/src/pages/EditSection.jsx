import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { navigateTo } from '../App.jsx'
import AdminLayout from '../components/AdminLayout.jsx'
import StructuredSectionForm from '../components/StructuredSectionForm.jsx'

// Sections that have structured editors (instead of raw JSON)
const STRUCTURED_TYPES = ['hero', 'about', 'timeline', 'stats', 'association', 'cta', 'footer']

export default function EditSection({ sectionKey }) {
  // If this is a known content section, use the structured editor
  if (STRUCTURED_TYPES.includes(sectionKey)) {
    return (
      <AdminLayout title={`Edit: ${sectionKey}`}>
        <StructuredSectionForm sectionKey={sectionKey} />
      </AdminLayout>
    )
  }

  // Fallback: generic JSON editor for custom sections
  return <GenericSectionEditor sectionKey={sectionKey} />
}

// ─── Generic JSON-based editor (for non-structured sections) ───
function GenericSectionEditor({ sectionKey }) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [sectionKeyField, setSectionKeyField] = useState('')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [body, setBody] = useState('')
  const [metadata, setMetadata] = useState('')

  useEffect(() => {
    if (!token || !sectionKey) return

    setLoading(true)
    setError('')

    fetch(`/api/content/${sectionKey}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch section data')
        return res.json()
      })
      .then((data) => {
        const section = data.content || data
        setSectionKeyField(section.section_key ?? sectionKey)
        setTitle(section.title ?? '')
        setSubtitle(section.subtitle ?? '')
        setBody(section.body ?? '')
        setMetadata(
          section.metadata
            ? (typeof section.metadata === 'string'
                ? section.metadata
                : JSON.stringify(section.metadata, null, 2))
            : ''
        )
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token, sectionKey])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    let parsedMetadata
    if (metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(metadata)
      } catch {
        setError('Metadata must be valid JSON')
        setSaving(false)
        return
      }
    } else {
      parsedMetadata = null
    }

    const payload = {
      title,
      subtitle,
      body,
      ...(parsedMetadata !== null ? { metadata: parsedMetadata } : {}),
    }

    try {
      const res = await fetch(`/api/content/${sectionKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || errData.error || 'Failed to save section')
      }

      setSuccess('Section saved successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Edit Section">
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading section data...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={`Edit: ${sectionKey}`}>
      <div className="admin-card glass">
        {error && <div className="admin-error">{error}</div>}
        {success && <div className="admin-success">{success}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-input-group">
            <label htmlFor="edit-section-key" className="admin-label">Section Key</label>
            <input id="edit-section-key" type="text" className="admin-input" value={sectionKeyField} disabled readOnly />
          </div>

          <div className="admin-input-group">
            <label htmlFor="edit-title" className="admin-label">Title</label>
            <input id="edit-title" type="text" className="admin-input" placeholder="Section title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="admin-input-group">
            <label htmlFor="edit-subtitle" className="admin-label">Subtitle</label>
            <input id="edit-subtitle" type="text" className="admin-input" placeholder="Section subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>

          <div className="admin-input-group">
            <label htmlFor="edit-body" className="admin-label">Body</label>
            <textarea id="edit-body" className="admin-textarea" placeholder="Section body content" rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          <div className="admin-input-group">
            <label htmlFor="edit-metadata" className="admin-label">Metadata <span className="admin-label-hint">(JSON)</span></label>
            <textarea id="edit-metadata" className="admin-textarea admin-textarea--code" placeholder='{ "key": "value" }' rows={6} value={metadata} onChange={(e) => setMetadata(e.target.value)} />
          </div>

          <div className="admin-form-actions">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => navigateTo('/admin/content')}>
              <span className="nf nf-fa-arrow_left" /> Back to Content
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
