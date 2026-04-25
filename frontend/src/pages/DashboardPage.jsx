import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getRiskStats } from '../services/riskService'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'

// ── Navbar — defined outside to prevent remount ──────────────────────────────
function Navbar({ user, onLogout, navigate }) {
  return (
    <nav className="bg-primary text-white px-6 py-4 flex items-center
                    justify-between shadow sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="w-6 h-6">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span className="text-lg font-semibold tracking-wide">
          Risk Assessment Engine
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <button onClick={() => navigate('/')}
          className="underline font-semibold">
          Dashboard
        </button>
        <button onClick={() => navigate('/risks')}
          className="hover:underline opacity-80 hover:opacity-100">
          Risks
        </button>
        <button onClick={() => navigate('/analytics')}
          className="hover:underline opacity-80 hover:opacity-100">
          Analytics
        </button>
        <div className="hidden sm:flex items-center gap-2 ml-2
                        pl-4 border-l border-blue-400">
          <div className="w-7 h-7 bg-white bg-opacity-20 rounded-full
                          flex items-center justify-center text-xs font-bold">
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="text-xs">
            <p className="font-medium leading-none">
              {user?.username ?? 'User'}
            </p>
            <p className="text-blue-200 text-xs">
              {user?.role ?? 'VIEWER'}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="ml-1 px-3 py-1 border border-blue-300 rounded
                     text-xs hover:bg-white hover:text-primary transition"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}

// ── KPI card — defined outside ────────────────────────────────────────────────
function KpiCard({ label, value, icon, colour, subLabel, loading }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200
                    shadow-sm p-6 flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
          {label}
        </p>
        {loading ? (
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
        ) : (
          <p className={`text-3xl font-bold ${colour}`}>{value ?? '—'}</p>
        )}
        {subLabel && !loading && (
          <p className="text-xs text-gray-400 mt-1">{subLabel}</p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center
                       justify-center text-lg ${colour}
                       bg-opacity-10 bg-current`}>
        {icon}
      </div>
    </div>
  )
}

// ── colours for bar chart ─────────────────────────────────────────────────────
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
  HIGH:   '#E74C3C',
  MEDIUM: '#F39C12',
  LOW:    '#27AE60',
}

// ── custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg
                    shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill ?? p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const navigate        = useNavigate()
  const { logout, user } = useAuth()

  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [chartView, setChartView] = useState('category') // 'category' | 'status' | 'severity'

  // ── fetch stats from GET /risks/stats ─────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    setError(null)
    getRiskStats()
      .then(res => setStats(res.data))
      .catch(err => {
        console.error('Stats fetch error:', err)
        setError('Could not load dashboard data.')
        // use mock data so the UI is still useful while backend is being built
        setStats({
          totalRisks:    30,
          highSeverity:  8,
          openRisks:     14,
          mitigated:     10,
          byCategory: [
            { name: 'Operational',   count: 8  },
            { name: 'Financial',     count: 6  },
            { name: 'Strategic',     count: 5  },
            { name: 'Compliance',    count: 4  },
            { name: 'Reputational',  count: 3  },
            { name: 'Technical',     count: 3  },
            { name: 'Other',         count: 1  },
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
      })
      .finally(() => setLoading(false))
  }, [])

  // ── pick chart data based on selected view ────────────────────────────────
  function getChartData() {
    if (!stats) return []
    if (chartView === 'status')   return stats.byStatus   ?? []
    if (chartView === 'severity') return stats.bySeverity ?? []
    return stats.byCategory ?? []
  }

  function getBarColour(entry, index) {
    if (chartView === 'status')
      return STATUS_COLOURS[entry.name]   ?? '#1B4F8A'
    if (chartView === 'severity')
      return SEVERITY_COLOURS[entry.name] ?? '#1B4F8A'
    return CATEGORY_COLOURS[index % CATEGORY_COLOURS.length]
  }

  const chartData = getChartData()

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      <Navbar user={user} onLogout={logout} navigate={navigate} />

      <div className="max-w-screen-xl mx-auto px-6 py-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center
                        sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Dashboard
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Risk overview and key performance indicators
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/risks/new')}
              className="px-4 py-2 bg-primary text-white text-sm
                         rounded-lg hover:opacity-90 transition"
            >
              + New Risk
            </button>
            <button
              onClick={() => navigate('/risks')}
              className="px-4 py-2 border border-gray-300 text-gray-600
                         text-sm rounded-lg hover:bg-gray-50 transition"
            >
              View All Risks
            </button>
          </div>
        </div>

        {/* ── error banner ── */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-yellow-50 border
                          border-yellow-200 text-yellow-800 rounded-lg
                          text-sm flex items-center gap-2">
            <span>⚠</span>
            <span>
              {error} Showing demo data — connect the backend to see
              live figures.
            </span>
          </div>
        )}

        {/* ── 4 KPI cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
                        gap-4 mb-8">
          <KpiCard
            label="Total Risks"
            value={stats?.totalRisks}
            icon="📋"
            colour="text-primary"
            subLabel="All registered risks"
            loading={loading}
          />
          <KpiCard
            label="High Severity"
            value={stats?.highSeverity}
            icon="🔴"
            colour="text-red-600"
            subLabel="Require immediate action"
            loading={loading}
          />
          <KpiCard
            label="Open Risks"
            value={stats?.openRisks}
            icon="⚠️"
            colour="text-yellow-600"
            subLabel="Awaiting mitigation"
            loading={loading}
          />
          <KpiCard
            label="Mitigated"
            value={stats?.mitigated}
            icon="✅"
            colour="text-green-600"
            subLabel="Successfully mitigated"
            loading={loading}
          />
        </div>

        {/* ── Chart section ── */}
        <div className="bg-white rounded-xl border border-gray-200
                        shadow-sm p-6 mb-6">

          {/* chart header + view toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center
                          sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                Risk Distribution
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Number of risks by{' '}
                {chartView === 'category' ? 'category'
                : chartView === 'status'  ? 'status'
                : 'severity'}
              </p>
            </div>

            {/* toggle buttons */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'category', label: 'Category' },
                { key: 'status',   label: 'Status'   },
                { key: 'severity', label: 'Severity' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setChartView(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md
                              transition
                              ${chartView === key
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* bar chart */}
          {loading ? (
            <div className="h-64 bg-gray-50 rounded-lg animate-pulse
                            flex items-center justify-center">
              <p className="text-sm text-gray-400">Loading chart...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center
                            bg-gray-50 rounded-lg border border-dashed
                            border-gray-200">
              <p className="text-sm text-gray-400">No data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                barSize={40}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  name="Risks"
                  radius={[6, 6, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getBarColour(entry, index)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Bottom row: status breakdown + quick actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* status breakdown table */}
          <div className="lg:col-span-2 bg-white rounded-xl border
                          border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Status Breakdown
            </h3>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i}
                    className="h-10 bg-gray-100 rounded animate-pulse"/>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(stats?.byStatus ?? []).map(item => {
                  const total = stats?.totalRisks || 1
                  const pct   = Math.round((item.count / total) * 100)
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between
                                      mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full`}
                            style={{
                              backgroundColor:
                                STATUS_COLOURS[item.name] ?? '#1B4F8A'
                            }}
                          />
                          <span className="text-sm text-gray-700">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold
                                           text-gray-800">
                            {item.count}
                          </span>
                          <span className="text-xs text-gray-400 w-8
                                           text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full
                                      overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all
                                     duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              STATUS_COLOURS[item.name] ?? '#1B4F8A'
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* quick actions panel */}
          <div className="bg-white rounded-xl border border-gray-200
                          shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                {
                  label:  'Create New Risk',
                  icon:   '➕',
                  path:   '/risks/new',
                  colour: 'bg-primary text-white hover:opacity-90',
                },
                {
                  label:  'View Risk Register',
                  icon:   '📋',
                  path:   '/risks',
                  colour: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
                },
                {
                  label:  'View Analytics',
                  icon:   '📊',
                  path:   '/analytics',
                  colour: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
                },
              ].map(({ label, icon, path, colour }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`w-full flex items-center gap-3 px-4 py-3
                              rounded-lg text-sm font-medium transition
                              ${colour}`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* severity summary */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500
                            uppercase tracking-wider mb-3">
                Severity Summary
              </p>
              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i}
                      className="h-6 bg-gray-100 rounded animate-pulse"/>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {(stats?.bySeverity ?? []).map(item => (
                    <div key={item.name}
                      className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-xs
                                     font-medium"
                          style={{
                            backgroundColor:
                              `${SEVERITY_COLOURS[item.name]}20`,
                            color: SEVERITY_COLOURS[item.name],
                          }}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-700">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}