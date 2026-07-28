import { useState } from 'react'
import useContent from '../hooks/useContent.js'

const INTEREST_TYPES = [
  { value: '', label: 'Select an option...' },
  { value: 'join_team', label: 'Join the KumoCoders team' },
  { value: 'collaborate', label: 'Collaborate on a project' },
  { value: 'open_source', label: 'Contribute to open source' },
  { value: 'general', label: 'General interest / Stay updated' },
  { value: 'other', label: 'Other' },
]

const EXPERIENCE_LEVELS = [
  { value: '', label: 'Select...' },
  { value: '0-1', label: 'Less than 1 year' },
  { value: '1-3', label: '1-3 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '5-10', label: '5-10 years' },
  { value: '10+', label: '10+ years' },
]

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'few_hours', label: 'A few hours per week' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'weekends', label: 'Weekends only' },
  { value: 'not_sure', label: 'Not sure yet' },
]

export default function JoinPage() {
  const { getSection } = useContent()
  const data = getSection('join')
  const meta = data?.metadata || {}

  function isFormOpen() {
    if (meta.is_open === false) return false
    const now = Date.now()
    const opensAt = meta.opens_at ? new Date(meta.opens_at).getTime() : null
    const closesAt = meta.closes_at ? new Date(meta.closes_at).getTime() : null
    if (opensAt && now < opensAt) return false
    if (closesAt && now >= closesAt) return false
    return true
  }

  const isOpen = isFormOpen()
  const successMessage = meta.success_message || 'Thank you for your application! We will review it and get back to you soon.'
  const closedMessage = meta.closed_message || 'Applications are currently closed. Please check back later.'
  const title = data?.title || 'Join KumoCoders'
  const subtitle = data?.subtitle || ''
  const body = data?.body || ''

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', country: '',
    current_role: '', years_experience: '', availability: '', interest_type: '',
    skills: '', portfolio_url: '', linkedin_url: '', twitter_url: '',
    discord_username: '', hear_about: '', message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [trackingToken, setTrackingToken] = useState('')

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      setFormError('First name, last name, and email are required.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/join/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.details?.[0]?.message || 'Submission failed')
      setTrackingToken(data.submission?.tracking_token || '')
      setSubmitted(true)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="pt-[120px] max-md:pt-[100px] pb-20 max-md:pb-[60px] max-w-[820px] mx-auto min-h-[60vh] px-space-xl max-md:px-space-md">
        <div className="text-center mb-space-xl">
          <h1 className="text-font-size-2xl max-md:text-font-size-xl font-bold tracking-[-0.02em] mb-space-sm">{title}</h1>
          {subtitle && <p className="text-text-muted text-font-size-base max-w-[560px] mx-auto">{subtitle}</p>}
        </div>
        <div className="text-center p-space-xl bg-surface border border-border rounded-radius-lg">
          <div className="text-5xl mb-space-md opacity-40"><span className="nf nf-fa-lock" /></div>
          <p className="text-text-muted text-font-size-base leading-relaxed max-w-[480px] mx-auto">{closedMessage}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="pt-[120px] max-md:pt-[100px] pb-20 max-md:pb-[60px] max-w-[820px] mx-auto min-h-[60vh] px-space-xl max-md:px-space-md">
        <div className="text-center mb-space-xl">
          <h1 className="text-font-size-2xl max-md:text-font-size-xl font-bold tracking-[-0.02em] mb-space-sm">{title}</h1>
        </div>
        <div className="p-space-md rounded-radius-md text-center text-font-size-sm leading-relaxed bg-success/10 border border-success/25 text-success mb-space-lg">
          {successMessage}
        </div>
        {trackingToken && (
          <div className="bg-surface border border-border rounded-radius-lg p-space-xl text-center">
            <p className="mb-space-sm text-font-size-sm text-text-muted">Your tracking code:</p>
            <code className="text-font-size-lg font-bold tracking-[0.1em] px-5 py-2 bg-[var(--color-bg)] rounded-radius-md border border-border">
              {trackingToken}
            </code>
            <p className="mt-space-md text-font-size-sm">
              <a href={`/join/status?token=${trackingToken}`} className="text-text underline">
                Track your application status &rarr;
              </a>
            </p>
          </div>
        )}
      </div>
    )
  }

  const inputClass = 'px-4 py-3 bg-[var(--color-bg)] border border-border rounded-radius-md text-text text-font-size-sm font-inherit outline-none focus:border-text transition-colors duration-200 max-md:text-base'
  const selectClass = `${inputClass} cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='%23888'%3E%3Cpath d='M1 1l5 5 5-5'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_14px_center] pr-9`
  const textareaClass = `${inputClass} resize-y min-h-[100px]`
  const labelClass = 'text-font-size-sm font-semibold text-text'
  const sectionLabelClass = 'text-font-size-xs font-bold uppercase tracking-wider text-text-muted mt-space-md mb-space-sm pt-space-md border-t border-border'

  return (
    <div className="pt-[120px] max-md:pt-[100px] pb-20 max-md:pb-[60px] max-w-[820px] mx-auto min-h-[60vh] px-space-xl max-md:px-space-md">
      <div className="text-center mb-space-xl">
        <h1 className="text-font-size-2xl max-md:text-font-size-xl font-bold tracking-[-0.02em] mb-space-sm">{title}</h1>
        {subtitle && <p className="text-text-muted text-font-size-base max-w-[560px] mx-auto">{subtitle}</p>}
      </div>

      {body && <p className="text-text-muted leading-relaxed mb-space-xl text-center">{body}</p>}

      <div className="bg-surface border border-border rounded-radius-lg max-md:rounded-radius-md p-space-xl max-md:p-space-md">
        {formError && (
          <div className="p-space-md rounded-radius-md text-center text-font-size-sm leading-relaxed bg-error/10 border border-error/25 text-error mb-space-lg">
            {formError}
          </div>
        )}

        <form className="flex flex-col gap-space-lg" onSubmit={handleSubmit} noValidate>
          <div className={sectionLabelClass}>Personal Information</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <label className={labelClass}>First Name <span className="text-error ml-0.5">*</span></label>
              <input type="text" className={inputClass} placeholder="Your first name" value={form.first_name} onChange={(e) => setField('first_name', e.target.value)} required autoFocus />
            </div>
            <div className="flex flex-col gap-space-xs">
              <label className={labelClass}>Last Name <span className="text-error ml-0.5">*</span></label>
              <input type="text" className={inputClass} placeholder="Your last name" value={form.last_name} onChange={(e) => setField('last_name', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <label className={labelClass}>Email <span className="text-error ml-0.5">*</span></label>
              <input type="email" className={inputClass} placeholder="your@email.com" value={form.email} onChange={(e) => setField('email', e.target.value)} required />
            </div>
            <div className="flex flex-col gap-space-xs">
              <label className={labelClass}>Phone</label>
              <input type="tel" className={inputClass} placeholder="+212 6XX XXX XXX" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
            </div>
          </div>

          <div className={sectionLabelClass}>Background</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <label className={labelClass}>Current Role / Job Title</label>
              <input type="text" className={inputClass} placeholder="e.g. Software Engineer, Student, Designer" value={form.current_role} onChange={(e) => setField('current_role', e.target.value)} />
            </div>
            <div className="flex flex-col gap-space-xs">
              <label className={labelClass}>Years of Experience</label>
              <select className={selectClass} value={form.years_experience} onChange={(e) => setField('years_experience', e.target.value)}>
                {EXPERIENCE_LEVELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <label className={labelClass}>Country / Location</label>
              <input type="text" className={inputClass} placeholder="e.g. Morocco, Casablanca" value={form.country} onChange={(e) => setField('country', e.target.value)} />
            </div>
            <div className="flex flex-col gap-space-xs">
              <label className={labelClass}>Availability</label>
              <select className={selectClass} value={form.availability} onChange={(e) => setField('availability', e.target.value)}>
                {AVAILABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className={sectionLabelClass}>Interest</div>
          <div className="flex flex-col gap-space-xs">
            <label className={labelClass}>What brings you here? <span className="text-error ml-0.5">*</span></label>
            <select className={selectClass} value={form.interest_type} onChange={(e) => setField('interest_type', e.target.value)} required>
              {INTEREST_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className={labelClass}>Skills / Expertise</label>
            <textarea className={textareaClass} placeholder="Tell us about your skills..." value={form.skills} onChange={(e) => setField('skills', e.target.value)} />
          </div>

          <div className={sectionLabelClass}>Links &amp; Social</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <label className={labelClass}>Portfolio / Website</label>
              <input type="url" className={inputClass} placeholder="https://your-website.com" value={form.portfolio_url} onChange={(e) => setField('portfolio_url', e.target.value)} />
            </div>
            <div className="flex flex-col gap-space-xs">
              <label className={labelClass}>LinkedIn</label>
              <input type="url" className={inputClass} placeholder="https://linkedin.com/in/..." value={form.linkedin_url} onChange={(e) => setField('linkedin_url', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <label className={labelClass}>Twitter / X</label>
              <input type="url" className={inputClass} placeholder="https://x.com/..." value={form.twitter_url} onChange={(e) => setField('twitter_url', e.target.value)} />
            </div>
            <div className="flex flex-col gap-space-xs">
              <label className={labelClass}>Discord Username</label>
              <input type="text" className={inputClass} placeholder="username#0000" value={form.discord_username} onChange={(e) => setField('discord_username', e.target.value)} />
            </div>
          </div>

          <div className={sectionLabelClass}>Additional Info</div>
          <div className="flex flex-col gap-space-xs">
            <label className={labelClass}>How did you hear about us?</label>
            <input type="text" className={inputClass} placeholder="e.g. Twitter, friend, hackathon, Google..." value={form.hear_about} onChange={(e) => setField('hear_about', e.target.value)} />
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className={labelClass}>Message / Why are you interested?</label>
            <textarea className={textareaClass} placeholder="Tell us about yourself..." value={form.message} onChange={(e) => setField('message', e.target.value)} />
          </div>

          <button type="submit" className="py-3.5 px-8 bg-text text-[var(--color-bg)] border-none rounded-radius-md text-font-size-base font-semibold cursor-pointer transition-opacity duration-200 mt-space-sm w-full hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed" disabled={submitting}>
            {submitting ? 'Submitting Application...' : 'Submit Application'}
          </button>

          <div className="block text-center mt-space-sm text-font-size-sm">
            <a href="/join/status" className="text-text-muted no-underline transition-colors duration-200 hover:text-text hover:underline">
              <span className="nf nf-fa-magnifying_glass" /> Already applied? Track your application status
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
