import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getRiskStats, getAllRisks, exportRisksCSV } from '../services/riskService'
import ReportStreamer from '../components/ReportStreamer'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
  LineChart, Line, Area, AreaChart,
} from 'recharts'

// colour palettes 
const CATEGORY_COLOURS = [
  '#1B4F8A', '#2E86C1', '#1ABC9C',
  '#F39C12', '#E74C3C', '#8E44AD', '#27AE60',
]

const STATUS_COLOURS = {
  OPEN:      '#E74C3C',
  MITIGATED: '#F39C12',
  CLOSED:    '#27AE60',
}

const SEVERITY_COLOURS = {
  HIGH:   '#EF4444',
  MEDIUM: '#F59E0B',
  LOW:    '#10B981',
}

//  helpers 
function getMonthLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    month: 'short', year: '2-digit',
  })
}

function buildMonthlyData(risks) {
  const map = {}
  risks.forEach(r => {
    if (!r.createdDate) return
    const label = getMonthLabel(r.createdDate)
    map[label] = (map[label] ?? 0) + 1
  })
  return Object.entries(map)
    .sort(([a], [b]) => new Date('01 ' + a) - new Date('01 ' + b))
    .slice(-6)
    .map(([month, count]) => ({ month, count }))
}

// components OUTSIDE to prevent remount 
function Navbar({ navigate, onLogout, user }) {
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
      <div className="flex gap-4 text-sm items-center">
        <button onClick={() => navigate('/')}
          className="hover:underline opacity-80 hover:opacity-100 transition">
          Dashboard
        </button>
        <button onClick={() => navigate('/risks')}
          className="hover:underline opacity-80 hover:opacity-100 transition">
          Risks
        </button>
        <button onClick={() => navigate('/analytics')}
          className="underline font-semibold">
          Analytics
        </button>
        <button
          onClick={onLogout}
          className="ml-2 px-3 py-1 border border-blue-300 rounded-lg
                     text-xs hover:bg-white hover:text-primary transition"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}

function ChartCard({ title, subtitle, children, loading, action }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {loading ? (
        <div className="h-64 bg-gray-50 rounded-xl animate-pulse
                        flex items-center justify-center">
          <p className="text-xs text-gray-400">Loading chart...</p>
        </div>
      ) : children}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg
                    px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill ?? p.stroke ?? p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg
                    px-3 py-2 text-xs">
      <p className="font-semibold" style={{ color: payload[0].payload.fill }}>
        {payload[0].name}
      </p>
      <p className="text-gray-700">
        Count: <strong>{payload[0].value}</strong>
      </p>
      <p className="text-gray-500">
        Share: <strong>{payload[0].payload.percent}%</strong>
      </p>
    </div>
  )
}

