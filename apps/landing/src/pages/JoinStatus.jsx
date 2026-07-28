import { useState, useEffect } from 'react'

const STATUS_INFO = {
  pending: { label: 'Under Review', icon: 'nf-fa-clock', color: 'text-yellow-500 border-yellow-500/25 bg-yellow-500/10' },
  accepted: { label: 'Accepted!', icon: 'nf-fa-check_circle', color: 'text-success border-success/25 bg-success/10' },
  refused: { label: 'Not selected', icon: 'nf-fa-circle_xmark', color: 'text-error border-error/25 bg-error/10' },
}

export default function JoinStatus() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (t) {
      setToken(t)
      lookupStatus(t)
    }
  }, [])

  async function lookupStatus(t) {
    const lookupToken = t || token
    if (!lookupToken.trim()) {
      setError('Please enter your tracking code.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`/api/join/track/${lookupToken.trim()}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error('Application not found. Check your tracking code.')
        throw new Error('Failed to look up status.')
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    lookupStatus()
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    try { return new Date(dateStr).toLocaleString() } catch { return dateStr }
  }

  const statusInfo = result ? STATUS_INFO[result.status] || STATUS_INFO.pending : null

  return (
    <div className="pt-[120px] max-md:pt-[100px] pb-20 max-md:pb-[60px] max-w-[560px] mx-auto min-h-[60vh] px-space-xl max-md:px-space-md">
      <div className="text-center mb-space-xl">
        <h1 className="text-font-size-2xl max-md:text-font-size-xl font-bold tracking-[-0.02em] mb-space-sm">Check Application Status</h1>
        <p className="text-text-muted text-font-size-base">Enter your tracking code to see your application status.</p>
      </div>

      <div className="bg-surface border border-border rounded-radius-lg max-md:rounded-radius-md p-space-xl max-md:p-space-md">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-space-sm max-md:flex-col">
            <input
              type="text"
              className="flex-1 px-4 py-3 bg-[var(--color-bg)] border border-border rounded-radius-md text-text text-font-size-sm font-text outline-none focus:border-text max-md:text-base"
              placeholder="Paste your tracking code here..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoFocus={!token}
            />
            <button type="submit" className="px-6 py-3 bg-text text-[var(--color-bg)] border-none rounded-radius-md text-font-size-sm font-semibold cursor-pointer whitespace-nowrap hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed max-md:w-full max-md:justify-center" disabled={loading}>
              {loading ? 'Checking...' : 'Check'}
            </button>
          </div>
        </form>

        {error && <p className="text-error text-font-size-sm mt-space-md text-center">{error}</p>}

        {result && statusInfo && (
          <div className="mt-space-lg text-center">
            <div className={`inline-flex items-center gap-space-sm px-5 py-2 rounded-radius-md font-semibold text-font-size-base mb-space-md ${statusInfo.color}`}>
              <span className={`nf ${statusInfo.icon}`} />
              {statusInfo.label}
            </div>
            <div className="text-text-muted text-font-size-sm leading-relaxed">
              {result.status_updated_at && <p>Last updated: {formatDate(result.status_updated_at)}</p>}
              <p>Submitted: {formatDate(result.created_at)}</p>
            </div>
          </div>
        )}

        {!result && !error && (
          <p className="text-text-muted text-font-size-sm text-center mt-space-md leading-relaxed">
            After submitting your application, you received a tracking code. Enter it above to check your current status.
          </p>
        )}
      </div>
    </div>
  )
}
