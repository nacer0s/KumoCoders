import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import AdminLayout from '../components/AdminLayout.jsx'

export default function WordFilters() {
  const { token } = useAuth()
  const [filters, setFilters] = useState([])
  const [loading, setLoading] = useState(true)
  const [pattern, setPattern] = useState('')
  const [replacement, setReplacement] = useState('')
  const [action, setAction] = useState('replace')
  const [isRegex, setIsRegex] = useState(false)

  useEffect(() => {
    fetch('/api/community/admin/filters', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setFilters(d.filters || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  async function addFilter() {
    if (!pattern.trim()) return
    const res = await fetch('/api/community/admin/filters', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ pattern: pattern.trim(), replacement: replacement || '***', action, is_regex: isRegex }),
    })
    if (res.ok) {
      const f = (await res.json()).filter
      setFilters((prev) => [f, ...prev])
      setPattern('')
    }
  }

  async function removeFilter(id) {
    await fetch(`/api/community/admin/filters/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setFilters((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <AdminLayout title="Word Filters">
      <div className="admin-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3>Add Filter</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'end' }}>
          <div><label className="admin-label">Pattern</label><input className="admin-input" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="word or regex" /></div>
          <div><label className="admin-label">Replace With</label><input className="admin-input" value={replacement} onChange={(e) => setReplacement(e.target.value)} placeholder="***" /></div>
          <div>
            <label className="admin-label">Action</label>
            <select className="admin-input" value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="replace">Replace</option>
              <option value="flag">Flag</option>
              <option value="block">Block</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingTop: '20px' }}>
            <input type="checkbox" checked={isRegex} onChange={(e) => setIsRegex(e.target.checked)} />
            <label>Regex</label>
          </div>
          <button className="admin-btn admin-btn--primary" style={{ marginTop: '20px' }} onClick={addFilter}>Add</button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="admin-loading-spinner" /></div>
      ) : filters.length === 0 ? (
        <p>No filters configured.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Pattern</th><th>Replacement</th><th>Action</th><th>Regex</th><th>Actions</th></tr></thead>
          <tbody>
            {filters.map((f) => (
              <tr key={f.id}>
                <td><code>{f.pattern}</code></td>
                <td>{f.replacement}</td>
                <td>{f.action}</td>
                <td>{f.is_regex ? 'Yes' : 'No'}</td>
                <td><button className="admin-btn admin-btn--danger" onClick={() => removeFilter(f.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminLayout>
  )
}
