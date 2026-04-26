import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRiskById, deleteRisk } from '../services/riskService'
import AiPanel from '../components/AiPanel'

//  helpers 
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

//  badge styles  
const SEVERITY_STYLES = {
  HIGH:   'bg-red-100 text-red-700 border border-red-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  LOW:    'bg-green-100 text-green-700 border border-green-200',
}

const STATUS_STYLES = {
  OPEN:      'bg-blue-100 text-blue-700 border border-blue-200',
  MITIGATED: 'bg-orange-100 text-orange-700 border border-orange-200',
  CLOSED:    'bg-gray-100 text-gray-600 border border-gray-200',
}

//score helpers 
function scoreColour(score) {
  if (score >= 75) return { ring: '#EF4444', text: 'text-red-600', label: 'Critical Risk', bg: 'bg-red-50' }
  if (score >= 40) return { ring: '#F59E0B', text: 'text-yellow-600', label: 'Moderate Risk', bg: 'bg-yellow-50' }
  return { ring: '#10B981', text: 'text-green-600', label: 'Low Risk', bg: 'bg-green-50' }
}

// components defined OUTSIDE to prevent remount
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
          className="hover:underline opacity-80 hover:opacity-100 transition">
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

function FieldRow({ label, children }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3
                    border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase
                       tracking-wider pt-0.5 col-span-1">
        {label}
      </span>
      <div className="text-sm text-gray-800 col-span-2 leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function ScoreRing({ score }) {
  const radius       = 40
  const stroke       = 7
  const norm         = radius - stroke / 2
  const circumference = 2 * Math.PI * norm
  const offset       = circumference - (Math.min(score, 100) / 100) * circumference
  const c            = scoreColour(score)

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={norm}
          fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        <circle cx="48" cy="48" r={norm}
          fill="none" stroke={c.ring} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center
                      justify-center">
        <span className={`text-xl font-bold leading-none ${c.text}`}>
          {score}
        </span>
        <span className="text-xs text-gray-400 leading-none mt-0.5">
          /100
        </span>
      </div>
    </div>
  )
}

function DeleteModal({ title, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
                    bg-black bg-opacity-50 px-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm
                      animate-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center
                          justify-center shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="none"
              stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0
                   01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0
                   00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">
              Delete Risk
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              This action cannot be undone
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6 leading-relaxed
                      bg-gray-50 rounded-lg px-4 py-3">
          You are about to permanently delete{' '}
          <span className="font-semibold text-gray-800">"{title}"</span>.
          All associated data will be lost.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm
                       font-semibold rounded-xl hover:bg-red-700
                       disabled:opacity-50 transition flex items-center
                       justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none"
                  viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Deleting...
              </>
            ) : 'Yes, Delete'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700
                       text-sm font-medium rounded-xl hover:bg-gray-50
                       transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-primary h-16 shadow" />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-gray-200 rounded w-48" />
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-6
                              space-y-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200
                              p-6 h-48" />
              <div className="bg-white rounded-2xl border border-gray-200
                              p-6 h-48" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ErrorState({ message, navigate }) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-primary h-16 shadow" />
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center p-8 max-w-sm">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center
                          justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none"
              stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948
                   3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949
                   3.378c-.866-1.5-3.032-1.5-3.898 0L2.697
                   16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{message}</h2>
          <p className="text-sm text-gray-500 mb-6">
            The risk you are looking for could not be loaded.
          </p>
          <button
            onClick={() => navigate('/risks')}
            className="px-6 py-2.5 bg-primary text-white text-sm font-medium
                       rounded-xl hover:opacity-90 transition"
          >
            ← Back to Risk Register
          </button>
        </div>
      </div>
    </div>
  )
}

