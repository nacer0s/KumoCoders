import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { navigateTo } from '../App.jsx'
import AdminLayout from '../components/AdminLayout.jsx'

export default function CreateUserFromApplication({ submissionId }) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [app, setApp] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [creating, setCreating] = useState(false)

  const [form, setForm] = useState({
    username: '',
    email: '',
    display_name: '',
    password: '',
    role_id: 2,
  })

  useEffect(() => {
    if (!token || !submissionId) return
    setLoading(true)

    fetch(`/api/join/admin/${submissionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch application')
        return res.json()
      })
      .then((data) => {
        if (!data.submission) throw new Error('Application not found')
        if (data.submission.status !== 'accepted') {
          throw new Error('Application must be accepted before creating a user')
        }
        const s = data.submission
        setApp(s)
        setForm({
          username: (s.first_name?.toLowerCase() + '.' + s.last_name?.toLowerCase()).replace(/[^a-z0-9.]/g, ''),
          email: s.email || '',
          display_name: `${s.first_name} ${s.last_name}`,
          password: '',
          role_id: 2,
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token, submissionId])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setError('Username, email, and password are required.')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          display_name: form.display_name.trim() || null,
          role_id: form.role_id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create user')

      setSuccess(`User "${form.username}" created successfully!`)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Create User from Application">
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading application data...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Create User from Application">
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      {!app && !loading && !error && (
        <p className="admin-text-muted">Application not found.</p>
      )}

      {app && (
        <div className="admin-card glass">
          {!success && (
            <>
              <div className="mb-space-lg">
                <h2 className="m-0 mb-space-xs">Create User for {app.first_name} {app.last_name}</h2>
                <p className="admin-text-muted">
                  The application has been accepted. Fill in the details below to create their user account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="admin-form">
                <div className="admin-input-group">
                  <label className="admin-label">Username *</label>
                  <input type="text" className="admin-input" placeholder="e.g. john.doe" value={form.username} onChange={(e) => setField('username', e.target.value)} required autoFocus />
                </div>

                <div className="admin-input-group">
                  <label className="admin-label">Email *</label>
                  <input type="email" className="admin-input" placeholder="user@email.com" value={form.email} onChange={(e) => setField('email', e.target.value)} required />
                  <p className="admin-text-muted mt-1">Pre-filled from their application.</p>
                </div>

                <div className="admin-input-group">
                  <label className="admin-label">Display Name</label>
                  <input type="text" className="admin-input" placeholder="John Doe" value={form.display_name} onChange={(e) => setField('display_name', e.target.value)} />
                </div>

                <div className="admin-input-group">
                  <label className="admin-label">Password *</label>
                  <input type="text" className="admin-input" placeholder="Set an initial password" value={form.password} onChange={(e) => setField('password', e.target.value)} required />
                  <p className="admin-text-muted mt-1">Share this securely with the new user.</p>
                </div>

                <div className="admin-input-group">
                  <label className="admin-label">Role</label>
                  <select className="admin-input" value={form.role_id} onChange={(e) => setField('role_id', parseInt(e.target.value))}>
                    <option value={2}>Community (standard user)</option>
                    <option value={1}>Admin</option>
                  </select>
                </div>

                <div className="admin-form-actions">
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => navigateTo(`/admin/join/applications/${submissionId}`)}>
                    <span className="nf nf-fa-arrow_left" /> Back to Application
                  </button>
                  <button type="submit" className="admin-btn admin-btn--primary" disabled={creating}>
                    {creating ? 'Creating User...' : <><span className="nf nf-fa-user_plus" /> Create User</>}
                  </button>
                </div>
              </form>
            </>
          )}

          {success && (
            <div className="text-center p-space-xl">
              <p className="text-font-size-lg mb-space-md">✅ User created successfully!</p>
              <div className="flex gap-space-sm justify-center">
                <button className="admin-btn admin-btn--glass" onClick={() => navigateTo('/admin/join/applications')}>
                  <span className="nf nf-fa-list" /> Back to Applications
                </button>
                <button className="admin-btn admin-btn--glass" onClick={() => navigateTo('/admin/users')}>
                  <span className="nf nf-fa-users" /> Manage Users
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
