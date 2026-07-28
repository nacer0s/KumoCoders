import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { navigateTo } from '../App.jsx'
import AdminLayout from '../components/AdminLayout.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'

const INTEREST_LABELS = {
  join_team: 'Join the KumoCoders team',
  collaborate: 'Collaborate on a project',
  open_source: 'Contribute to open source',
  general: 'General interest / Stay updated',
  other: 'Other',
}

const EXPERIENCE_LABELS = {
  '0-1': 'Less than 1 year',
  '1-3': '1-3 years',
  '3-5': '3-5 years',
  '5-10': '5-10 years',
  '10+': '10+ years',
}

const AVAILABILITY_LABELS = {
  few_hours: 'A few hours per week',
  part_time: 'Part-time',
  full_time: 'Full-time',
  weekends: 'Weekends only',
  not_sure: 'Not sure yet',
}

const STATUS_BADGES = {
  pending: { label: 'Pending', color: '#eab308', icon: 'nf-fa-clock' },
  accepted: { label: 'Accepted', color: '#22c55e', icon: 'nf-fa-check_circle' },
  refused: { label: 'Refused', color: '#ef4444', icon: 'nf-fa-circle_xmark' },
}

export default function JoinApplicationDetail({ submissionId }) {
  const { token } = useAuth()
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  // Modal states
  const [showRefuseModal, setShowRefuseModal] = useState(false)
  const [refuseLoading, setRefuseLoading] = useState(false)

  useEffect(() => {
    if (!token || !submissionId) return
    setLoading(true)
    setError('')

    fetch(`/api/join/admin/${submissionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch application')
        return res.json()
      })
      .then((data) => {
        if (!data.submission) throw new Error('Application not found')
        setSubmission(data.submission)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token, submissionId])

  async function handleAccept() {
    setActionLoading('accept')
    setError('')
    try {
      const res = await fetch(`/api/join/admin/${submissionId}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to accept')
      }
      navigateTo(`/admin/join/applications/${submissionId}/create-user`)
    } catch (err) {
      setError(err.message)
      setActionLoading('')
    }
  }

  async function handleRefuse() {
    setShowRefuseModal(false)
    setRefuseLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/join/admin/${submissionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to delete')
      }
      navigateTo('/admin/join/applications')
    } catch (err) {
      setError(err.message)
      setRefuseLoading(false)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Application Details">
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading application...</p>
        </div>
      </AdminLayout>
    )
  }

  if (error && !submission) {
    return (
      <AdminLayout title="Application Details">
        <div className="admin-error">{error}</div>
        <button className="admin-btn admin-btn--ghost" onClick={() => navigateTo('/admin/join/applications')}>
          <span className="nf nf-fa-arrow_left" /> Back to Applications
        </button>
      </AdminLayout>
    )
  }

  if (!submission) return null

  const s = submission
  const badge = STATUS_BADGES[s.status] || STATUS_BADGES.pending

  return (
    <AdminLayout title={`Application: ${s.first_name} ${s.last_name}`}>
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-card glass">
        {/* ─── Header ─── */}
        <div className="flex justify-between items-start mb-space-lg flex-wrap gap-space-md">
          <div>
            <div className="flex items-center gap-space-sm mb-space-xs">
              <h2 className="m-0">{s.first_name} {s.last_name}</h2>
              <span
                className={`inline-flex items-center gap-[4px] px-[10px] py-[3px] rounded-radius-sm text-font-size-xs font-font-weight-semibold ${
                  s.status === 'accepted' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                  s.status === 'refused' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                  'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                }`}
              >
                <span className={`nf ${badge.icon}`} /> {badge.label}
              </span>
            </div>
            <p className="admin-text-muted mt-1">
              Submitted {formatDate(s.created_at)}
              {s.status_updated_at && ` · ${badge.label} ${formatDate(s.status_updated_at)}`}
            </p>
          </div>
          <div className="flex gap-space-sm flex-wrap">
            <button className="admin-btn admin-btn--ghost" onClick={() => navigateTo('/admin/join/applications')}>
              <span className="nf nf-fa-arrow_left" /> Back
            </button>
          </div>
        </div>

        {/* ─── Action Buttons ─── */}
        {s.status === 'pending' && (
          <div className="flex gap-space-sm mb-space-lg pb-space-lg border-b border-border">
            <button
              className="admin-btn bg-green-500 text-white border-none"
              onClick={handleAccept}
              disabled={!!actionLoading || refuseLoading}
            >
              <span className="nf nf-fa-check" /> {actionLoading === 'accept' ? 'Processing...' : 'Accept & Create User'}
            </button>
            <button
              className="admin-btn bg-red-500/10 text-error border border-red-500/20"
              onClick={() => setShowRefuseModal(true)}
              disabled={!!actionLoading || refuseLoading}
            >
              <span className="nf nf-fa-ban" /> {refuseLoading ? 'Refusing...' : 'Refuse & Delete'}
            </button>
          </div>
        )}

        {/* ─── Fields ─── */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-space-md">
          <Field label="First Name" value={s.first_name} />
          <Field label="Last Name" value={s.last_name} />
          <Field label="Email" value={s.email} href={`mailto:${s.email}`} />
          <Field label="Phone" value={s.phone} />
          <Field label="Country / Location" value={s.country} />
          <Field label="Current Role" value={s.current_role} />
          <Field label="Years of Experience" value={EXPERIENCE_LABELS[s.years_experience] || s.years_experience} />
          <Field label="Availability" value={AVAILABILITY_LABELS[s.availability] || s.availability} />
          <Field label="Interest Type" value={INTEREST_LABELS[s.interest_type] || s.interest_type} />
          <Field label="Skills / Expertise" value={s.skills} multiline />
          <Field label="Portfolio / Website" value={s.portfolio_url} href={s.portfolio_url} />
          <Field label="LinkedIn" value={s.linkedin_url} href={s.linkedin_url} />
          <Field label="Twitter / X" value={s.twitter_url} href={s.twitter_url} />
          <Field label="Discord" value={s.discord_username} />
          <Field label="How did you hear about us?" value={s.hear_about} />
          <Field label="Tracking Code" value={s.tracking_token} mono />
        </div>

        {s.message && (
          <div className="mt-space-lg">
            <h4 className="m-0 mb-space-sm text-font-size-sm font-font-weight-semibold">Message</h4>
            <div className="p-space-md bg-white/[0.03] rounded-radius-md border border-border whitespace-pre-wrap leading-relaxed text-font-size-sm">
              {s.message}
            </div>
          </div>
        )}

        {s.review_notes && (
          <div className="mt-space-lg">
            <h4 className="m-0 mb-space-sm text-font-size-sm font-font-weight-semibold">Review Notes</h4>
            <div className="p-space-md bg-white/[0.03] rounded-radius-md border border-border whitespace-pre-wrap leading-relaxed text-font-size-sm">
              {s.review_notes}
            </div>
          </div>
        )}
      </div>

      {/* ─── Refuse Modal ─── */}
      <ConfirmModal
        isOpen={showRefuseModal}
        onConfirm={handleRefuse}
        onCancel={() => setShowRefuseModal(false)}
        title="Refuse & Delete Application"
        message="This will permanently delete the application and all its data. The applicant will no longer be able to track this request. This cannot be undone."
        confirmText="Refuse & Delete"
        destructive
      />
    </AdminLayout>
  )
}

function Field({ label, value, href, multiline, mono }) {
  if (!value) {
    return (
      <div>
        <dt className="text-font-size-xs font-font-weight-semibold uppercase tracking-wider text-text-muted mb-[2px]">{label}</dt>
        <dd className="m-0 text-font-size-sm text-text-muted italic">—</dd>
      </div>
    )
  }

  return (
    <div>
      <dt className="text-font-size-xs font-font-weight-semibold uppercase tracking-wider text-text-muted mb-[2px]">{label}</dt>
      <dd className={`m-0 text-font-size-sm ${mono ? 'font-mono' : ''}`}>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-text underline underline-offset-2">
            {value}
          </a>
        ) : multiline ? (
          <span className="whitespace-pre-wrap leading-relaxed">{value}</span>
        ) : (
          <span>{value}</span>
        )}
      </dd>
    </div>
  )
}
