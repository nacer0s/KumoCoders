import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { navigateTo } from '../App.jsx'
import AdminLayout from '../components/AdminLayout.jsx'
import SearchFilterBar from '../components/SearchFilterBar.jsx'

export default function UsersList() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Create user form
  const [showCreate, setShowCreate] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newRoleId, setNewRoleId] = useState(2)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!token) return
    fetchUsers()
  }, [token])

  function fetchUsers() {
    setLoading(true)
    fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch users')
        return res.json()
      })
      .then((data) => {
        setUsers(data.users || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  function handleEdit(userId) {
    navigateTo(`/admin/edit-user/${userId}`)
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!newUsername.trim() || !newEmail.trim() || !newPassword) {
      setError('Username, email, and password are required')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
          password: newPassword,
          display_name: newDisplayName.trim() || newUsername.trim(),
          role_id: parseInt(newRoleId, 10),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      setSuccess(`User "${newUsername}" created!`)
      setShowCreate(false)
      setNewUsername('')
      setNewEmail('')
      setNewPassword('')
      setNewDisplayName('')
      setNewRoleId(2)

      // Refresh user list
      fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  function cancelCreate() {
    setShowCreate(false)
    setNewUsername('')
    setNewEmail('')
    setNewPassword('')
    setNewDisplayName('')
    setNewRoleId(2)
    setError('')
  }

  return (
    <AdminLayout title="Team Members">
      {error && <div className="admin-error">{error}</div>}
      {success && !showCreate && <div className="admin-success">{success}</div>}

      <div className="admin-card glass">
        <div className="admin-card-header flex items-center justify-between">
          <div>
            <h2>All Users</h2>
            <p className="admin-text-muted">
              Registered users across the platform. Click "Edit" to manage a user.
            </p>
          </div>
          {!showCreate && (
            <button
              className="admin-btn admin-btn--glass"
              onClick={() => { setShowCreate(true); setError(''); setSuccess('') }}
            >
              <span className="nf nf-fa-user_plus" /> Create User
            </button>
          )}
        </div>

        {/* ─── Create User Form ─── */}
        {showCreate && (
          <form onSubmit={handleCreate} className="admin-form mb-space-xl">
            <div className="grid grid-cols-2 gap-space-md gap-x-space-lg">
              <div className="admin-input-group mb-0">
                <label className="admin-label">Username</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="admin-input-group mb-0">
                <label className="admin-label">Email</label>
                <input
                  type="email"
                  className="admin-input"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div className="admin-input-group mb-0">
                <label className="admin-label">Password</label>
                <input
                  type="password"
                  className="admin-input"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="admin-input-group mb-0">
                <label className="admin-label">Display Name</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Optional — defaults to username"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                />
              </div>
              <div className="admin-input-group mb-0">
                <label className="admin-label">Role</label>
                <select
                  className="admin-input"
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value)}
                >
                  <option value={2}>Community</option>
                  <option value={1}>Admin</option>
                </select>
              </div>
              <div className="flex items-end gap-space-sm pb-[2px]">
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
            <p>Loading users...</p>
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <p className="admin-text-muted">No users found.</p>
        )}

        {!loading && users.length > 0 && (
          <SearchFilterBar
            data={users}
            searchFields={['username', 'email', 'display_name']}
            placeholder="Search by username, email, or display name…"
            filters={[
              {
                label: 'Role',
                key: 'role_id',
                options: [
                  { value: '1', label: 'Admin' },
                  { value: '2', label: 'Member' },
                ],
              },
              {
                label: 'Verified',
                key: 'is_verified',
                options: [
                  { value: '1', label: 'Verified' },
                  { value: '0', label: 'Not Verified' },
                ],
              },
              {
                label: 'Status',
                key: 'is_active',
                options: [
                  { value: '1', label: 'Active' },
                  { value: '0', label: 'Inactive' },
                ],
              },
            ]}
          >
            {(filtered) => (
              <>
                {filtered.length === 0 ? (
                  <p className="admin-text-muted">No users match your search.</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Display Name</th>
                          <th>Role</th>
                          <th>Verified</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((u) => (
                          <tr key={u.id}>
                            <td><code>{u.id}</code></td>
                            <td>{u.username}</td>
                            <td>{u.email}</td>
                            <td>{u.display_name || '—'}</td>
                            <td>
                              <span className={`admin-role-badge ${u.role_id === 1 ? 'admin-role-badge--admin' : 'admin-role-badge--member'}`}>
                                {u.role_name || (u.role_id === 1 ? 'Admin' : 'Member')}
                              </span>
                            </td>
                            <td>
                              {u.is_verified ? (
                                <span className="text-blue-500">
                                  <span className="nf nf-fa-badge_check" /> Verified
                                </span>
                              ) : (
                                <span className="text-text-muted text-font-size-sm">—</span>
                              )}
                            </td>
                            <td>
                              <span className={`admin-status-dot ${u.is_active ? 'admin-status-dot--active' : 'admin-status-dot--inactive'}`} />
                              {u.is_active ? 'Active' : 'Inactive'}
                            </td>
                            <td>{formatDate(u.created_at)}</td>
                            <td>
                              <div className="flex gap-space-sm">
                                <button
                                  className="admin-btn admin-btn--glass px-space-md py-1.5 text-font-size-sm"
                                  onClick={() => handleEdit(u.id)}
                                >
                                  <span className="nf nf-fa-edit" /> Edit
                                </button>
                                <button
                                  className={`admin-btn px-space-md py-1.5 text-font-size-sm ${
                                    u.is_verified
                                      ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                      : 'bg-green-500/10 text-green-500 border border-green-500/20'
                                  }`}
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/community/admin/verify/${u.id}`, {
                                        method: 'PUT',
                                        headers: { Authorization: `Bearer ${token}` },
                                      });
                                      if (!res.ok) throw new Error('Failed');
                                      setSuccess(u.is_verified ? `Verification removed for ${u.username}` : `${u.username} verified!`);
                                      fetchUsers();
                                    } catch (err) {
                                      setError(err.message);
                                    }
                                  }}
                                >
                                  <span className={`nf ${u.is_verified ? 'nf-fa-circle_xmark' : 'nf-fa-badge_check'}`} />
                                  {u.is_verified ? 'Unverify' : 'Verify'}
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
    </AdminLayout>
  )
}
