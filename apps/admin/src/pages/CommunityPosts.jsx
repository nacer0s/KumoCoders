import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import AdminLayout from '../components/AdminLayout.jsx'
import SearchFilterBar from '../components/SearchFilterBar.jsx'

export default function CommunityPosts() {
  const { token } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!token) return
    fetchPosts()
  }, [token])

  function fetchPosts() {
    setLoading(true)
    setError('')

    fetch('/api/community/admin/all', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch posts')
        return res.json()
      })
      .then((data) => {
        setPosts(data.posts || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  async function handleTogglePin(postId) {
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/community/admin/pin/${postId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to toggle pin')
      }
      setSuccess('Pin status toggled!')
      fetchPosts()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(postId) {
    if (!window.confirm('Are you sure you want to delete this post? This cannot be undone.')) return

    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/community/admin/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to delete post')
      }
      setSuccess('Post deleted!')
      fetchPosts()
    } catch (err) {
      setError(err.message)
    }
  }

  function truncate(str, len = 60) {
    if (!str) return '—'
    return str.length > len ? str.slice(0, len) + '...' : str
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
    <AdminLayout title="Community Posts">
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <div className="admin-card glass">
        <div className="admin-card-header">
          <div>
            <h2>All Community Posts</h2>
            <p className="admin-text-muted">
              Moderate community discussions — pin important posts or remove spam.
            </p>
          </div>
        </div>

        {loading && (
          <div className="admin-loading">
            <div className="admin-loading-spinner" />
            <p>Loading posts...</p>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <p className="admin-text-muted">No community posts yet.</p>
        )}

        {!loading && posts.length > 0 && (
          <SearchFilterBar
            data={posts}
            searchFields={['title', 'author_display_name', 'author_username']}
            placeholder="Search by title or author…"
            filters={[
              {
                label: 'Pinned',
                key: 'is_pinned',
                options: [
                  { value: '1', label: 'Pinned' },
                  { value: '0', label: 'Not Pinned' },
                ],
              },
            ]}
          >
            {(filtered) => (
              <>
                {filtered.length === 0 ? (
                  <p className="admin-text-muted">No posts match your search.</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Author</th>
                          <th>Pinned</th>
                          <th>Likes</th>
                          <th>Comments</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((post) => (
                          <tr key={post.id}>
                            <td>{post.id}</td>
                            <td className="max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap">
                              {post.title}
                            </td>
                            <td>{post.author_display_name || post.author_username || 'Unknown'}</td>
                            <td>
                              {post.is_pinned ? (
                                <span className="text-success">
                                  <span className="nf nf-fa-thumbtack" /> Pinned
                                </span>
                              ) : (
                                <span className="admin-text-muted">—</span>
                              )}
                            </td>
                            <td>{post.like_count ?? 0}</td>
                            <td>{post.comment_count ?? 0}</td>
                            <td className="whitespace-nowrap">{formatDate(post.created_at)}</td>
                            <td>
                              <div className="flex gap-space-xs flex-wrap">
                                <button
                                  className="admin-btn admin-btn--glass text-font-size-xs"
                                  onClick={() => handleTogglePin(post.id)}
                                  title={post.is_pinned ? 'Unpin' : 'Pin to top'}
                                >
                                  <span className="nf nf-fa-thumbtack" />
                                  {post.is_pinned ? ' Unpin' : ' Pin'}
                                </button>
                                <button
                                  className="admin-btn admin-btn--ghost text-font-size-xs text-error"
                                  onClick={() => handleDelete(post.id)}
                                  title="Delete post"
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
    </AdminLayout>
  )
}
