import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { navigateTo } from '../App.jsx'
import AdminLayout from '../components/AdminLayout.jsx'

export default function ContentList() {
  const { token } = useAuth()
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Create section form
  const [showCreate, setShowCreate] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!token) return
    fetchSections()
  }, [token])

  function fetchSections() {
    setLoading(true)
    fetch('/api/content', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch content sections')
        return res.json()
      })
      .then((data) => {
        setSections(data.content || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  function handleEdit(sectionKey) {
    navigateTo(`/admin/edit/${sectionKey}`)
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  function truncate(str, len = 80) {
    if (!str) return '—'
    return str.length > len ? str.slice(0, len) + '...' : str
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const key = newKey.trim().toLowerCase().replace(/\s+/g, '_')
    if (!key) {
      setError('Section key is required')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          section_key: key,
          title: newTitle.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create section')
      }

      setSuccess(`Section "${key}" created! Redirecting to editor...`)
      setShowCreate(false)
      setNewKey('')
      setNewTitle('')

      // Navigate to edit the new section
      setTimeout(() => navigateTo(`/admin/edit/${key}`), 800)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  function cancelCreate() {
    setShowCreate(false)
    setNewKey('')
    setNewTitle('')
    setError('')
  }

  return (
    <AdminLayout title="Content Management">
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      {/* ─── Create New Section ─── */}
      <div className="admin-card glass">
        <div className="admin-card-header flex items-center justify-between">
          <div>
            <h2>Landing Page Sections</h2>
            <p className="admin-text-muted">
              Click "Edit" to modify the content of each section.
            </p>
          </div>
          {!showCreate && (
            <button
              className="admin-btn admin-btn--glass"
              onClick={() => { setShowCreate(true); setError(''); setSuccess('') }}
            >
              <span className="nf nf-fa-plus" /> New Section
            </button>
          )}
        </div>

        {/* Create form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="admin-form mb-space-xl">
            <div className="flex gap-space-md items-end flex-wrap">
              <div className="admin-input-group flex-[1_1_200px] mb-0">
                <label className="admin-label">Section Key</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. features, team, sponsors"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="admin-input-group flex-[1_1_250px] mb-0">
                <label className="admin-label">Default Title</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Section title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="flex gap-space-sm pb-[2px]">
                <button type="submit" className="admin-btn admin-btn--primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={cancelCreate}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {loading && (
          <div className="admin-loading">
            <div className="admin-loading-spinner" />
            <p>Loading sections...</p>
          </div>
        )}

        {!loading && !error && sections.length === 0 && (
          <p className="admin-text-muted">No content sections found.</p>
        )}

        {!loading && sections.length > 0 && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Section Key</th>
                  <th>Title</th>
                  <th>Subtitle</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => (
                  <tr key={section.section_key || section.id}>
                    <td>
                      <code>{section.section_key}</code>
                    </td>
                    <td>{section.title || '—'}</td>
                    <td className="admin-cell-truncate">
                      {truncate(section.subtitle)}
                    </td>
                    <td>{formatDate(section.updated_at || section.updatedAt)}</td>
                    <td>
                      <button
                        className="admin-btn admin-btn--glass"
                        onClick={() => handleEdit(section.section_key)}
                      >
                        <span className="nf nf-fa-edit" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
