import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getAllRisks, searchRisks, exportRisksCSV } from '../services/riskService'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'

// constants 
const PAGE_SIZE = 10

const COLUMNS = [
  { key: 'id',          label: 'ID',        sortable: true  },
  { key: 'title',       label: 'Title',     sortable: true  },
  { key: 'category',    label: 'Category',  sortable: true  },
  { key: 'severity',    label: 'Severity',  sortable: true  },
  { key: 'status',      label: 'Status',    sortable: true  },
  { key: 'score',       label: 'Score',     sortable: true  },
  { key: 'owner',       label: 'Owner',     sortable: false },
  { key: 'createdDate', label: 'Created',   sortable: true  },
  { key: 'actions',     label: 'Actions',   sortable: false },
]

const SEVERITY_COLOURS = {
  HIGH:   'bg-red-100 text-red-700 border border-red-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  LOW:    'bg-green-100 text-green-700 border border-green-200',
}

//  helpers 
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function scoreColour(score) {
  if (score >= 75) return 'text-red-600 font-bold'
  if (score >= 40) return 'text-yellow-600 font-bold'
  return 'text-green-600 font-bold'
}

function extractList(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.content)) return data.content
  const found = Object.values(data).find(v => Array.isArray(v))
  return found ?? []
}

//  components defined OUTSIDE to prevent remount 
function Navbar({ navigate }) {
  return (
    <nav className="bg-primary text-white px-6 py-4 flex items-center
                    justify-between shadow sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="w-6 h-6">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span className="text-lg font-semibold tracking-wide">
          Risk Assessment Engine
        </span>
      </div>
      <div className="flex gap-4 text-sm">
        <button onClick={() => navigate('/')}
          className="hover:underline opacity-80 hover:opacity-100 transition">
          Dashboard
        </button>
        <button onClick={() => navigate('/risks')}
          className="underline font-semibold">
          Risks
        </button>
        <button onClick={() => navigate('/analytics')}
          className="hover:underline opacity-80 hover:opacity-100 transition">
          Analytics
        </button>
      </div>
    </nav>
  )
}

function SortIcon({ colKey, sortBy, sortDir }) {
  if (sortBy !== colKey)
    return <span className="ml-1 text-gray-300 text-xs">↕</span>
  return (
    <span className="ml-1 text-xs text-primary">
      {sortDir === 'asc' ? '↑' : '↓'}
    </span>
  )
}

function ActiveFilterBadge({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1
                     bg-blue-50 text-primary border border-blue-200
                     rounded-full text-xs font-medium">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-red-500 transition font-bold leading-none"
        aria-label={`Remove ${label} filter`}
      >
        ×
      </button>
    </span>
  )
}

