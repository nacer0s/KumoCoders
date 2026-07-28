import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import AdminLayout from '../components/AdminLayout.jsx'

const STATUS_FILTERS = ['all', 'pending', 'open', 'reviewed', 'in_progress', 'resolved', 'dismissed', 'closed']

function ReportDetailModal({ report, token, onClose, onUpdate }) {
  const [actionStatus, setActionStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isCommunity = report._type === 'community'
  const validActions = isCommunity
    ? [{ value: 'resolved', label: 'Resolved', cls: 'admin-btn--success' }, { value: 'dismissed', label: 'Dismiss', cls: 'admin-btn--muted' }]
    : [
        { value: 'open', label: 'Open', cls: '' },
        { value: 'in_progress', label: 'In Progress', cls: 'admin-badge--info' },
        { value: 'resolved', label: 'Resolved', cls: 'admin-btn--success' },
        { value: 'closed', label: 'Closed', cls: 'admin-btn--muted' },
      ]

  async function handleAction(status) {
    setActionStatus(status)
    setSubmitting(true)
    setError('')
    try {
      if (isCommunity) {
        const res = await fetch(`/api/community/reports/${report.id}/resolve`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status, resolution_notes: notes || null }),
        })
        if (!res.ok) throw new Error('Failed to update')
      } else {
        const res = await fetch(`/api/reports/${report.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status, adminNotes: notes || null }),
        })
        if (!res.ok) throw new Error('Failed to update')
      }
      onUpdate()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
      setActionStatus('')
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-reports-modal-content" onClick={e => e.stopPropagation()}>
        <div className="admin-reports-modal-header">
          <h2>
            <span className={`nf ${isCommunity ? 'nf-fa-flag' : 'nf-fa-bug'}`} style={{ marginRight: 8 }} />
            Report #{report.id}
            <span className="admin-text-muted" style={{ fontWeight: 'normal', fontSize: 'var(--font-size-sm)', marginLeft: 8 }}>
              — {isCommunity ? 'Moderation' : 'Bug Report'}
            </span>
          </h2>
          <button className="admin-reports-modal-close" onClick={onClose}>
            <span className="nf nf-fa-xmark" />
          </button>
        </div>

        <div className="admin-reports-modal-body">
          {/* Title / Reason */}
          <div className="admin-reports-field admin-reports-field--full">
            <div className="admin-reports-field-label">{isCommunity ? 'Reason' : 'Title'}</div>
            <div className="admin-reports-field-value" style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
              {report._title || 'No description'}
            </div>
          </div>

          {/* Description for bug reports */}
          {!isCommunity && report.description && (
            <div className="admin-reports-field admin-reports-field--full">
              <div className="admin-reports-field-label">Description</div>
              <div className="admin-reports-field-value admin-reports-field-value--pre">{report.description}</div>
            </div>
          )}

          {/* Grid details */}
          <div className="admin-reports-field-group">
            <div className="admin-reports-field">
              <div className="admin-reports-field-label">Status</div>
              <div className="admin-reports-field-value">
                <span className="admin-badge">{report.status.replace('_', ' ')}</span>
              </div>
            </div>
            <div className="admin-reports-field">
              <div className="admin-reports-field-label">Source</div>
              <div className="admin-reports-field-value">{isCommunity ? 'Community Moderation' : 'Bug Report'}</div>
            </div>
            <div className="admin-reports-field">
              <div className="admin-reports-field-label">Type</div>
              <div className="admin-reports-field-value">
                <span className="admin-badge">{isCommunity ? report.target_type : report.type}</span>
              </div>
            </div>
            <div className="admin-reports-field">
              <div className="admin-reports-field-label">{isCommunity ? 'Target' : 'Severity'}</div>
              <div className="admin-reports-field-value">
                {isCommunity ? `#${report.target_id}` : (
                  <span className={`admin-badge ${report.severity === 'critical' ? 'admin-badge--error' : report.severity === 'high' ? 'admin-badge--warning' : report.severity === 'low' ? 'admin-badge--muted' : 'admin-badge--info'}`}>
                    {report.severity}
                  </span>
                )}
              </div>
            </div>
            <div className="admin-reports-field">
              <div className="admin-reports-field-label">Submitted By</div>
              <div className="admin-reports-field-value">{report._submittedBy}</div>
            </div>
            <div className="admin-reports-field">
              <div className="admin-reports-field-label">Created</div>
              <div className="admin-reports-field-value">{new Date(report.created_at).toLocaleString()}</div>
            </div>
            {report.reviewed_at && (
              <div className="admin-reports-field">
                <div className="admin-reports-field-label">Reviewed</div>
                <div className="admin-reports-field-value">{new Date(report.reviewed_at).toLocaleString()}</div>
              </div>
            )}
            {report.resolution_notes && (
              <div className="admin-reports-field admin-reports-field--full">
                <div className="admin-reports-field-label">Resolution Notes</div>
                <div className="admin-reports-field-value admin-reports-field-value--pre">{report.resolution_notes}</div>
              </div>
            )}
            {report.admin_notes && (
              <div className="admin-reports-field admin-reports-field--full">
                <div className="admin-reports-field-label">Admin Notes</div>
                <div className="admin-reports-field-value admin-reports-field-value--pre">{report.admin_notes}</div>
              </div>
            )}
          </div>
        </div>

        <div className="admin-reports-modal-footer">
          {error && <div className="admin-error" style={{ margin: 0 }}>{error}</div>}
          <div className="admin-reports-notes">
            <textarea
              placeholder="Add admin notes or resolution reason..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div className="admin-reports-actions">
            <span className="admin-text-muted" style={{ fontSize: 'var(--font-size-xs)', marginRight: 'auto' }}>
              Change status:
            </span>
            {validActions.map(action => (
              <button
                key={action.value}
                className={`admin-btn admin-btn--sm ${action.cls}`}
                onClick={() => handleAction(action.value)}
                disabled={submitting || report.status === action.value}
                style={{ padding: '6px 14px' }}
              >
                {submitting && actionStatus === action.value ? '...' : action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReportsList() {
  const { token } = useAuth()
  const [communityReports, setCommunityReports] = useState([])
  const [bugReports, setBugReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedReport, setSelectedReport] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const [communityRes, bugRes] = await Promise.all([
        fetch('/api/community/reports?page=1', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/reports?page=1', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      setCommunityReports(communityRes.ok ? (await communityRes.json()).reports || [] : [])
      setBugReports(bugRes.ok ? (await bugRes.json()).reports || [] : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchAll() }, [fetchAll])

  const allReports = useMemo(() => {
    const community = (communityReports || []).map(r => ({
      ...r,
      _type: 'community',
      _sortDate: new Date(r.created_at || 0).getTime(),
      _title: r.reason || '',
      _submittedBy: r.reporter_display_name || r.reporter_username || 'Unknown',
      _detail: r.target_type ? `#${r.target_id}` : '',
    }))
    const bugs = (bugReports || []).map(r => ({
      ...r,
      _type: 'bug',
      _sortDate: new Date(r.created_at || 0).getTime(),
      _title: r.title || '',
      _submittedBy: r.user_display_name || r.user_username || `#${r.user_id}`,
      _detail: r.severity || '',
    }))
    return [...community, ...bugs].sort((a, b) => b._sortDate - a._sortDate)
  }, [communityReports, bugReports])

  const filteredReports = useMemo(() => {
    if (statusFilter === 'all') return allReports
    return allReports.filter(r => r.status === statusFilter)
  }, [allReports, statusFilter])

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>Reports</h1>
          <p className="admin-text-muted">{allReports.length} total report{allReports.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="admin-tabs">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`admin-tab ${statusFilter === s ? 'admin-tab--active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
              {s !== 'all' && ` (${allReports.filter(r => r.status === s).length})`}
            </button>
          ))}
        </div>

        {error && <div className="admin-error">{error}</div>}

        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner" />
            <p>Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="admin-empty">
            <span className="nf nf-fa-ticket" style={{ fontSize: '2.5rem', opacity: 0.3, display: 'block', marginBottom: 'var(--space-sm)' }} />
            <p>No reports found.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Content</th>
                  <th>Submitted By</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={`${report._type}-${report.id}`}>
                    <td>#{report.id}</td>
                    <td>
                      <span className={`admin-badge ${report._type === 'community' ? 'admin-badge--info' : ''}`}>
                        <span className={`nf ${report._type === 'community' ? 'nf-fa-flag' : 'nf-fa-bug'}`} style={{ marginRight: 4 }} />
                        {report._type === 'community' ? 'Moderation' : 'Bug'}
                      </span>
                    </td>
                    <td><span className="admin-badge">{report._type === 'community' ? report.target_type : report.type}</span></td>
                    <td className="max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap">{report._title}</td>
                    <td>{report._submittedBy}</td>
                    <td>
                      <span className={`admin-badge ${report.status === 'resolved' ? 'admin-badge--success' : report.status === 'dismissed' || report.status === 'closed' ? 'admin-badge--muted' : report.status === 'in_progress' || report.status === 'reviewed' ? 'admin-badge--info' : report.status === 'pending' ? 'admin-badge--warning' : ''}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="admin-text-muted">{new Date(report.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="admin-btn admin-btn--sm admin-btn--ghost"
                        onClick={() => setSelectedReport(report)}
                        title="View details"
                      >
                        <span className="nf nf-fa-magnifying_glass" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport && (
          <ReportDetailModal
            report={selectedReport}
            token={token}
            onClose={() => setSelectedReport(null)}
            onUpdate={fetchAll}
          />
        )}
      </div>
    </AdminLayout>
  )
}