//  main component 
export default function DetailPage() {
  const navigate = useNavigate()
  const { id }   = useParams()

  const [risk, setRisk]                       = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading]     = useState(false)

  useEffect(() => {
    setLoading(true)
    getRiskById(id)
      .then(res => setRisk(res.data))
      .catch(err => setError(
        err.response?.status === 404
          ? 'Risk not found. It may have been deleted.'
          : 'Failed to load risk details. Please try again.'
      ))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      await deleteRisk(id)
      navigate('/risks', { replace: true })
    } catch {
      setDeleteLoading(false)
      setShowDeleteModal(false)
      alert('Delete failed. Please try again.')
    }
  }

  if (loading) return <LoadingSkeleton />
  if (error)   return <ErrorState message={error} navigate={navigate} />

  const c           = scoreColour(risk.score ?? 0)
  const isOverdue   = risk.dueDate && new Date(risk.dueDate) < new Date()

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      <Navbar navigate={navigate} />

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button onClick={() => navigate('/risks')}
            className="hover:text-primary transition">
            Risk Register
          </button>
          <svg className="w-3 h-3" fill="none" stroke="currentColor"
            strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700 font-medium truncate max-w-sm">
            {risk.title}
          </span>
        </div>

        {/* ── Page header ── */}
        <div className="bg-white rounded-2xl border border-gray-200
                        shadow-sm px-6 py-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start
                          sm:justify-between gap-4">
            <div className="flex-1 min-w-0">

              {/* badges row */}
              <div className="flex flex-wrap gap-2 mb-3">
                {risk.severity && (
                  <span className={`px-3 py-1 rounded-full text-xs
                                   font-semibold ${SEVERITY_STYLES[risk.severity]
                                   ?? 'bg-gray-100 text-gray-600'}`}>
                    {risk.severity}
                  </span>
                )}
                {risk.status && (
                  <span className={`px-3 py-1 rounded-full text-xs
                                   font-semibold ${STATUS_STYLES[risk.status]
                                   ?? 'bg-gray-100 text-gray-600'}`}>
                    {risk.status}
                  </span>
                )}
                {risk.category && (
                  <span className="px-3 py-1 rounded-full text-xs
                                   font-semibold bg-purple-50 text-purple-700
                                   border border-purple-200">
                    {risk.category}
                  </span>
                )}
                {isOverdue && (
                  <span className="px-3 py-1 rounded-full text-xs
                                   font-semibold bg-red-100 text-red-700
                                   border border-red-200 animate-pulse">
                    ⚠ Overdue
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 leading-tight
                             mb-1">
                {risk.title}
              </h1>
              <p className="text-xs text-gray-400">
                Risk ID #{risk.id}
                &nbsp;·&nbsp;
                Created {formatDateTime(risk.createdDate)}
                {risk.lastModifiedDate && (
                  <>&nbsp;·&nbsp;Updated {formatDateTime(risk.lastModifiedDate)}</>
                )}
              </p>
            </div>

            {/* action buttons */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => navigate(`/risks/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 border
                           border-primary text-primary text-sm font-medium
                           rounded-xl hover:bg-blue-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor"
                  strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0
                       002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828
                       15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 border
                           border-red-200 text-red-600 text-sm font-medium
                           rounded-xl hover:bg-red-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor"
                  strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0
                       01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0
                       00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* ── Main content grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: 2/3 width ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Risk Details card */}
            <div className="bg-white rounded-2xl border border-gray-200
                            shadow-sm p-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase
                             tracking-widest mb-4">
                Risk Details
              </h2>

              <FieldRow label="Description">
                {risk.description ? (
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {risk.description}
                  </p>
                ) : (
                  <span className="text-gray-400 italic">
                    No description provided
                  </span>
                )}
              </FieldRow>

              <FieldRow label="Category">
                {risk.category ? (
                  <span className="px-2.5 py-1 bg-purple-50 text-purple-700
                                   border border-purple-200 rounded-lg
                                   text-xs font-medium">
                    {risk.category}
                  </span>
                ) : '—'}
              </FieldRow>

              <FieldRow label="Severity">
                {risk.severity ? (
                  <span className={`px-2.5 py-1 rounded-lg text-xs
                                   font-semibold
                    ${SEVERITY_STYLES[risk.severity]
                      ?? 'bg-gray-100 text-gray-600'}`}>
                    {risk.severity}
                  </span>
                ) : '—'}
              </FieldRow>

              <FieldRow label="Status">
                {risk.status ? (
                  <span className={`px-2.5 py-1 rounded-lg text-xs
                                   font-semibold
                    ${STATUS_STYLES[risk.status]
                      ?? 'bg-gray-100 text-gray-600'}`}>
                    {risk.status}
                  </span>
                ) : '—'}
              </FieldRow>

              <FieldRow label="Owner">
                {risk.owner ? (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary bg-opacity-10
                                    rounded-full flex items-center justify-center
                                    text-xs font-bold text-primary shrink-0">
                      {risk.owner[0]?.toUpperCase()}
                    </div>
                    <span>{risk.owner}</span>
                  </div>
                ) : '—'}
              </FieldRow>

              <FieldRow label="Due Date">
                {risk.dueDate ? (
                  <div className="flex items-center gap-2">
                    <span className={isOverdue
                      ? 'text-red-600 font-semibold'
                      : 'text-gray-800'}>
                      {formatDate(risk.dueDate)}
                    </span>
                    {isOverdue && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600
                                       text-xs font-medium rounded-full">
                        Overdue
                      </span>
                    )}
                  </div>
                ) : '—'}
              </FieldRow>

              <FieldRow label="Created">
                {formatDateTime(risk.createdDate)}
              </FieldRow>

              <FieldRow label="Last Updated">
                {formatDateTime(risk.lastModifiedDate)}
              </FieldRow>
            </div>

            {/* Mitigation Plan card */}
            <div className="bg-white rounded-2xl border border-gray-200
                            shadow-sm p-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase
                             tracking-widest mb-4">
                Mitigation Plan
              </h2>
              {risk.mitigationPlan ? (
                <p className="text-sm text-gray-700 leading-relaxed
                              whitespace-pre-wrap">
                  {risk.mitigationPlan}
                </p>
              ) : (
                <div className="flex items-center gap-4 py-6 px-4
                                bg-gray-50 rounded-xl border border-dashed
                                border-gray-200">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg
                                  flex items-center justify-center shrink-0
                                  text-lg">
                    📋
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      No mitigation plan defined
                    </p>
                    <button
                      onClick={() => navigate(`/risks/${id}/edit`)}
                      className="text-xs text-primary hover:underline mt-0.5"
                    >
                      Add a mitigation plan →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Panel */}
            <AiPanel riskData={risk} />

          </div>

          {/* ── Right: 1/3 width ── */}
          <div className="space-y-6">

            {/* Score card */}
            <div className="bg-white rounded-2xl border border-gray-200
                            shadow-sm p-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase
                             tracking-widest mb-5">
                Risk Score
              </h2>
              <div className="flex flex-col items-center">
                <ScoreRing score={risk.score ?? 0} />
                <div className={`mt-4 px-4 py-2 rounded-xl text-sm
                                 font-semibold ${c.bg} ${c.text}`}>
                  {c.label}
                </div>
                {/* mini score bar */}
                <div className="w-full mt-4">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all
                                 duration-700"
                      style={{
                        width: `${Math.min(risk.score ?? 0, 100)}%`,
                        backgroundColor: c.ring,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400
                                  mt-1">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center
                              leading-relaxed">
                  0–39 Low · 40–74 Moderate · 75–100 Critical
                </p>
              </div>
            </div>

            {/* Quick Info card */}
            <div className="bg-white rounded-2xl border border-gray-200
                            shadow-sm p-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase
                             tracking-widest mb-4">
                Quick Info
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'Severity', value: risk.severity,
                    badge: SEVERITY_STYLES[risk.severity] },
                  { label: 'Status', value: risk.status,
                    badge: STATUS_STYLES[risk.status] },
                ].map(({ label, value, badge }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    {value ? (
                      <span className={`px-2.5 py-1 rounded-lg text-xs
                                       font-semibold ${badge
                                       ?? 'bg-gray-100 text-gray-600'}`}>
                        {value}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </div>
                ))}
                {[
                  { label: 'Category', value: risk.category },
                  { label: 'Owner',    value: risk.owner    },
                  { label: 'Due Date', value: formatDate(risk.dueDate) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm text-gray-700 font-medium">
                      {value ?? '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions card */}
            <div className="bg-white rounded-2xl border border-gray-200
                            shadow-sm p-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase
                             tracking-widest mb-4">
                Actions
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/risks/${id}/edit`)}
                  className="w-full py-2.5 bg-primary text-white text-sm
                             font-medium rounded-xl hover:opacity-90
                             transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor"
                    strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0
                         002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828
                         15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Risk
                </button>

                <button
                  onClick={() => navigate('/risks/new')}
                  className="w-full py-2.5 border border-gray-200
                             text-gray-600 text-sm font-medium rounded-xl
                             hover:bg-gray-50 transition flex items-center
                             justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor"
                    strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 4v16m8-8H4" />
                  </svg>
                  New Risk
                </button>

                <button
                  onClick={() => navigate('/risks')}
                  className="w-full py-2.5 border border-gray-200
                             text-gray-600 text-sm font-medium rounded-xl
                             hover:bg-gray-50 transition flex items-center
                             justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor"
                    strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Back to List
                </button>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-2.5 border border-red-200
                             text-red-600 text-sm font-medium rounded-xl
                             hover:bg-red-50 transition flex items-center
                             justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor"
                    strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0
                         01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0
                         00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Risk
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal
          title={risk.title}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleteLoading}
        />
      )}

    </div>
  )
}