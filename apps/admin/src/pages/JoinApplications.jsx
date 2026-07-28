import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { navigateTo } from '../App.jsx'
import AdminLayout from '../components/AdminLayout.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import SearchFilterBar from '../components/SearchFilterBar.jsx'

const INTEREST_LABELS = {
  join_team: 'Join team',
  collaborate: 'Collaborate',
  open_source: 'Open source',
  general: 'General interest',
  other: 'Other',
}

export default function JoinApplications() {
  const { token } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Confirm delete state
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    if (!token) return
    fetchSubmissions()
  }, [token])

  function fetchSubmissions() {
    setLoading(true)
    setError('')

    fetch('/api/join/admin/all', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch submissions')
        return res.json()
      })
      .then((data) => {
        setSubmissions(data.submissions || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  async function handleDelete(id) {
    setDeleteId(null)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/join/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to delete')
      }
      setSuccess('Application deleted!')
      fetchSubmissions()
    } catch (err) {
      setError(err.message)
    }
  }

  function handleView(id) {
    navigateTo(`/admin/join/applications/${id}`)
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  return (
    <AdminLayout title="Join Applications">
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <div className="admin-card glass">
        <div className="admin-card-header">
          <div>
            <h2>All Applications</h2>
            <p className="admin-text-muted">
              Review and manage join applications submitted through the public form.
            </p>
          </div>
        </div>

        {loading && (
          <div className="admin-loading">
            <div className="admin-loading-spinner" />
            <p>Loading applications...</p>
          </div>
        )}

        {!loading && !error && submissions.length === 0 && (
          <p className="admin-text-muted">No applications yet.</p>
        )}

        {!loading && submissions.length > 0 && (
          <SearchFilterBar
            data={submissions}
            searchFields={['first_name', 'last_name', 'email', 'current_role']}
            placeholder="Search by name, email, or role…"
            filters={[
              {
                label: 'All Statuses',
                key: 'status',
                options: [
                  { value: 'pending', label: 'Pending' },
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'refused', label: 'Refused' },
                ],
              },
              {
                label: 'Interest',
                key: 'interest_type',
                options: [
                  { value: 'join_team', label: 'Join team' },
                  { value: 'collaborate', label: 'Collaborate' },
                  { value: 'open_source', label: 'Open source' },
                  { value: 'general', label: 'General interest' },
                  { value: 'other', label: 'Other' },
                ],
              },
            ]}
          >
            {(filtered) => (
              <>
                {filtered.length === 0 ? (
                  <p className="admin-text-muted">No applications match your search.</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Interest</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Submitted</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((s) => (
                          <tr key={s.id} className="cursor-pointer" onClick={() => handleView(s.id)}>
                            <td><strong>{s.first_name} {s.last_name}</strong></td>
                            <td>{s.email}</td>
                            <td>{INTEREST_LABELS[s.interest_type] || s.interest_type}</td>
                            <td>{s.current_role || '—'}</td>
                            <td>
                              <StatusBadge status={s.status} />
                            </td>
                            <td className="whitespace-nowrap">{formatDate(s.created_at)}</td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-space-xs">
                                <button
                                  className="admin-btn admin-btn--glass text-font-size-xs"
                                  onClick={() => handleView(s.id)}
                                >
                                  <span className="nf nf-fa-eye" /> View
                                </button>
                                <button
                                  className="admin-btn admin-btn--ghost text-font-size-xs text-error"
                                  onClick={() => setDeleteId(s.id)}
                                >
                                  <span className="nf nf-fa-trash_can" /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </SearchFilterBar>
        )}
      </div>

      {/* ─── Confirm Delete Modal ─── */}
      <ConfirmModal
        isOpen={!!deleteId}
        onConfirm={() => handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        title="Delete Application"
        message="Are you sure you want to delete this application? This cannot be undone."
        confirmText="Delete"
        destructive
      />
    </AdminLayout>
  )
}

function StatusBadge({ status }) {
  const classes = {
    pending: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-500',
    accepted: 'bg-green-500/10 border-green-500/25 text-green-500',
    refused: 'bg-red-500/10 border-red-500/25 text-red-500',
  }
  const cls = classes[status] || classes.pending
  return (
    <span className={`inline-flex items-center gap-[3px] px-2 py-0.5 rounded-radius-sm text-font-size-xs font-font-weight-semibold border ${cls}`}>
      {status}
    </span>
  )
}
