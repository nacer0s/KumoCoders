import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import AdminLayout from '../components/AdminLayout.jsx'
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx'

export default function SendNotification() {
  const { token } = useAuth()
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lookedUpUser, setLookedUpUser] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleInputChange(value) {
    setUsername(value)
    setLookedUpUser(null)
    setError('')
    setSuccess('')

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 1) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/community/users/search?q=${encodeURIComponent(value.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.users || [])
          setShowResults(true)
        }
      } catch (err) {
        // ignore
      } finally {
        setSearching(false)
      }
    }, 200)
  }

  function selectUser(user) {
    setUsername(user.username)
    setLookedUpUser(user)
    setShowResults(false)
    setSearchResults([])
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!lookedUpUser) {
      setError('Select a user from the search results first')
      return
    }
    setSending(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/community/admin/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: lookedUpUser.username,
          message: message.trim(),
          link: link.trim() || null,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to send notification')
      }
      setSuccess(`Notification sent to @${lookedUpUser.username}`)
      setMessage('')
      setLink('')
      setLookedUpUser(null)
      setUsername('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>Send Notification</h1>
          <p className="admin-text-muted">Send a direct system notification to any user.</p>
        </div>

        {error && <div className="admin-error">{error}</div>}
        {success && <div className="admin-success">{success}</div>}

        <form onSubmit={handleSubmit} className="admin-form max-w-[560px]">
          <div className="admin-form-group" ref={searchRef}>
            <label htmlFor="notify-username">Username</label>
            <div className="admin-search-dropdown">
              <div className="admin-input-row">
                <input
                  id="notify-username"
                  type="text"
                  className="admin-input"
                  placeholder="Type to search users..."
                  value={username}
                  onChange={(e) => handleInputChange(e.target.value)}
                  autoComplete="off"
                />
                {searching && (
                  <div className="admin-btn" style={{ pointerEvents: 'none' }}>
                    <div className="admin-loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  </div>
                )}
              </div>

              {showResults && (
                <div className="admin-search-results">
                  {searchResults.length === 0 ? (
                    <div className="admin-search-no-results">No users found</div>
                  ) : (
                    searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="admin-search-result-item"
                        onClick={() => selectUser(user)}
                      >
                        <div className="admin-avatar admin-avatar--sm">
                          <UserAvatar user={user} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: 'var(--font-size-sm)' }}>{user.display_name || user.username}</strong>
                          <div className="admin-text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>@{user.username}</div>
                        </div>
                        {user.is_verified === 1 && (
                          <span className="admin-badge admin-badge--success">Verified</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {lookedUpUser && (
              <div className="admin-user-preview">
                <div className="admin-avatar admin-avatar--sm">
                  <UserAvatar user={lookedUpUser} />
                </div>
                <div>
                  <strong>{lookedUpUser.display_name || lookedUpUser.username}</strong>
                  <span className="admin-text-muted" style={{ display: 'block', fontSize: 'var(--font-size-xs)' }}>
                    @{lookedUpUser.username}
                  </span>
                </div>
                {lookedUpUser.is_verified === 1 && (
                  <span className="admin-badge admin-badge--success">Verified</span>
                )}
              </div>
            )}
          </div>

          <div className="admin-form-group">
            <label htmlFor="notify-message">Message</label>
            <textarea
              id="notify-message"
              className="admin-textarea"
              placeholder="Enter the notification message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="notify-link">Link (optional)</label>
            <input
              id="notify-link"
              type="text"
              className="admin-input"
              placeholder="/community/post/123 or https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <p className="admin-text-muted" style={{ marginTop: 'var(--space-xs)', fontSize: 'var(--font-size-xs)' }}>
              Link the user will be taken to when they click the notification.
            </p>
          </div>

          <div className="admin-form-actions">
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={sending || !lookedUpUser || !message.trim()}
            >
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