function KpiCard({ label, value, icon, colour, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm
                    p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                       text-xl shrink-0 ${colour} bg-opacity-10`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        {loading ? (
          <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" />
        ) : (
          <p className={`text-2xl font-bold ${colour}`}>{value ?? '—'}</p>
        )}
      </div>
    </div>
  )
}

// main component
export default function AnalyticsPage() {
  const navigate        = useNavigate()
  const { logout, user } = useAuth()

  const [stats, setStats]         = useState(null)
  const [allRisks, setAllRisks]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [period, setPeriod]       = useState('6m')
  const [exporting, setExporting] = useState(false)

  //  fetch data 
  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      getRiskStats(),
      getAllRisks(0, 200, 'createdDate', 'asc'),
    ]).then(([statsRes, risksRes]) => {

      // stats
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data)
      } else {
        // mock data if backend not ready
        setStats({
          totalRisks:   30,
          highSeverity: 8,
          openRisks:    14,
          mitigated:    10,
          byCategory: [
            { name: 'Operational',  count: 8 },
            { name: 'Financial',    count: 6 },
            { name: 'Strategic',    count: 5 },
            { name: 'Compliance',   count: 4 },
            { name: 'Reputational', count: 3 },
            { name: 'Technical',    count: 3 },
            { name: 'Other',        count: 1 },
          ],
          byStatus: [
            { name: 'OPEN',      count: 14 },
            { name: 'MITIGATED', count: 10 },
            { name: 'CLOSED',    count: 6  },
          ],
          bySeverity: [
            { name: 'HIGH',   count: 8  },
            { name: 'MEDIUM', count: 13 },
            { name: 'LOW',    count: 9  },
          ],
        })
        setError('Using demo data — connect backend for live analytics.')
      }

      // all risks for line chart
      if (risksRes.status === 'fulfilled') {
        const list = risksRes.value.data?.content
                  ?? risksRes.value.data
                  ?? []
        setAllRisks(Array.isArray(list) ? list : [])
      }

    }).finally(() => setLoading(false))
  }, [])

  //  CSV export 
  async function handleExport() {
    setExporting(true)
    try {
      const res = await exportRisksCSV()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a   = document.createElement('a')
      a.href    = url
      a.download = `risk-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  //  build pie data with percentages 
  function buildPieData(arr) {
    if (!arr?.length) return []
    const total = arr.reduce((s, i) => s + i.count, 0)
    return arr.map((item, i) => ({
      name:    item.name,
      value:   item.count,
      fill:    STATUS_COLOURS[item.name]
            ?? SEVERITY_COLOURS[item.name]
            ?? CATEGORY_COLOURS[i % CATEGORY_COLOURS.length],
      percent: total ? Math.round((item.count / total) * 100) : 0,
    }))
  }

  //  monthly line chart data filtered by period 
  const monthlyData = buildMonthlyData(allRisks)
  const filteredMonthly = period === '3m'
    ? monthlyData.slice(-3)
    : period === '6m'
    ? monthlyData.slice(-6)
    : monthlyData

  const pieStatusData   = buildPieData(stats?.byStatus   ?? [])
  const pieSeverityData = buildPieData(stats?.bySeverity ?? [])

  //  main component
  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      <Navbar navigate={navigate} onLogout={logout} user={user} />

      <div className="max-w-screen-xl mx-auto px-6 py-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center
                        sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Analytics</h2>
            <p className="text-sm text-gray-500 mt-1">
              Risk trends, distributions and AI report generation
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary
                       text-white text-sm font-medium rounded-xl
                       hover:opacity-90 disabled:opacity-50 transition"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none"
                  viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor"
                  strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4
                       4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </>
            )}
          </button>
        </div>

        {/* error banner */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-yellow-50 border border-yellow-200
                          text-yellow-800 rounded-xl text-sm flex items-center
                          gap-2">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard label="Total Risks"   value={stats?.totalRisks}
            icon="📋" colour="text-primary"    loading={loading} />
          <KpiCard label="High Severity" value={stats?.highSeverity}
            icon="🔴" colour="text-red-600"    loading={loading} />
          <KpiCard label="Open Risks"    value={stats?.openRisks}
            icon="⚠️" colour="text-yellow-600" loading={loading} />
          <KpiCard label="Mitigated"     value={stats?.mitigated}
            icon="✅" colour="text-green-600"  loading={loading} />
        </div>

        {/* ── Row 1: BarChart + PieChart status ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* BarChart by category */}
          <ChartCard
            title="Risks by Category"
            subtitle="Distribution across risk categories"
            loading={loading}
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={stats?.byCategory ?? []}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                barSize={36}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"
                  vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Risks" radius={[6, 6, 0, 0]}>
                  {(stats?.byCategory ?? []).map((_, i) => (
                    <Cell key={i}
                      fill={CATEGORY_COLOURS[i % CATEGORY_COLOURS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* PieChart by status */}
          <ChartCard
            title="By Status"
            subtitle="Open · Mitigated · Closed"
            loading={loading}
          >
            {pieStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieStatusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs text-gray-600">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center
                              text-gray-400 text-sm">
                No data available
              </div>
            )}
          </ChartCard>
        </div>

        {/* ── Row 2: LineChart + PieChart severity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* LineChart over time */}
          <ChartCard
            title="Risks Over Time"
            subtitle="New risks registered per month"
            loading={loading}
            action={
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {['3m', '6m', 'all'].map(p => (
                  <button key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md
                                transition
                      ${period === p
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {p === 'all' ? 'All' : p.toUpperCase()}
                  </button>
                ))}
              </div>
            }
          >
            {filteredMonthly.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={filteredMonthly}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0"
                      x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1B4F8A"
                        stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1B4F8A"
                        stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"
                    vertical={false} />
                  <XAxis dataKey="month"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false} tickLine={false}
                    allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="New Risks"
                    stroke="#1B4F8A"
                    strokeWidth={2.5}
                    fill="url(#areaGrad)"
                    dot={{ fill: '#1B4F8A', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center
                              text-gray-400 gap-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor"
                  strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1
                       1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <p className="text-sm">No time data available</p>
              </div>
            )}
          </ChartCard>

          {/* PieChart by severity */}
          <ChartCard
            title="By Severity"
            subtitle="HIGH · MEDIUM · LOW"
            loading={loading}
          >
            {pieSeverityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieSeverityData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieSeverityData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs text-gray-600">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center
                              text-gray-400 text-sm">
                No data available
              </div>
            )}
          </ChartCard>
        </div>

        {/* ── Row 3: Severity BarChart ── */}
        <div className="mb-6">
          <ChartCard
            title="Risks by Severity"
            subtitle="Count of HIGH · MEDIUM · LOW severity risks"
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={stats?.bySeverity ?? []}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                barSize={60}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"
                  vertical={false} />
                <XAxis dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false} tickLine={false}
                  allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Risks" radius={[8, 8, 0, 0]}>
                  {(stats?.bySeverity ?? []).map((entry) => (
                    <Cell key={entry.name}
                      fill={SEVERITY_COLOURS[entry.name] ?? '#1B4F8A'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Row 4: AI Report Streamer ── */}
        <ReportStreamer riskData={null} />

      </div>
    </div>
  )
}