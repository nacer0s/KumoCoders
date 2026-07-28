import { useState, useMemo } from 'react'

/**
 * Reusable search + filter bar for admin tables.
 *
 * Usage:
 *   <SearchFilterBar data={items} searchFields={['title','slug']}>
 *     {(filtered) => <table>...{filtered.map(...)}</table>}
 *   </SearchFilterBar>
 *
 * Optional props:
 *   searchFields  — array of field names to search against (default: ['title'])
 *   placeholder   — search input placeholder text
 *   filters       — array of { label, key, options, renderOption?, filterMatch? }
 *                    where options is an array of { value, label }
 *                    filterMatch: (item, filterValue) => boolean — custom match fn
 */
export default function SearchFilterBar({
  data = [],
  searchFields = ['title'],
  placeholder = 'Search…',
  filters = [],
  children,
}) {
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState({})

  // Collect unique options for each filter automatically if not provided
  const resolvedFilters = useMemo(() => {
    return filters.map((f) => {
      if (f.options) return f
      // Auto-generate options from data
      const seen = new Set()
      const opts = []
      data.forEach((item) => {
        const val = item[f.key]
        if (val !== undefined && val !== null && val !== '' && !seen.has(val)) {
          seen.add(val)
          opts.push({ value: val, label: String(val) })
        }
      })
      return { ...f, options: opts }
    })
  }, [filters, data])

  const hasActiveFilters =
    query.trim().length > 0 || Object.keys(activeFilters).length > 0

  const filtered = useMemo(() => {
    let result = data

    // Text search
    const q = query.trim().toLowerCase()
    if (q) {
      result = result.filter((item) =>
        searchFields.some((field) => {
          const val = item[field]
          return val != null && String(val).toLowerCase().includes(q)
        })
      )
    }

    // Dropdown filters
    resolvedFilters.forEach((f) => {
      const activeVal = activeFilters[f.key]
      if (activeVal && activeVal !== '') {
        result = result.filter((item) => {
          if (f.filterMatch) {
            return f.filterMatch(item, activeVal)
          }
          const itemVal = item[f.key]
          return String(itemVal) === activeVal
        })
      }
    })

    return result
  }, [data, query, searchFields, activeFilters, resolvedFilters])

  function setFilter(key, value) {
    setActiveFilters((prev) => {
      const next = { ...prev }
      if (value === '' || value === undefined || value === null) {
        delete next[key]
      } else {
        next[key] = value
      }
      return next
    })
  }

  function clearAll() {
    setQuery('')
    setActiveFilters({})
  }

  // Count active filters for the clear badge
  const activeCount =
    (query.trim() ? 1 : 0) + Object.keys(activeFilters).length

  return (
    <div className="admin-search-bar">
      <div className="admin-search-bar-controls">
        {/* Search Input */}
        <div className="admin-search-bar-input-wrap">
          <span className="nf nf-fa-search admin-search-bar-icon" />
          <input
            type="text"
            className="admin-search-bar-input"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
          />
          {query && (
            <button
              className="admin-search-bar-clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <span className="nf nf-fa-circle_xmark" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        {resolvedFilters.map((f) => (
          <div key={f.key} className="admin-search-bar-filter-wrap">
            <select
              className="admin-search-bar-select"
              value={activeFilters[f.key] || ''}
              onChange={(e) => setFilter(f.key, e.target.value)}
              aria-label={f.label}
            >
              <option value="">{f.label}</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {activeFilters[f.key] && (
              <button
                className="admin-search-bar-filter-clear"
                onClick={() => setFilter(f.key, '')}
                aria-label={`Clear ${f.label} filter`}
              >
                <span className="nf nf-fa-circle_xmark" />
              </button>
            )}
          </div>
        ))}

        {/* Clear All */}
        {hasActiveFilters && (
          <button className="admin-search-bar-clear-all" onClick={clearAll}>
            <span className="nf nf-fa-times" /> Clear{' '}
            {activeCount > 1 ? `(${activeCount})` : ''}
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="admin-search-bar-meta">
        <span className="admin-search-bar-count">
          {filtered.length} / {data.length} results
        </span>
      </div>

      {/* Render filtered data */}
      {children(filtered)}
    </div>
  )
}
