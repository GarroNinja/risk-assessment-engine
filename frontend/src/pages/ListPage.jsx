import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllRisks, searchRisks, exportRisksCSV } from '../services/riskService'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'

// ── column definitions ──────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'id',          label: 'ID',          sortable: true  },
  { key: 'title',       label: 'Title',        sortable: true  },
  { key: 'category',    label: 'Category',     sortable: true  },
  { key: 'severity',    label: 'Severity',     sortable: true  },
  { key: 'status',      label: 'Status',       sortable: true  },
  { key: 'score',       label: 'Risk Score',   sortable: true  },
  { key: 'owner',       label: 'Owner',        sortable: false },
  { key: 'createdDate', label: 'Created',      sortable: true  },
  { key: 'actions',     label: 'Actions',      sortable: false },
]

// ── severity colour map ─────────────────────────────────────────────────────
const SEVERITY_COLOURS = {
  HIGH:   'bg-red-100 text-red-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW:    'bg-green-100 text-green-800',
}

// ── score colour helper ─────────────────────────────────────────────────────
function scoreColour(score) {
  if (score >= 75) return 'text-red-600 font-semibold'
  if (score >= 40) return 'text-yellow-600 font-semibold'
  return 'text-green-600 font-semibold'
}

// ── format date ─────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ── debounce hook ───────────────────────────────────────────────────────────
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ════════════════════════════════════════════════════════════════════════════
export default function ListPage() {
  const navigate = useNavigate()

  // ── state ─────────────────────────────────────────────────────────────────
  const [risks, setRisks]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [page, setPage]             = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [sortBy, setSortBy]         = useState('id')
  const [sortDir, setSortDir]       = useState('asc')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')

  const searchQuery = useDebounce(searchInput, 300)

  // ── fetch ─────────────────────────────────────────────────────────────────
 const fetchRisks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let res

      if (searchQuery.trim()) {
        res = await searchRisks(searchQuery)

        // safely extract an array no matter what shape the backend returns
        let list = []
        if (Array.isArray(res.data)) {
          list = res.data
        } else if (Array.isArray(res.data?.content)) {
          list = res.data.content
        } else if (res.data && typeof res.data === 'object') {
          // last resort — grab first array value found in the response object
          const found = Object.values(res.data).find(v => Array.isArray(v))
          list = found ?? []
        }

        setRisks(list)
        setTotalPages(res.data?.totalPages ?? 1)
        setTotalElements(res.data?.totalElements ?? list.length)

      } else {
        res = await getAllRisks(page, 10, sortBy, sortDir)

        // safely extract from Spring Page response
        let list = []
        if (Array.isArray(res.data)) {
          list = res.data
        } else if (Array.isArray(res.data?.content)) {
          list = res.data.content
        }

        setRisks(list)
        setTotalPages(res.data?.totalPages ?? 1)
        setTotalElements(res.data?.totalElements ?? list.length)
      }

    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load risks. Please try again.')
      setRisks([]) // ← always reset to array on error
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, sortDir, searchQuery])
  useEffect(() => { fetchRisks() }, [fetchRisks])

  // reset to page 0 when search/filter changes
  useEffect(() => { setPage(0) }, [searchQuery, statusFilter, severityFilter])

  // ── sort toggle ───────────────────────────────────────────────────────────
  function handleSort(key) {
    if (sortBy === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  // ── sort indicator ────────────────────────────────────────────────────────
  function SortIcon({ colKey }) {
    if (sortBy !== colKey) return <span className="ml-1 text-gray-300">↕</span>
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  // ── CSV export ────────────────────────────────────────────────────────────
  async function handleExport() {
    try {
      const res = await exportRisksCSV()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a   = document.createElement('a')
      a.href    = url
      a.download = 'risks-export.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Export failed. Please try again.')
    }
  }

  // ── filtered rows (client-side status/severity filter) ───────────────────
    const visibleRisks = (Array.isArray(risks) ? risks : []).filter(r => {
    const matchStatus   = statusFilter   ? r.status   === statusFilter   : true
    const matchSeverity = severityFilter ? r.severity === severityFilter : true
    return matchStatus && matchSeverity
  })

  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── Top Navbar ── */}
      <nav className="bg-primary text-white px-6 py-4 flex items-center justify-between shadow">
        <h1 className="text-lg font-medium tracking-wide">Risk Assessment Engine</h1>
        <div className="flex gap-4 text-sm">
          <button onClick={() => navigate('/')}
            className="hover:underline">Dashboard</button>
          <button onClick={() => navigate('/risks')}
            className="hover:underline font-semibold">Risks</button>
          <button onClick={() => navigate('/analytics')}
            className="hover:underline">Analytics</button>
        </div>
      </nav>

      <div className="max-w-screen-xl mx-auto px-6 py-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-medium text-gray-800">Risk Register</h2>
            {!loading && (
              <p className="text-sm text-gray-500 mt-1">
                {totalElements} risk{totalElements !== 1 ? 's' : ''} total
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-primary text-primary text-sm rounded hover:bg-blue-50 transition"
            >
              Export CSV
            </button>
            <button
              onClick={() => navigate('/risks/new')}
              className="px-4 py-2 bg-primary text-white text-sm rounded hover:opacity-90 transition"
            >
              + New Risk
            </button>
          </div>
        </div>

        {/* ── Search + Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* search */}
          <input
            type="text"
            placeholder="Search risks..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="MITIGATED">Mitigated</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* severity filter */}
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Severities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* clear filters */}
          {(searchInput || statusFilter || severityFilter) && (
            <button
              onClick={() => {
                setSearchInput('')
                setStatusFilter('')
                setSeverityFilter('')
              }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800 underline"
            >
              Clear
            </button>
          )}
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200
                          text-red-700 rounded flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button onClick={fetchRisks}
              className="text-sm underline ml-4">Retry</button>
          </div>
        )}

        {/* ── Table card ── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              {/* thead */}
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`px-4 py-3 text-left text-xs font-medium
                                  text-gray-500 uppercase tracking-wider
                                  whitespace-nowrap select-none
                                  ${col.sortable
                                    ? 'cursor-pointer hover:bg-gray-100'
                                    : ''}`}
                    >
                      {col.label}
                      {col.sortable && <SortIcon colKey={col.key} />}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* tbody */}
              <tbody className="divide-y divide-gray-100">

                {/* loading state */}
                {loading && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-6">
                      <LoadingSkeleton rows={8} />
                    </td>
                  </tr>
                )}

                {/* empty state */}
                {!loading && visibleRisks.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <EmptyState message={
                        searchInput
                          ? `No risks found for "${searchInput}"`
                          : 'No risks recorded yet. Click + New Risk to add one.'
                      } />
                    </td>
                  </tr>
                )}

                {/* data rows */}
                {!loading && visibleRisks.map(risk => (
                  <tr
                    key={risk.id}
                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/risks/${risk.id}`)}
                  >
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                      #{risk.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">
                      {risk.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {risk.category ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium
                        ${SEVERITY_COLOURS[risk.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                        {risk.severity ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={risk.status} />
                    </td>
                    <td className={`px-4 py-3 ${scoreColour(risk.score)}`}>
                      {risk.score ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {risk.owner ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(risk.createdDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2"
                           onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/risks/${risk.id}/edit`)}
                          className="px-3 py-1 text-xs border border-primary
                                     text-primary rounded hover:bg-blue-50 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => navigate(`/risks/${risk.id}`)}
                          className="px-3 py-1 text-xs border border-gray-300
                                     text-gray-600 rounded hover:bg-gray-50 transition"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {!loading && totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  )
}