// main component
export default function ListPage() {
  const navigate                      = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  //  read initial state from URL params 
  const [searchInput, setSearchInput]   = useState(searchParams.get('q')        ?? '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status')   ?? '')
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') ?? '')
  const [dateFrom, setDateFrom]         = useState(searchParams.get('dateFrom') ?? '')
  const [dateTo, setDateTo]             = useState(searchParams.get('dateTo')   ?? '')
  const [page, setPage]                 = useState(Number(searchParams.get('page') ?? 0))
  const [sortBy, setSortBy]             = useState(searchParams.get('sortBy')   ?? 'id')
  const [sortDir, setSortDir]           = useState(searchParams.get('sortDir')  ?? 'asc')

  const [risks, setRisks]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [totalPages, setTotalPages]     = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [showFilters, setShowFilters]   = useState(false)

  //  debounced search value 
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput)
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(0)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [searchInput])

  //  sync all filters to URL params
  useEffect(() => {
    const params = {}
    if (debouncedSearch) params.q        = debouncedSearch
    if (statusFilter)    params.status   = statusFilter
    if (severityFilter)  params.severity = severityFilter
    if (dateFrom)        params.dateFrom = dateFrom
    if (dateTo)          params.dateTo   = dateTo
    if (page > 0)        params.page     = String(page)
    if (sortBy !== 'id') params.sortBy   = sortBy
    if (sortDir !== 'asc') params.sortDir = sortDir
    setSearchParams(params, { replace: true })
  }, [debouncedSearch, statusFilter, severityFilter, dateFrom, dateTo,
      page, sortBy, sortDir, setSearchParams])

  //  reset page when filters change 
  useEffect(() => {
    setPage(0)
  }, [debouncedSearch, statusFilter, severityFilter, dateFrom, dateTo])

  //  fetch risks 
  const fetchRisks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let res

      if (debouncedSearch.trim()) {
        res = await searchRisks(debouncedSearch.trim())
        const list = extractList(res.data)
        setRisks(list)
        setTotalPages(res.data?.totalPages    ?? 1)
        setTotalElements(res.data?.totalElements ?? list.length)
      } else {
        res = await getAllRisks(page, PAGE_SIZE, sortBy, sortDir)
        setRisks(extractList(res.data))
        setTotalPages(res.data?.totalPages    ?? 1)
        setTotalElements(res.data?.totalElements ?? 0)
      }
    } catch (err) {
      console.error('ListPage error:', err)
      setError(
        err.message === 'Network Error'
          ? 'Cannot reach the server. Make sure the backend is running on port 8080.'
          : err.response?.status === 401
          ? 'Session expired. Please log in again.'
          : 'Failed to load risks. Please try again.'
      )
      setRisks([])
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, sortDir, debouncedSearch])

  useEffect(() => { fetchRisks() }, [fetchRisks])

  //  sort handler 
  function handleSort(key) {
    if (sortBy === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  //  page change 
  function handlePageChange(newPage) {
    if (newPage < 0 || newPage >= totalPages) return
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  //  clear all filters 
  function clearAllFilters() {
    setSearchInput('')
    setStatusFilter('')
    setSeverityFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(0)
  }

  //  CSV export 
  async function handleExport() {
    try {
      const res = await exportRisksCSV()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a   = document.createElement('a')
      a.href    = url
      a.download = `risks-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Export failed. Please try again.')
    }
  }

  //  client-side filter for status, severity, date range ──────────────────
  const visibleRisks = (Array.isArray(risks) ? risks : []).filter(r => {
    if (statusFilter   && r.status   !== statusFilter)   return false
    if (severityFilter && r.severity !== severityFilter) return false
    if (dateFrom && r.createdDate) {
      if (new Date(r.createdDate) < new Date(dateFrom)) return false
    }
    if (dateTo && r.createdDate) {
      if (new Date(r.createdDate) > new Date(dateTo + 'T23:59:59')) return false
    }
    return true
  })

  const hasActiveFilters = searchInput || statusFilter || severityFilter
                        || dateFrom || dateTo

  const activeFilterCount = [
    searchInput, statusFilter, severityFilter, dateFrom, dateTo,
  ].filter(Boolean).length

  // render
  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      <Navbar navigate={navigate} />

      <div className="max-w-screen-xl mx-auto px-6 py-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center
                        sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Risk Register
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {loading
                ? 'Loading...'
                : `${totalElements} risk${totalElements !== 1 ? 's' : ''} total`}
              {debouncedSearch && !loading && (
                <span className="ml-2 text-primary font-medium">
                  — results for "{debouncedSearch}"
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport}
              className="px-4 py-2 border border-gray-300 text-gray-600
                         text-sm font-medium rounded-xl hover:bg-gray-50
                         transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor"
                strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4
                     4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <button onClick={() => navigate('/risks/new')}
              className="px-4 py-2 bg-primary text-white text-sm font-medium
                         rounded-xl hover:opacity-90 transition flex items-center
                         gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor"
                strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 4v16m8-8H4" />
              </svg>
              New Risk
            </button>
          </div>
        </div>

        {/* ── Search + filter bar ── */}
        <div className="bg-white rounded-2xl border border-gray-200
                        shadow-sm p-4 mb-5">

          {/* primary row: search + filter toggle + clear */}
          <div className="flex flex-col sm:flex-row gap-3">

            {/* search input */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2
                              w-4 h-4 text-gray-400" fill="none"
                stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by title, category, owner..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200
                           rounded-xl text-sm focus:outline-none
                           focus:ring-2 focus:ring-primary focus:border-transparent
                           transition"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600 transition
                             text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>

            {/* status dropdown */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl
                         text-sm focus:outline-none focus:ring-2
                         focus:ring-primary bg-white text-gray-700
                         cursor-pointer min-w-[140px]"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="MITIGATED">Mitigated</option>
              <option value="CLOSED">Closed</option>
            </select>

            {/* severity dropdown */}
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl
                         text-sm focus:outline-none focus:ring-2
                         focus:ring-primary bg-white text-gray-700
                         cursor-pointer min-w-[140px]"
            >
              <option value="">All Severities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* advanced filter toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`px-4 py-2.5 border rounded-xl text-sm font-medium
                          transition flex items-center gap-2 whitespace-nowrap
                          ${showFilters
                            ? 'border-primary text-primary bg-blue-50'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor"
                strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707
                     L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017
                     21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-primary text-white text-xs w-5 h-5
                                 rounded-full flex items-center justify-center
                                 font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* clear all */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2.5 border border-red-200 text-red-600
                           text-sm font-medium rounded-xl hover:bg-red-50
                           transition whitespace-nowrap"
              >
                Clear All
              </button>
            )}
          </div>

          {/* ── Date range picker — shown when filters expanded ── */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase
                            tracking-wider mb-3">
                Date Range (Created Date)
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-start
                              sm:items-center">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 whitespace-nowrap">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={e => setDateFrom(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl
                               text-sm focus:outline-none focus:ring-2
                               focus:ring-primary bg-white cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 whitespace-nowrap">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={e => setDateTo(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl
                               text-sm focus:outline-none focus:ring-2
                               focus:ring-primary bg-white cursor-pointer"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(''); setDateTo('') }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Clear dates
                  </button>
                )}
              </div>

              {/* date range summary */}
              {(dateFrom || dateTo) && (
                <p className="text-xs text-gray-500 mt-2">
                  Showing risks created
                  {dateFrom && <strong> from {formatDate(dateFrom)}</strong>}
                  {dateTo   && <strong> to {formatDate(dateTo)}</strong>}
                </p>
              )}
            </div>
          )}

          {/* ── Active filter badges ── */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3
                            border-t border-gray-100">
              {searchInput && (
                <ActiveFilterBadge
                  label={`Search: "${searchInput}"`}
                  onRemove={() => setSearchInput('')}
                />
              )}
              {statusFilter && (
                <ActiveFilterBadge
                  label={`Status: ${statusFilter}`}
                  onRemove={() => setStatusFilter('')}
                />
              )}
              {severityFilter && (
                <ActiveFilterBadge
                  label={`Severity: ${severityFilter}`}
                  onRemove={() => setSeverityFilter('')}
                />
              )}
              {dateFrom && (
                <ActiveFilterBadge
                  label={`From: ${formatDate(dateFrom)}`}
                  onRemove={() => setDateFrom('')}
                />
              )}
              {dateTo && (
                <ActiveFilterBadge
                  label={`To: ${formatDate(dateTo)}`}
                  onRemove={() => setDateTo('')}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200
                          text-red-700 rounded-xl flex items-center
                          justify-between text-sm">
            <div className="flex items-center gap-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
            <button onClick={fetchRisks}
              className="underline font-medium ml-4 hover:text-red-900">
              Retry
            </button>
          </div>
        )}

        {/* ── Table card ── */}
        <div className="bg-white rounded-2xl border border-gray-200
                        shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`px-4 py-3 text-left text-xs font-semibold
                                  text-gray-500 uppercase tracking-wider
                                  whitespace-nowrap select-none
                                  ${col.sortable
                                    ? 'cursor-pointer hover:bg-gray-100'
                                    : ''}
                                  ${sortBy === col.key
                                    ? 'text-primary bg-blue-50'
                                    : ''}`}
                    >
                      {col.label}
                      {col.sortable && (
                        <SortIcon
                          colKey={col.key}
                          sortBy={sortBy}
                          sortDir={sortDir}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">

                {loading && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-6">
                      <LoadingSkeleton rows={PAGE_SIZE} />
                    </td>
                  </tr>
                )}

                {!loading && visibleRisks.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <EmptyState
                        message={
                          hasActiveFilters
                            ? 'No risks match your current filters.'
                            : 'No risks recorded yet. Click New Risk to add one.'
                        }
                      />
                    </td>
                  </tr>
                )}

                {!loading && visibleRisks.map(risk => (
                  <tr
                    key={risk.id}
                    onClick={() => navigate(`/risks/${risk.id}`)}
                    className="hover:bg-blue-50 transition-colors
                               cursor-pointer group"
                  >
                    <td className="px-4 py-3 text-gray-400 font-mono
                                   text-xs">
                      #{risk.id}
                    </td>

                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="font-semibold text-gray-800 truncate
                                    group-hover:text-primary transition">
                        {risk.title}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {risk.category ?? '—'}
                    </td>

                    <td className="px-4 py-3">
                      {risk.severity ? (
                        <span className={`px-2.5 py-1 rounded-lg text-xs
                                         font-semibold
                          ${SEVERITY_COLOURS[risk.severity]
                            ?? 'bg-gray-100 text-gray-600'}`}>
                          {risk.severity}
                        </span>
                      ) : '—'}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge value={risk.status} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={scoreColour(risk.score ?? 0)}>
                          {risk.score ?? '—'}
                        </span>
                        {risk.score != null && (
                          <div className="w-10 h-1.5 bg-gray-100 rounded-full
                                          overflow-hidden">
                            <div
                              className={`h-full rounded-full
                                ${risk.score >= 75 ? 'bg-red-500'
                                : risk.score >= 40 ? 'bg-yellow-400'
                                : 'bg-green-500'}`}
                              style={{
                                width: `${Math.min(risk.score, 100)}%`
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {risk.owner ?? '—'}
                    </td>

                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(risk.createdDate)}
                    </td>

                    <td className="px-4 py-3"
                      onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => navigate(`/risks/${risk.id}/edit`)}
                          className="px-2.5 py-1 text-xs border border-primary
                                     text-primary rounded-lg hover:bg-blue-50
                                     transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => navigate(`/risks/${risk.id}`)}
                          className="px-2.5 py-1 text-xs border border-gray-200
                                     text-gray-600 rounded-lg hover:bg-gray-50
                                     transition"
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
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50
                            flex flex-col sm:flex-row items-center
                            justify-between gap-3">
              <p className="text-xs text-gray-500">
                Showing{' '}
                <span className="font-semibold text-gray-700">
                  {page * PAGE_SIZE + 1}
                </span>
                {' – '}
                <span className="font-semibold text-gray-700">
                  {Math.min((page + 1) * PAGE_SIZE, totalElements)}
                </span>
                {' of '}
                <span className="font-semibold text-gray-700">
                  {totalElements}
                </span>
                {' risks'}
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(0)}
                  disabled={page === 0}
                  className="px-2.5 py-1.5 text-xs border border-gray-200
                             rounded-lg disabled:opacity-40 hover:bg-gray-100
                             transition"
                  title="First page"
                >«</button>

                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-xs border border-gray-200
                             rounded-lg disabled:opacity-40 hover:bg-gray-100
                             transition"
                >Prev</button>

                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter(i =>
                    i === 0 || i === totalPages - 1 ||
                    Math.abs(i - page) <= 1
                  )
                  .reduce((acc, i, idx, arr) => {
                    if (idx > 0 && i - arr[idx - 1] > 1)
                      acc.push('...')
                    acc.push(i)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`e-${idx}`}
                        className="px-2 text-xs text-gray-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => handlePageChange(item)}
                        className={`px-3 py-1.5 text-xs border rounded-lg
                                    transition
                          ${page === item
                            ? 'bg-primary text-white border-primary'
                            : 'border-gray-200 hover:bg-gray-100'}`}
                      >
                        {item + 1}
                      </button>
                    )
                  )
                }

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page + 1 >= totalPages}
                  className="px-3 py-1.5 text-xs border border-gray-200
                             rounded-lg disabled:opacity-40 hover:bg-gray-100
                             transition"
                >Next</button>

                <button
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={page + 1 >= totalPages}
                  className="px-2.5 py-1.5 text-xs border border-gray-200
                             rounded-lg disabled:opacity-40 hover:bg-gray-100
                             transition"
                  title="Last page"
                >»</button>
              </div>
            </div>
          )}

          {/* single page count */}
          {!loading && totalPages <= 1 && visibleRisks.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400">
                Showing all {visibleRisks.length} risk
                {visibleRisks.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}