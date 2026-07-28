import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import AdminLayout from '../components/AdminLayout.jsx'
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx'

export default function Profile() {
  const { user, token } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  // Profile settings
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [profileSaving, setProfileSaving] = useState(false)

  const isVerified = user?.is_verified === 1
  const avatarSrc = user?.avatar_url || avatarUrl || null

  async function handlePasswordChange(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword || !newPassword) {
      setError('Both current and new password are required')
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      setSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleProfileSave(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setProfileSaving(true)

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          avatar_url: avatarUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setSuccess('Profile updated successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setProfileSaving(false)
    }
  }

  return (
    <AdminLayout title="My Profile">
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      {/* ── Avatar & Info Card ── */}
      <div className="admin-card glass text-center">
        <div className="py-space-xl px-0">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full mx-auto mb-space-md overflow-hidden bg-surface border-2 border-border flex items-center justify-center relative">
            <UserAvatar user={{ ...user, avatar_url: avatarSrc }} className="w-full h-full text-2xl font-bold" />
          </div>

          {/* Name + Verified Badge */}
          <h2 className="m-0 flex items-center justify-center gap-space-sm">
            {user?.display_name || user?.username || '—'}
            {isVerified && (
              <span
                className="nf nf-md-check_decagram text-blue-500 text-[1.3rem]"
                title="Verified Account"
              />
            )}
          </h2>
          {user?.username && (
            <p className="text-text-muted text-font-size-sm mt-space-xs">
              @{user.username}
            </p>
          )}
          {user?.bio && (
            <p className="text-text-muted text-font-size-sm max-w-[400px] mx-auto mt-space-sm leading-relaxed">
              {user.bio}
            </p>
          )}
        </div>

        {/* Info rows */}
        <div className="flex justify-center gap-space-xl flex-wrap pt-space-lg border-t border-border">
          <div>
            <p className="admin-text-muted text-font-size-xs mb-1">Email</p>
            <p className="text-font-size-base">{user?.email || '—'}</p>
          </div>
          <div>
            <p className="admin-text-muted text-font-size-xs mb-1">Role</p>
            <span className={`admin-role-badge ${user?.role_id === 1 ? 'admin-role-badge--admin' : 'admin-role-badge--member'}`}>
              {user?.role_id === 1 ? 'Admin' : 'Member'}
            </span>
          </div>
          <div>
            <p className="admin-text-muted text-font-size-xs mb-1">Joined</p>
            <p className="text-font-size-base">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Profile Settings Card ── */}
      <div className="admin-card glass">
        <div className="admin-card-header">
          <h2>Profile Settings</h2>
        </div>

        <form onSubmit={handleProfileSave} className="admin-form">
          <div className="admin-input-group">
            <label htmlFor="profile-avatar-url" className="admin-label">Avatar URL</label>
            <input
              id="profile-avatar-url"
              type="url"
              className="admin-input"
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
            <p className="admin-text-muted mt-1">
              Link to an image URL for your profile picture. Leave empty for initials fallback.
            </p>
          </div>

          <div className="admin-input-group">
            <label htmlFor="profile-display-name" className="admin-label">Display Name</label>
            <input
              id="profile-display-name"
              type="text"
              className="admin-input"
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="admin-input-group">
            <label htmlFor="profile-bio" className="admin-label">Bio</label>
            <textarea
              id="profile-bio"
              className="admin-textarea"
              placeholder="Tell us about yourself..."
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="admin-form-actions">
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={profileSaving}
            >
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Change Password Card ── */}
      <div className="admin-card glass">
        <div className="admin-card-header">
          <h2>Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="admin-form">
          <div className="admin-input-group">
            <label htmlFor="profile-current-pw" className="admin-label">Current Password</label>
            <div className="admin-password-wrapper">
              <input
                id="profile-current-pw"
                type={showCurrentPw ? 'text' : 'password'}
                className="admin-input admin-input--password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                tabIndex={-1}
                aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
              >
                <span className={`nf ${showCurrentPw ? 'nf-fa-eye_slash' : 'nf-fa-eye'}`} />
              </button>
            </div>
          </div>

          <div className="admin-input-group">
            <label htmlFor="profile-new-pw" className="admin-label">New Password</label>
            <div className="admin-password-wrapper">
              <input
                id="profile-new-pw"
                type={showNewPw ? 'text' : 'password'}
                className="admin-input admin-input--password"
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowNewPw(!showNewPw)}
                tabIndex={-1}
                aria-label={showNewPw ? 'Hide password' : 'Show password'}
              >
                <span className={`nf ${showNewPw ? 'nf-fa-eye_slash' : 'nf-fa-eye'}`} />
              </button>
            </div>
          </div>

          <div className="admin-input-group">
            <label htmlFor="profile-confirm-pw" className="admin-label">Confirm New Password</label>
            <input
              id="profile-confirm-pw"
              type="password"
              className="admin-input"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="admin-form-actions">
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={saving}
            >
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
