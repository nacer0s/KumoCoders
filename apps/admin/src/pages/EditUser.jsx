import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { navigateTo } from '../App.jsx'
import AdminLayout from '../components/AdminLayout.jsx'

export default function EditUser({ userId }) {
  const { token, user: currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form fields
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [roleId, setRoleId] = useState(2)
  const [isActive, setIsActive] = useState(true)
  const [newPassword, setNewPassword] = useState('')

  // Confirmation dialog
  const [confirmAction, setConfirmAction] = useState(null) // 'delete' | 'ban' | 'unban'
  const [confirmText, setConfirmText] = useState('')

  const isSelf = parseInt(userId) === currentUser?.id

  useEffect(() => {
    if (!token || !userId) return

    setLoading(true)
    setError('')

    fetch(`/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch user')
        const data = await res.json()
        const u = data.user || data
        setUsername(u.username)
        setEmail(u.email)
        setDisplayName(u.display_name || '')
        setRoleId(u.role_id)
        setIsActive(!!u.is_active)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token, userId])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    const payload = {
      username: username.trim(),
      email: email.trim(),
      display_name: displayName,
      role_id: parseInt(roleId, 10),
      is_active: isActive ? 1 : 0,
    }

    if (newPassword.trim()) {
      payload.password = newPassword
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user')
      }

      setSuccess('User updated successfully!')
      setNewPassword('')
      // Update displayed fields from response
      const u = data.user || data
      setUsername(u.username)
      setEmail(u.email)
      setDisplayName(u.display_name || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Ban / Unban ───
  function handleBanClick() {
    if (isActive) {
      setConfirmAction('ban')
      setConfirmText(`Are you sure you want to ban "${username}"? They will lose all access.`)
    } else {
      setConfirmAction('unban')
      setConfirmText(`Reactivate "${username}"? They will regain access.`)
    }
  }

  async function executeBan() {
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: confirmAction === 'unban' ? 1 : 0 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update user')
      setIsActive(confirmAction === 'unban')
      setSuccess(confirmAction === 'unban' ? 'User reactivated' : 'User banned')
      setConfirmAction(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete ───
  function handleDeleteClick() {
    setConfirmAction('delete')
    setConfirmText(
      `Are you sure you want to permanently delete "${username}"? This action cannot be undone.`
    )
  }

  async function executeDelete() {
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete user')
      // Navigate back to user list after short delay
      setSuccess('User deleted! Redirecting...')
      setTimeout(() => navigateTo('/admin/users'), 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function cancelConfirm() {
    setConfirmAction(null)
  }

  if (loading) {
    return (
      <AdminLayout title="Edit User">
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading user data...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={`Edit User: ${username}`}>
      {/* ─── Confirmation Modal ─── */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) cancelConfirm() }}
        >
          <div
            className="glass max-w-[460px] w-[90%] p-space-xl text-center"
          >
            <div className="text-4xl mb-space-md leading-none">
              {confirmAction === 'delete' ? (
                <span className="nf nf-fa-trash_can text-error" />
              ) : (
                <span className="nf nf-fa-warning text-warning" />
              )}
            </div>
            <p className="mb-space-lg leading-relaxed text-font-size-base">
              {confirmText}
            </p>
            <div className="flex gap-space-md justify-center">
              <button
                className="admin-btn admin-btn--ghost"
                onClick={cancelConfirm}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className={`admin-btn border-none ${
                  confirmAction === 'delete' ? 'bg-error text-text-inverse' : 'bg-text text-text-inverse'
                }`}
                onClick={confirmAction === 'delete' ? executeDelete : executeBan}
                disabled={saving}
              >
                {saving ? 'Processing...' : confirmAction === 'delete' ? 'Delete' : confirmAction === 'unban' ? 'Reactivate' : 'Ban'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Form Card ─── */}
      <div className="admin-card glass">
        {error && <div className="admin-error">{error}</div>}
        {success && <div className="admin-success">{success}</div>}

        {/* Status bar */}
        <div
          className={`flex items-center gap-space-md px-space-lg py-space-md mb-space-lg rounded-radius-md ${
            isActive
              ? 'bg-green-500/[0.06] border border-green-500/[0.15]'
              : 'bg-red-500/[0.06] border border-red-500/[0.15]'
          }`}
        >
          <i
            className={`nf ${isActive ? 'nf-fa-circle_check text-success' : 'nf-fa-circle_xmark text-error'} text-[1.3rem]`}
          />
          <span className="text-font-size-sm font-font-weight-medium">
            {isActive ? 'Active account' : 'Banned / Inactive'}
          </span>
          {isSelf && (
            <span className="text-font-size-xs text-text-muted ml-auto">
              This is you
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-input-group">
            <label htmlFor="edit-user-username" className="admin-label">Username</label>
            <input
              id="edit-user-username"
              type="text"
              className="admin-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
            />
          </div>

          <div className="admin-input-group">
            <label htmlFor="edit-user-email" className="admin-label">Email</label>
            <input
              id="edit-user-email"
              type="email"
              className="admin-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="admin-input-group">
            <label htmlFor="edit-user-display" className="admin-label">Display Name</label>
            <input
              id="edit-user-display"
              type="text"
              className="admin-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="admin-input-group">
            <label htmlFor="edit-user-role" className="admin-label">Role</label>
            <select
              id="edit-user-role"
              className="admin-input"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              <option value={1}>Admin</option>
              <option value={2}>Community</option>
            </select>
          </div>

          <div className="admin-input-group">
            <label htmlFor="edit-user-password" className="admin-label">
              New Password <span className="admin-label-hint">(leave blank to keep current)</span>
            </label>
            <input
              id="edit-user-password"
              type="password"
              className="admin-input"
              placeholder="Enter new password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
            />
          </div>

          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => navigateTo('/admin/users')}
            >
              <span className="nf nf-fa-arrow_left" /> Back to Users
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Warnings ─── */}
      <div className="admin-card glass">
        <h3>Warnings</h3>
        <WarningsSection userId={userId} token={token} username={username} />
      </div>

      {/* ─── Notes ─── */}
      <div className="admin-card glass">
        <h3>Mod Notes</h3>
        <NotesSection userId={userId} token={token} />
      </div>

      {/* ─── Danger Zone ─── */}
      <div className="admin-card glass border-red-500/20">
        <div className="admin-card-header">
          <h2 className="text-error">Danger Zone</h2>
        </div>

        <div className="admin-setting-row">
          <div>
            <p className="admin-setting-label">
              {isActive ? 'Ban User' : 'Reactivate User'}
            </p>
            <p className="admin-setting-desc">
              {isActive
                ? 'Revoke access — the user will not be able to log in.'
                : 'Restore access for this user.'}
            </p>
          </div>
          <button
            className={`admin-btn ${
              isActive
                ? 'bg-red-500/10 text-error border border-red-500/20'
                : 'bg-green-500/10 text-success border border-green-500/20'
            }`}
            onClick={handleBanClick}
            disabled={saving}
          >
            <span className={`nf ${isActive ? 'nf-fa-ban' : 'nf-fa-check'}`} />
            {isActive ? ' Ban User' : ' Reactivate'}
          </button>
        </div>

        {!isSelf && (
          <div className="admin-setting-row border-t border-border">
            <div>
              <p className="admin-setting-label text-error">
                Delete Account
              </p>
              <p className="admin-setting-desc">
                Permanently delete this user and all associated data. Cannot be undone.
              </p>
            </div>
            <button
              className="admin-btn bg-red-500/10 text-error border border-red-500/20"
              onClick={handleDeleteClick}
              disabled={saving}
            >
              <span className="nf nf-fa-trash_can" /> Delete
            </button>
          </div>
        )}
      </div>
      {/* ─── Warnings ─── */}
      <div className="admin-card glass">
        <h3>Warnings</h3>
        <WarningsSection userId={userId} token={token} username={username} />
      </div>

      {/* ─── Notes ─── */}
      <div className="admin-card glass">
        <h3>Mod Notes</h3>
        <NotesSection userId={userId} token={token} />
      </div>
    </AdminLayout>
  )
}

function WarningsSection({ userId, token, username }) {
  const [warnings, setWarnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')
  const [expires, setExpires] = useState('')

  useEffect(() => {
    fetch(`/api/community/admin/users/${userId}/warnings`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setWarnings(d.warnings || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId, token])

  async function issueWarning() {
    if (!reason.trim()) return
    const res = await fetch(`/api/community/admin/users/${userId}/warnings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim(), expires_at: expires || null }),
    })
    if (res.ok) {
      const w = (await res.json()).warning
      setWarnings((prev) => [w, ...prev])
      setReason('')
      setExpires('')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-md)' }}>
        <input className="admin-input" style={{ flex: 1 }} placeholder="Warning reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        <input className="admin-input" type="date" style={{ width: '160px' }} value={expires} onChange={(e) => setExpires(e.target.value)} title="Expires (optional)" />
        <button className="admin-btn admin-btn--primary" onClick={issueWarning}>Issue Warning</button>
      </div>
      {loading ? (
        <div className="admin-loading-spinner" />
      ) : warnings.length === 0 ? (
        <p className="admin-text-muted">No warnings</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Reason</th><th>By</th><th>Date</th><th>Expires</th></tr></thead>
          <tbody>
            {warnings.map((w) => (
              <tr key={w.id}>
                <td>{w.reason}</td>
                <td>{w.issued_by_display_name || w.issued_by_username}</td>
                <td>{new Date(w.created_at).toLocaleDateString()}</td>
                <td>{w.expires_at ? new Date(w.expires_at).toLocaleDateString() : 'Never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function NotesSection({ userId, token }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editBody, setEditBody] = useState('')

  const fetchNotes = () => {
    fetch(`/api/community/admin/users/${userId}/notes`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setNotes(d.notes || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchNotes() }, [userId, token])

  async function addNote() {
    if (!body.trim()) return
    const res = await fetch(`/api/community/admin/users/${userId}/notes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body.trim() }),
    })
    if (res.ok) {
      setBody('')
      fetchNotes()
    }
  }

  async function updateNote(id) {
    if (!editBody.trim()) return
    await fetch(`/api/community/admin/users/${userId}/notes/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: editBody.trim() }),
    })
    setEditingId(null)
    fetchNotes()
  }

  async function deleteNote(id) {
    if (!confirm('Delete this note?')) return
    await fetch(`/api/community/admin/users/${userId}/notes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    fetchNotes()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-md)' }}>
        <input className="admin-input" style={{ flex: 1 }} placeholder="Add a private note..." value={body} onChange={(e) => setBody(e.target.value)} />
        <button className="admin-btn admin-btn--primary" onClick={addNote}>Add Note</button>
      </div>
      {loading ? (
        <div className="admin-loading-spinner" />
      ) : notes.length === 0 ? (
        <p className="admin-text-muted">No notes</p>
      ) : (
        notes.map((n) => (
          <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
            {editingId === n.id ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="admin-input" style={{ flex: 1 }} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                <button className="admin-btn" onClick={() => updateNote(n.id)}>Save</button>
                <button className="admin-btn admin-btn--ghost" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <p>{n.body}</p>
                  <small className="admin-text-muted">— {n.author_display_name || n.author_username}, {new Date(n.created_at).toLocaleDateString()}</small>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="admin-btn" onClick={() => { setEditingId(n.id); setEditBody(n.body) }}>Edit</button>
                  <button className="admin-btn admin-btn--danger" onClick={() => deleteNote(n.id)}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
