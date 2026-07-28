import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { navigateTo } from '../App.jsx'

const BUG_STATUS_ICONS = {
  open: 'nf-fa-clock_o',
  in_progress: 'nf-fa-cog',
  resolved: 'nf-fa-check_circle',
  closed: 'nf-fa-archive',
}
const BUG_STATUS_COLORS = {
  open: 'var(--color-text-muted)',
  in_progress: '#3b82f6',
  resolved: 'var(--color-success)',
  closed: '#8b5cf6',
}

const COMMUNITY_STATUS_ICONS = {
  pending: 'nf-fa-clock_o',
  reviewed: 'nf-fa-eye',
  resolved: 'nf-fa-check_circle',
  dismissed: 'nf-fa-ban',
}
const COMMUNITY_STATUS_COLORS = {
  pending: 'var(--color-text-muted)',
  reviewed: '#3b82f6',
  resolved: 'var(--color-success)',
  dismissed: '#a1a1aa',
}

const STATUS_FILTERS = ['all', 'pending', 'open', 'reviewed', 'in_progress', 'resolved', 'dismissed', 'closed']

export default function MyReports() {
  const { user, token } = useAuth()
  const [bugReports, setBugReports] = useState([])
  const [communityReports, setCommunityReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetchAll()
  }, [token])

  async function fetchAll() {
    setLoading(true)
    setError('')
    try {
      const [bugRes, communityRes] = await Promise.all([
        fetch('/api/reports/my', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/community/reports/my', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      setBugReports(bugRes.ok ? (await bugRes.json()).reports || [] : [])
      setCommunityReports(communityRes.ok ? (await communityRes.json()).reports || [] : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const allReports = useMemo(() => {
    const bugs = (bugReports || []).map((r) => ({
      ...r,
      _type: 'bug',
      _sortDate: new Date(r.created_at || 0).getTime(),
      _icon: BUG_STATUS_ICONS[r.status] || 'nf-fa-clock_o',
      _iconColor: BUG_STATUS_COLORS[r.status] || 'var(--color-text-muted)',
      _badgeClass: r.status === 'in_progress' ? 'info' : r.status === 'resolved' ? 'success' : r.status === 'closed' ? 'muted' : '',
    }))
    const community = (communityReports || []).map((r) => ({
      ...r,
      _type: 'community',
      _sortDate: new Date(r.created_at || 0).getTime(),
      _icon: COMMUNITY_STATUS_ICONS[r.status] || 'nf-fa-flag',
      _iconColor: COMMUNITY_STATUS_COLORS[r.status] || 'var(--color-text-muted)',
      _badgeClass: r.status === 'reviewed' ? 'info' : r.status === 'resolved' ? 'success' : r.status === 'dismissed' ? 'muted' : r.status === 'pending' ? 'warning' : '',
    }))
    return [...bugs, ...community].sort((a, b) => b._sortDate - a._sortDate)
  }, [bugReports, communityReports])

  const filteredReports = useMemo(() => {
    if (statusFilter === 'all') return allReports
    return allReports.filter((r) => r.status === statusFilter)
  }, [allReports, statusFilter])

  if (!token) {
    return (
      <div className="reports-page">
        <div className="reports-page-header">
          <h1>My Reports</h1>
        </div>
        <div className="reports-card reports-card--empty">
          <span className="nf nf-fa-lock" style={{ fontSize: '2rem', opacity: 0.4 }} />
          <p>Sign in to view your reports.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="reports-page">
      <div className="reports-page-header">
        <h1>My Reports</h1>
        <p className="reports-text-muted">{allReports.length} total report{allReports.length !== 1 ? 's' : ''}</p>
      </div>

      {error && <div className="reports-error">{error}</div>}

      {allReports.length > 0 && (
        <div className="reports-filters">
          <div className="reports-filter-row">
            <label>Status</label>
            <div className="reports-filter-tabs">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  className={`reports-filter-tab ${statusFilter === s ? 'reports-filter-tab--active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'All' : s.replace('_', ' ')}
                  {s !== 'all' && ` (${allReports.filter(r => r.status === s).length})`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="reports-loading">
          <div className="reports-loading-spinner" />
          <p>Loading your reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="reports-card reports-card--empty">
          <span className="nf nf-fa-inbox" style={{ fontSize: '2.5rem', opacity: 0.3 }} />
          <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 'var(--font-size-lg)' }}>
            {statusFilter !== 'all' ? 'No matching reports' : 'No reports yet'}
          </h3>
          <p className="reports-text-muted">
            {statusFilter !== 'all'
              ? 'No reports with this status.'
              : "You haven't submitted any reports yet. Found a bug or have an idea?"}
          </p>
          {statusFilter === 'all' && (
            <button className="reports-btn reports-btn--primary" onClick={() => navigateTo('/reports')}>
              Submit a Report
            </button>
          )}
        </div>
      ) : (
        <div className="reports-list">
          {filteredReports.map((report) => (
            <div
              key={`${report._type}-${report.id}`}
              className="reports-list-item"
              onClick={() => setExpandedId(expandedId === `${report._type}-${report.id}` ? null : `${report._type}-${report.id}`)}
            >
              <div className="reports-list-item-icon">
                <span className={`nf ${report._icon}`} style={{ color: report._iconColor }} />
              </div>
              <div className="reports-list-item-body">
                <div className="reports-list-item-header">
                  <h3>{report._type === 'community' ? report.reason || 'Report' : report.title}</h3>
                  <span className={`reports-badge reports-badge--${report._badgeClass}`}>
                    {report.status.replace('_', ' ')}
                  </span>
                </div>

                {report._type === 'bug' && (
                  <p className={`reports-list-item-desc ${expandedId === `${report._type}-${report.id}` ? 'reports-list-item-desc--expanded' : ''}`}>
                    {report.description}
                  </p>
                )}

                {expandedId === `${report._type}-${report.id}` && report.admin_notes && (
                  <div style={{
                    marginTop: 'var(--space-sm)',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-sm)',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <span className="nf nf-fa-pen_to_square" style={{ marginRight: 4 }} />
                      Admin Note
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text)', lineHeight: 1.6 }}>{report.admin_notes}</div>
                  </div>
                )}

                {expandedId === `${report._type}-${report.id}` && report.resolution_notes && (
                  <div style={{
                    marginTop: 'var(--space-sm)',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-sm)',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <span className="nf nf-fa-gavel" style={{ marginRight: 4 }} />
                      Resolution Note{report.reviewer_username ? ` (by ${report.reviewer_username})` : ''}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text)', lineHeight: 1.6 }}>{report.resolution_notes}</div>
                  </div>
                )}

                {expandedId === `${report._type}-${report.id}` && report.updated_at && report.updated_at !== report.created_at && (
                  <div className="reports-text-muted" style={{ marginTop: 'var(--space-xs)', fontSize: 'var(--font-size-xs)' }}>
                    Last updated: {new Date(report.updated_at).toLocaleString()}
                  </div>
                )}

                <div className="reports-list-item-meta">
                  {report._type === 'community' ? (
                    <>
                      <span className="reports-badge reports-badge--info">
                        <span className="nf nf-fa-flag" style={{ marginRight: 4 }} />
                        Moderation
                      </span>
                      <span className="reports-badge">{report.target_type}</span>
                      {report.target_id && <span className="reports-text-muted">Target: #{report.target_id}</span>}
                    </>
                  ) : (
                    <>
                      <span className="reports-badge">
                        <span className="nf nf-fa-bug" style={{ marginRight: 4 }} />
                        {report.type}
                      </span>
                      {report.severity && (
                        <span className={`reports-badge reports-badge--${report.severity === 'critical' ? 'error' : report.severity === 'high' ? 'warning' : 'info'}`}>
                          {report.severity}
                        </span>
                      )}
                    </>
                  )}
                  <span className="reports-text-muted">{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
