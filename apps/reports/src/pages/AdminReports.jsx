import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'

const STATUS_FILTERS = ['all', 'open', 'in_progress', 'resolved', 'closed']
const TYPE_FILTERS = ['all', 'bug', 'feature', 'feedback', 'other']

const STATUS_BADGE = {
  open: '',
  in_progress: 'info',
  resolved: 'success',
  closed: 'muted',
}

function ReportDetailModal({ report, onClose, onUpdate }) {
  const { token } = useAuth()
  const [updating, setUpdating] = useState(false)

  async function handleStatusChange(newStatus) {
    if (updating) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update report')
      onUpdate()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="reports-modal-backdrop" onClick={onClose}>
      <div className="reports-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reports-modal-header">
          <h2>Report #{report.id}</h2>
          <button className="reports-modal-close" onClick={onClose}>
            <span className="nf nf-fa-xmark" />
          </button>
        </div>
        <div className="reports-modal-body">
          <div className="reports-modal-field">
            <div className="reports-modal-label">Title</div>
            <div className="reports-modal-value" style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
              {report.title}
            </div>
          </div>
          <div className="reports-modal-field">
            <div className="reports-modal-label">Description</div>
            <div className="reports-modal-value" style={{ whiteSpace: 'pre-wrap' }}>
              {report.description || 'No description provided.'}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
            <div className="reports-modal-field">
              <div className="reports-modal-label">Type</div>
              <div className="reports-modal-value">
                <span className="reports-badge">{report.type}</span>
              </div>
            </div>
            <div className="reports-modal-field">
              <div className="reports-modal-label">Severity</div>
              <div className="reports-modal-value">
                <span className={`reports-badge reports-badge--${report.severity === 'critical' ? 'error' : report.severity === 'high' ? 'warning' : report.severity === 'low' ? 'muted' : 'info'}`}>
                  {report.severity}
                </span>
              </div>
            </div>
            <div className="reports-modal-field">
              <div className="reports-modal-label">Status</div>
              <div className="reports-modal-value">
                <span className={`reports-badge reports-badge--${STATUS_BADGE[report.status] || ''}`}>
                  {report.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="reports-modal-field">
              <div className="reports-modal-label">Submitted by</div>
              <div className="reports-modal-value">
                {report.user_display_name || report.user_username || `#${report.user_id}`}
              </div>
            </div>
            <div className="reports-modal-field">
              <div className="reports-modal-label">Created</div>
              <div className="reports-modal-value">
                {new Date(report.created_at).toLocaleString()}
              </div>
            </div>
            <div className="reports-modal-field">
              <div className="reports-modal-label">Updated</div>
              <div className="reports-modal-value">
                {report.updated_at ? new Date(report.updated_at).toLocaleString() : '-'}
              </div>
            </div>
          </div>
        </div>
        <div className="reports-modal-actions">
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginRight: 'auto' }}>
            Change status:
          </span>
          {['open', 'in_progress', 'resolved', 'closed'].map((s) => (
            <button
              key={s}
              className={`reports-btn ${report.status === s ? 'reports-btn--primary' : ''}`}
              onClick={() => handleStatusChange(s)}
              disabled={updating || report.status === s}
              style={{ padding: 'var(--space-xs) var(--space-md)', fontSize: 'var(--font-size-xs)' }}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminReports() {
  const { user, token } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedReport, setSelectedReport] = useState(null)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetchReports()
  }, [token, statusFilter, typeFilter, page])

  async function fetchReports() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      params.set('page', page.toString())

      const res = await fetch(`/api/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        if (res.status === 403) throw new Error('Admin access required')
        throw new Error('Failed to fetch reports')
      }
      const data = await res.json()
      setReports(data.reports || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return reports
    const q = searchQuery.toLowerCase()
    return reports.filter(r =>
      r.title?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.user_username?.toLowerCase().includes(q) ||
      r.user_display_name?.toLowerCase().includes(q)
    )
  }, [reports, searchQuery])

  const stats = useMemo(() => {
    const s = { total: reports.length }
    for (const r of reports) {
      s[r.status] = (s[r.status] || 0) + 1
      s[r.type] = (s[r.type] || 0) + 1
    }
    return s
  }, [reports])

  const isAdmin = user?.role === 'admin'
  const totalPages = Math.ceil(total / 20)

  if (!token) {
    return (
      <div className="reports-page">
        <div className="reports-page-header">
          <h1>Admin — Reports</h1>
        </div>
        <div className="reports-card reports-card--empty">
          <span className="nf nf-fa-lock" style={{ fontSize: '2rem', opacity: 0.4 }} />
          <p>Sign in with an admin account to manage reports.</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="reports-page">
        <div className="reports-page-header">
          <h1>Admin — Reports</h1>
        </div>
        <div className="reports-card reports-card--empty">
          <span className="nf nf-fa-shield" style={{ fontSize: '2rem', opacity: 0.4 }} />
          <p>You don't have admin access.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="reports-page">
      <div className="reports-page-header">
        <h1>Admin — Reports</h1>
        <p className="reports-text-muted">Manage all submitted reports ({total} total).</p>
      </div>

      {error && <div className="reports-error">{error}</div>}

      <div className="reports-stats">
        <div className="reports-stat">
          <span className="reports-stat-value">{stats.total || 0}</span>
          <span className="reports-stat-label">Total</span>
        </div>
        <div className="reports-stat">
          <span className="reports-stat-value" style={{ color: 'var(--color-text-muted)' }}>{stats.open || 0}</span>
          <span className="reports-stat-label">Open</span>
        </div>
        <div className="reports-stat">
          <span className="reports-stat-value" style={{ color: '#60a5fa' }}>{stats.in_progress || 0}</span>
          <span className="reports-stat-label">In Progress</span>
        </div>
        <div className="reports-stat">
          <span className="reports-stat-value" style={{ color: 'var(--color-success)' }}>{stats.resolved || 0}</span>
          <span className="reports-stat-label">Resolved</span>
        </div>
        <div className="reports-stat">
          <span className="reports-stat-value" style={{ color: '#a78bfa' }}>{stats.closed || 0}</span>
          <span className="reports-stat-label">Closed</span>
        </div>
      </div>

      <div className="reports-filters">
        <div className="reports-filter-row">
          <label>Status</label>
          <div className="reports-filter-tabs">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                className={`reports-filter-tab ${statusFilter === s ? 'reports-filter-tab--active' : ''}`}
                onClick={() => { setStatusFilter(s); setPage(1) }}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="reports-filter-row">
          <label>Type</label>
          <div className="reports-filter-tabs">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                className={`reports-filter-tab ${typeFilter === t ? 'reports-filter-tab--active' : ''}`}
                onClick={() => { setTypeFilter(t); setPage(1) }}
              >
                {t === 'all' ? 'All' : t}
                {t !== 'all' && stats[t] > 0 && ` (${stats[t]})`}
              </button>
            ))}
          </div>
        </div>
        <div className="reports-filter-row">
          <label>Search</label>
          <div className="reports-search">
            <span className="nf nf-fa-magnifying_glass" />
            <input
              type="text"
              placeholder="Search by title, description, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="reports-loading">
          <div className="reports-loading-spinner" />
          <p>Loading reports...</p>
        </div>
      ) : filteredBySearch.length === 0 ? (
        <div className="reports-card reports-card--empty">
          <span className="nf nf-fa-inbox" style={{ fontSize: '2.5rem', opacity: 0.3 }} />
          <p>{searchQuery ? 'No reports match your search.' : 'No reports found matching your filters.'}</p>
        </div>
      ) : (
        <div className="reports-table-wrap">
          <table className="reports-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Title</th>
                <th>User</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBySearch.map((report) => (
                <tr key={report.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedReport(report)}>
                  <td>#{report.id}</td>
                  <td><span className="reports-badge">{report.type}</span></td>
                  <td><span className="reports-table-title">{report.title}</span></td>
                  <td>{report.user_display_name || report.user_username || `#${report.user_id}`}</td>
                  <td>
                    <span className={`reports-badge reports-badge--${report.severity === 'critical' ? 'error' : report.severity === 'high' ? 'warning' : report.severity === 'low' ? 'muted' : 'info'}`}>
                      {report.severity}
                    </span>
                  </td>
                  <td>
                    <span className={`reports-badge reports-badge--${STATUS_BADGE[report.status] || ''}`}>
                      {report.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="reports-text-muted">{new Date(report.created_at).toLocaleDateString()}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      className="reports-select reports-select--sm"
                      value={report.status}
                      onChange={(e) => {
                        const newStatus = e.target.value
                        fetch(`/api/reports/${report.id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ status: newStatus }),
                        }).then(() => fetchReports())
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className="reports-pagination">
          <button
            className="reports-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="reports-pagination-info">Page {page} of {totalPages}</span>
          <button
            className="reports-btn"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      )}

      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdate={fetchReports}
        />
      )}
    </div>
  )
}
