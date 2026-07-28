import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { navigateTo } from '../App.jsx'

// ─── Field group for editing an array of objects ───
function ArrayFieldEditor({ label, items, onChange, fields, emptyItem }) {
  function handleItemChange(index, field, value) {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onChange(updated)
  }

  function addItem() {
    onChange([...items, { ...emptyItem }])
  }

  function removeItem(index) {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="admin-input-group">
      <label className="admin-label">{label}</label>
      <div className="flex flex-col gap-space-sm">
        {items.map((item, index) => (
          <div
            key={index}
            className="glass p-space-md rounded-radius-md border border-border"
          >
            <div className="flex flex-col gap-space-xs">
              {fields.map((field) => (
                <div key={field.key}>
                  {field.type === 'textarea' ? (
                      <textarea
                        className={`admin-input ${field.mono ? 'font-mono' : ''}`}
                        placeholder={field.placeholder || field.label}
                        rows={3}
                        value={item[field.key] ?? ''}
                        onChange={(e) => handleItemChange(index, field.key, e.target.value)}
                      />
                    ) : (
                      <input
                        type="text"
                        className={`admin-input ${field.mono ? 'font-mono' : ''}`}
                        placeholder={field.placeholder || field.label}
                        value={item[field.key] ?? ''}
                        onChange={(e) => handleItemChange(index, field.key, e.target.value)}
                      />
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--ghost mt-space-sm text-font-size-xs text-error"
              onClick={() => removeItem(index)}
            >
              <span className="nf nf-fa-trash_can" /> Remove
            </button>
          </div>
        ))}
        <button type="button" className="admin-btn admin-btn--glass self-start" onClick={addItem}>
          <span className="nf nf-fa-plus" /> Add {label.toLowerCase().replace(/s$/, '')}
        </button>
      </div>
    </div>
  )
}

// ─── CTA pair editor ───
function CTAEditor({ label, value, onChange }) {
  return (
    <div className="admin-input-group">
      <label className="admin-label">{label}</label>
      <div className="flex gap-space-sm flex-wrap">
        <input
          type="text"
          className="admin-input min-w-[180px] flex-[1_1_180px]"
          placeholder="Button text"
          value={value?.text ?? ''}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
        />
        <input
          type="text"
          className="admin-input min-w-[250px] flex-[1_1_250px]"
          placeholder="Button link (e.g. /join)"
          value={value?.link ?? ''}
          onChange={(e) => onChange({ ...value, link: e.target.value })}
        />
      </div>
    </div>
  )
}

// ─── Section-specific form renderers ───
function HeroForm({ data, onChange }) {
  const meta = data.metadata || {}
  return (
    <>
      <div className="admin-input-group">
        <label className="admin-label">Tagline / Title</label>
        <input
          type="text"
          className="admin-input"
          placeholder="Main hero heading"
          value={data.title ?? ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>
      <CTAEditor
        label="Primary CTA Button"
        value={meta.cta_primary}
        onChange={(v) => onChange({ ...data, metadata: { ...meta, cta_primary: v } })}
      />
      <CTAEditor
        label="Secondary CTA Button"
        value={meta.cta_secondary}
        onChange={(v) => onChange({ ...data, metadata: { ...meta, cta_secondary: v } })}
      />
    </>
  )
}

function AboutForm({ data, onChange }) {
  const meta = data.metadata || {}
  return (
    <>
      <div className="admin-input-group">
        <label className="admin-label">Title</label>
        <input
          type="text"
          className="admin-input"
          placeholder="Section title"
          value={data.title ?? ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>
      <div className="admin-input-group">
        <label className="admin-label">Subtitle</label>
        <input
          type="text"
          className="admin-input"
          placeholder="Section subtitle"
          value={data.subtitle ?? ''}
          onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
        />
      </div>
      <div className="admin-input-group">
        <label className="admin-label">Body</label>
        <textarea
          className="admin-textarea"
          placeholder="About section body text"
          rows={5}
          value={data.body ?? ''}
          onChange={(e) => onChange({ ...data, body: e.target.value })}
        />
      </div>
      <ArrayFieldEditor
        label="Highlights"
        items={meta.highlights || []}
        onChange={(v) => onChange({ ...data, metadata: { ...meta, highlights: v } })}
        fields={[
          { key: 'title', label: 'Title', placeholder: 'Highlight title' },
          { key: 'description', label: 'Description', placeholder: 'Highlight description', type: 'textarea' },
        ]}
        emptyItem={{ title: '', description: '' }}
      />
      <ArrayFieldEditor
        label="Quick Info"
        items={meta.quickInfo || []}
        onChange={(v) => onChange({ ...data, metadata: { ...meta, quickInfo: v } })}
        fields={[
          { key: 'icon', label: 'Icon class', placeholder: 'e.g. nf-fa-location_dot', mono: true },
          { key: 'text', label: 'Text', placeholder: 'Info text' },
        ]}
        emptyItem={{ icon: '', text: '' }}
      />
    </>
  )
}

function TimelineForm({ data, onChange }) {
  const meta = data.metadata || {}
  return (
    <>
      <div className="admin-input-group">
        <label className="admin-label">Title</label>
        <input
          type="text"
          className="admin-input"
          placeholder="Section title"
          value={data.title ?? ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>
      <div className="admin-input-group">
        <label className="admin-label">Subtitle</label>
        <input
          type="text"
          className="admin-input"
          placeholder="Section subtitle"
          value={data.subtitle ?? ''}
          onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
        />
      </div>
      <ArrayFieldEditor
        label="Milestones"
        items={meta.milestones || []}
        onChange={(v) => onChange({ ...data, metadata: { ...meta, milestones: v } })}
        fields={[
          { key: 'year', label: 'Year', placeholder: 'e.g. 2023' },
          { key: 'title', label: 'Title', placeholder: 'Milestone title' },
          { key: 'description', label: 'Description', placeholder: 'Milestone description', type: 'textarea' },
        ]}
        emptyItem={{ year: '', title: '', description: '' }}
      />
    </>
  )
}

function StatsForm({ data, onChange }) {
  const meta = data.metadata || {}
  return (
    <>
      <div className="admin-input-group">
        <label className="admin-label">Title</label>
        <input
          type="text"
          className="admin-input"
          placeholder="Section title"
          value={data.title ?? ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>
      <div className="admin-input-group">
        <label className="admin-label">Subtitle</label>
        <input
          type="text"
          className="admin-input"
          placeholder="Section subtitle"
          value={data.subtitle ?? ''}
          onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
        />
      </div>
      <p className="admin-text-muted mb-space-md">
        These are fallback values. When available, live stats from the database override these.
      </p>
      <ArrayFieldEditor
        label="Stat Items"
        items={meta.items || []}
        onChange={(v) => onChange({ ...data, metadata: { ...meta, items: v } })}
        fields={[
          { key: 'label', label: 'Label', placeholder: 'e.g. Projects' },
          { key: 'value', label: 'Value', placeholder: 'e.g. 15' },
          { key: 'suffix', label: 'Suffix', placeholder: 'e.g. +' },
        ]}
        emptyItem={{ label: '', value: '', suffix: '' }}
      />
    </>
  )
}

function AssociationForm({ data, onChange }) {
  const meta = data.metadata || {}
  return (
    <>
      <div className="admin-input-group">
        <label className="admin-label">Title</label>
        <input
          type="text"
          className="admin-input"
          placeholder="Section title"
          value={data.title ?? ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>
      <div className="admin-input-group">
        <label className="admin-label">Subtitle</label>
        <input
          type="text"
          className="admin-input"
          placeholder="Section subtitle"
          value={data.subtitle ?? ''}
          onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
        />
      </div>
      <div className="admin-input-group">
        <label className="admin-label">Body</label>
        <textarea
          className="admin-textarea"
          placeholder="Association description"
          rows={5}
          value={data.body ?? ''}
          onChange={(e) => onChange({ ...data, body: e.target.value })}
        />
      </div>
      <div className="admin-input-group">
        <label className="admin-label">Badge Text</label>
        <input
          type="text"
          className="admin-input"
          placeholder="e.g. Current Branch"
          value={meta.badge ?? ''}
          onChange={(e) => onChange({ ...data, metadata: { ...meta, badge: e.target.value } })}
        />
      </div>
      <div className="admin-input-group">
        <label className="admin-label">Button Text</label>
        <input
          type="text"
          className="admin-input"
          placeholder="e.g. Learn More"
          value={meta.buttonText ?? ''}
          onChange={(e) => onChange({ ...data, metadata: { ...meta, buttonText: e.target.value } })}
        />
      </div>
      <div className="admin-input-group">
        <label className="admin-label">Button Link</label>
        <input
          type="text"
          className="admin-input"
          placeholder="e.g. /wiki/association"
          value={meta.buttonLink ?? ''}
          onChange={(e) => onChange({ ...data, metadata: { ...meta, buttonLink: e.target.value } })}
        />
      </div>
    </>
  )
}

function CTAForm({ data, onChange }) {
  const meta = data.metadata || {}
  return (
    <>
      <div className="admin-input-group">
        <label className="admin-label">Title</label>
        <input
          type="text"
          className="admin-input"
          placeholder="Section title"
          value={data.title ?? ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>
      <div className="admin-input-group">
        <label className="admin-label">Body</label>
        <textarea
          className="admin-textarea"
          placeholder="CTA description"
          rows={4}
          value={data.body ?? ''}
          onChange={(e) => onChange({ ...data, body: e.target.value })}
        />
      </div>
      <CTAEditor
        label="Primary CTA Button"
        value={meta.cta_primary}
        onChange={(v) => onChange({ ...data, metadata: { ...meta, cta_primary: v } })}
      />
      <CTAEditor
        label="Secondary CTA Button"
        value={meta.cta_secondary}
        onChange={(v) => onChange({ ...data, metadata: { ...meta, cta_secondary: v } })}
      />
    </>
  )
}

function FooterForm({ data, onChange }) {
  const meta = data.metadata || {}
  return (
    <>
      <p className="admin-text-muted mb-space-md">
        Social media links shown in the footer.
      </p>
      <ArrayFieldEditor
        label="Social Links"
        items={meta.social || []}
        onChange={(v) => onChange({ ...data, metadata: { ...meta, social: v } })}
        fields={[
          { key: 'icon', label: 'Icon class', placeholder: 'e.g. nf-fa-github', mono: true },
          { key: 'url', label: 'URL', placeholder: 'e.g. https://github.com/KumoCoders' },
          { key: 'label', label: 'Label', placeholder: 'e.g. GitHub' },
        ]}
        emptyItem={{ icon: '', url: '', label: '' }}
      />
    </>
  )
}

// ─── Map section keys to form components ───
const FORM_MAP = {
  hero: HeroForm,
  about: AboutForm,
  timeline: TimelineForm,
  stats: StatsForm,
  association: AssociationForm,
  cta: CTAForm,
  footer: FooterForm,
}

export default function StructuredSectionForm({ sectionKey }) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [data, setData] = useState({ title: '', subtitle: '', body: '', metadata: {} })

  useEffect(() => {
    if (!token || !sectionKey) return
    setLoading(true)
    setError('')

    fetch(`/api/content/${sectionKey}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch section data')
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
  }, [token, sectionKey])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    const payload = {
      title: data.title || null,
      subtitle: data.subtitle || null,
      body: data.body || null,
      metadata: data.metadata || null,
    }

    try {
      const res = await fetch(`/api/content/${sectionKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || errData.error || 'Failed to save section')
      }

      setSuccess('Section saved successfully! Changes are now live.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>Loading section data...</p>
      </div>
    )
  }

  const FormComponent = FORM_MAP[sectionKey]

  if (!FormComponent) {
    return (
      <div className="admin-card glass">
        <p className="admin-text-muted">
          Unknown section type: <code>{sectionKey}</code>. No structured form available.
        </p>
      </div>
    )
  }

  return (
    <div className="admin-card glass">
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        <FormComponent data={data} onChange={setData} />

        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => navigateTo('/admin/content')}
          >
            <span className="nf nf-fa-arrow_left" /> Back to Content
          </button>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
