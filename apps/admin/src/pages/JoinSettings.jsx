import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { navigateTo } from '../App.jsx'
import AdminLayout from '../components/AdminLayout.jsx'

export default function JoinSettings() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [data, setData] = useState({ title: '', subtitle: '', body: '', metadata: {} })

  useEffect(() => {
    if (!token) return
    setLoading(true)
    setError('')

    fetch('/api/content/join', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch join section')
        return res.json()
      })
      .then((res) => {
        const section = res.content || res
        setData({
          title: section.title ?? '',
          subtitle: section.subtitle ?? '',
          body: section.body ?? '',
          metadata: section.metadata || {},
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  function onChange(updated) {
    setData(updated)
  }

  const meta = data.metadata || {}

  // Format a datetime value for datetime-local input
  function toDatetimeLocal(val) {
    if (!val) return ''
    try {
      const d = new Date(val)
      if (isNaN(d.getTime())) return ''
      const pad = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch { return '' }
  }

  // Determine current status text
  function getStatusText() {
    const now = Date.now()
    const opensAt = meta.opens_at ? new Date(meta.opens_at).getTime() : null
    const closesAt = meta.closes_at ? new Date(meta.closes_at).getTime() : null

    if (meta.is_open === false) return { text: 'Manually closed', color: 'var(--color-error)' }
    if (opensAt && now < opensAt) {
      const diff = Math.ceil((opensAt - now) / 1000 / 60)
      if (diff < 60) return { text: `Opens in ${diff} min`, color: 'var(--color-warning, #eab308)' }
      return { text: `Opens at ${new Date(opensAt).toLocaleString()}`, color: 'var(--color-warning, #eab308)' }
    }
    if (closesAt && now >= closesAt) return { text: 'Closed per schedule', color: 'var(--color-error)' }
    if (opensAt || closesAt) return { text: 'Open (scheduled)', color: '#22c55e' }
    if (meta.is_open !== false) return { text: 'Open', color: '#22c55e' }
    return { text: 'Closed', color: 'var(--color-error)' }
  }

  const status = getStatusText()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const res = await fetch('/api/content/join', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: data.title,
          subtitle: data.subtitle,
          body: data.body,
          metadata: data.metadata,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || errData.error || 'Failed to save')
      }

      setSuccess('Join settings saved successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Join Settings">
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading join settings...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Join Settings">
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <div className="flex justify-end mb-space-md">
        <button className="admin-btn admin-btn--glass" onClick={() => navigateTo('/admin/join/applications')}>
          <span className="nf nf-fa-list" /> View Applications
        </button>
      </div>

      <div className="admin-card glass">
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-input-group">
            <label className="admin-label">Title</label>
            <input type="text" className="admin-input" placeholder="Join page title" value={data.title ?? ''} onChange={(e) => onChange({ ...data, title: e.target.value })} />
          </div>
          <div className="admin-input-group">
            <label className="admin-label">Subtitle</label>
            <input type="text" className="admin-input" placeholder="Page subtitle / tagline" value={data.subtitle ?? ''} onChange={(e) => onChange({ ...data, subtitle: e.target.value })} />
          </div>
          <div className="admin-input-group">
            <label className="admin-label">Body / Description</label>
            <textarea className="admin-textarea" placeholder="Description text shown above the form" rows={4} value={data.body ?? ''} onChange={(e) => onChange({ ...data, body: e.target.value })} />
          </div>

          {/* ─── Schedule ─── */}
          <div className="admin-card px-space-lg py-space-md mb-space-lg bg-white/5">
            <h4 className="m-0 mb-space-md text-font-size-sm font-font-weight-semibold tracking-wide opacity-70 uppercase">
              <span className="nf nf-fa-clock mr-1.5" /> Form Schedule
            </h4>

            <div className="flex gap-space-md flex-wrap mb-space-md">
              <div className="admin-input-group flex-[1_1_220px] mb-0">
                <label className="admin-label">Opens at</label>
                <input
                  type="datetime-local"
                  className="admin-input"
                  value={toDatetimeLocal(meta.opens_at)}
                  onChange={(e) => onChange({ ...data, metadata: { ...meta, opens_at: e.target.value ? new Date(e.target.value).toISOString() : '' } })}
                />
                <p className="admin-text-muted mt-1">Leave empty for no scheduled open</p>
              </div>
              <div className="admin-input-group flex-[1_1_220px] mb-0">
                <label className="admin-label">Closes at</label>
                <input
                  type="datetime-local"
                  className="admin-input"
                  value={toDatetimeLocal(meta.closes_at)}
                  onChange={(e) => onChange({ ...data, metadata: { ...meta, closes_at: e.target.value ? new Date(e.target.value).toISOString() : '' } })}
                />
                <p className="admin-text-muted mt-1">Leave empty for no scheduled close</p>
              </div>
            </div>

            <div className="flex items-center gap-space-sm px-space-md py-2 rounded-radius-sm bg-white/[0.04]">
              <span className="font-font-weight-semibold text-font-size-sm">Status:</span>
              <span className="font-font-weight-semibold text-font-size-sm" style={{ color: status.color }}>{status.text}</span>
            </div>
          </div>

          {/* ─── Manual Override ─── */}
          <div className="admin-input-group mb-space-lg">
            <label className="admin-label flex items-center gap-space-sm">
              <input
                type="checkbox"
                checked={meta.is_open !== false}
                onChange={(e) => onChange({ ...data, metadata: { ...meta, is_open: e.target.checked } })}
                className="w-[18px] h-[18px] accent-text"
              />
              <span>Manual override — form is open</span>
            </label>
            <p className="admin-text-muted mt-space-xs">
              When unchecked, the form stays closed regardless of schedule.
            </p>
          </div>

          <div className="admin-input-group">
            <label className="admin-label">Success Message (shown after submission)</label>
            <textarea className="admin-textarea" placeholder="Thank you message" rows={3} value={meta.success_message ?? ''} onChange={(e) => onChange({ ...data, metadata: { ...meta, success_message: e.target.value } })} />
          </div>
          <div className="admin-input-group">
            <label className="admin-label">Closed Message (shown when form is closed)</label>
            <textarea className="admin-textarea" placeholder="Applications closed message" rows={3} value={meta.closed_message ?? ''} onChange={(e) => onChange({ ...data, metadata: { ...meta, closed_message: e.target.value } })} />
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
