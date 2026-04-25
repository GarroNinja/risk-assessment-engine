import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRiskById, deleteRisk } from '../services/riskService'
import { describeRisk, recommendActions } from '../services/aiService'

// ── helpers — defined OUTSIDE to prevent remount ─────────────────────────────
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

// ── badge configs ─────────────────────────────────────────────────────────────
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

const PRIORITY_STYLES = {
  HIGH:   'bg-red-50 text-red-700 border-l-4 border-red-400',
  MEDIUM: 'bg-yellow-50 text-yellow-700 border-l-4 border-yellow-400',
  LOW:    'bg-green-50 text-green-700 border-l-4 border-green-400',
}

// ── score ring colour ─────────────────────────────────────────────────────────
function scoreRingColour(score) {
  if (score >= 75) return '#EF4444'
  if (score >= 40) return '#F59E0B'
  return '#10B981'
}

function scoreTextColour(score) {
  if (score >= 75) return 'text-red-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-green-600'
}

// ── reusable field row ────────────────────────────────────────────────────────
function FieldRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4
                    py-3 border-b border-gray-100 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase
                       tracking-wider sm:w-36 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-800 flex-1">{children}</span>
    </div>
  )
}

// ── delete confirm modal ──────────────────────────────────────────────────────
function DeleteModal({ title, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
                    bg-black bg-opacity-40 px-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center
                          justify-center text-red-600 text-lg shrink-0">
            ⚠
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Delete Risk</h3>
            <p className="text-xs text-gray-500">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete{' '}
          <span className="font-semibold">"{title}"</span>?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 bg-red-600 text-white text-sm font-medium
                       rounded-lg hover:bg-red-700 disabled:opacity-50
                       transition flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" fill="none"
                viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            )}
            {loading ? 'Deleting...' : 'Yes, Delete'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 border border-gray-300 text-gray-700
                       text-sm rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── score ring SVG ────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const radius      = 36
  const stroke      = 6
  const normalised  = radius - stroke / 2
  const circumference = 2 * Math.PI * normalised
  const offset      = circumference - (score / 100) * circumference
  const colour      = scoreRingColour(score)

  return (
    <div className="flex flex-col items-center">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={normalised}
          fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle cx="44" cy="44" r={normalised}
          fill="none" stroke={colour} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-bold ${scoreTextColour(score)}`}>
          {score}
        </span>
        <span className="text-xs text-gray-400">/100</span>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function DetailPage() {
  const navigate      = useNavigate()
  const { id }        = useParams()

  const [risk, setRisk]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading]     = useState(false)

  // ── AI state ──────────────────────────────────────────────────────────────
  const [aiDescription, setAiDescription]     = useState(null)
  const [aiRecommendations, setAiRecommendations] = useState(null)
  const [aiLoading, setAiLoading]             = useState(false)
  const [aiError, setAiError]                 = useState(null)
  const [aiTab, setAiTab]                     = useState('describe')

  // ── fetch risk ────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    getRiskById(id)
      .then(res => setRisk(res.data))
      .catch(err => {
        if (err.response?.status === 404) {
          setError('Risk not found. It may have been deleted.')
        } else {
          setError('Failed to load risk details. Please try again.')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  // ── delete ────────────────────────────────────────────────────────────────
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

  // ── AI analysis ───────────────────────────────────────────────────────────
  async function handleAskAi() {
    if (!risk) return
    setAiLoading(true)
    setAiError(null)
    setAiDescription(null)
    setAiRecommendations(null)

    const payload = {
      title:       risk.title,
      description: risk.description,
      category:    risk.category,
      severity:    risk.severity,
      score:       risk.score,
    }

    try {
      if (aiTab === 'describe') {
        const res = await describeRisk(payload)
        setAiDescription(res.data)
      } else {
        const res = await recommendActions(payload)
        setAiRecommendations(
          Array.isArray(res.data)
            ? res.data
            : res.data?.recommendations ?? []
        )
      }
    } catch (err) {
      setAiError(
        err.message === 'Network Error'
          ? 'Cannot reach AI service. Make sure the AI service is running on port 5000.'
          : err.response?.data?.error
          ?? 'AI service unavailable. Please try again.'
      )
    } finally {
      setAiLoading(false)
    }
  }

  // ── loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <nav className="bg-primary h-16 shadow" />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="h-10 bg-gray-200 rounded w-2/3" />
            <div className="bg-white rounded-xl border border-gray-200 p-6
                            space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center
                      justify-center">
        <div className="text-center p-8">
          <p className="text-5xl mb-4">⚠️</p>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {error}
          </h2>
          <button
            onClick={() => navigate('/risks')}
            className="mt-4 px-6 py-2 bg-primary text-white text-sm
                       rounded-lg hover:opacity-90 transition"
          >
            Back to Risk Register
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── Navbar ── */}
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
        <div className="flex gap-4 text-sm">
          <button onClick={() => navigate('/')}
            className="hover:underline opacity-80 hover:opacity-100">
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
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button onClick={() => navigate('/risks')}
            className="hover:text-primary hover:underline">
            Risk Register
          </button>
          <span>/</span>
          <span className="text-gray-800 font-medium truncate max-w-xs">
            {risk.title}
          </span>
        </div>

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start
                        sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold
                ${SEVERITY_STYLES[risk.severity]
                  ?? 'bg-gray-100 text-gray-600'}`}>
                {risk.severity ?? '—'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold
                ${STATUS_STYLES[risk.status]
                  ?? 'bg-gray-100 text-gray-600'}`}>
                {risk.status ?? '—'}
              </span>
              {risk.category && (
                <span className="px-3 py-1 rounded-full text-xs font-medium
                                 bg-purple-50 text-purple-700
                                 border border-purple-200">
                  {risk.category}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {risk.title}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Risk ID #{risk.id} · Created {formatDateTime(risk.createdDate)}
            </p>
          </div>

          {/* action buttons */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => navigate(`/risks/${id}/edit`)}
              className="px-4 py-2 border border-primary text-primary
                         text-sm rounded-lg hover:bg-blue-50 transition
                         flex items-center gap-1.5"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 border border-red-300 text-red-600
                         text-sm rounded-lg hover:bg-red-50 transition
                         flex items-center gap-1.5"
            >
              🗑️ Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column: details ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* main details card */}
            <div className="bg-white rounded-xl border border-gray-200
                            shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase
                             tracking-wider mb-4">
                Risk Details
              </h2>

              <FieldRow label="Description">
                {risk.description
                  ? <span className="leading-relaxed">{risk.description}</span>
                  : <span className="text-gray-400 italic">No description</span>
                }
              </FieldRow>

              <FieldRow label="Category">
                {risk.category ?? '—'}
              </FieldRow>

              <FieldRow label="Severity">
                {risk.severity ? (
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold
                    ${SEVERITY_STYLES[risk.severity]}`}>
                    {risk.severity}
                  </span>
                ) : '—'}
              </FieldRow>

              <FieldRow label="Status">
                {risk.status ? (
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold
                    ${STATUS_STYLES[risk.status]}`}>
                    {risk.status}
                  </span>
                ) : '—'}
              </FieldRow>

              <FieldRow label="Owner">
                {risk.owner
                  ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary bg-opacity-10
                                      rounded-full flex items-center
                                      justify-center text-xs font-bold
                                      text-primary">
                        {risk.owner[0]?.toUpperCase()}
                      </div>
                      {risk.owner}
                    </div>
                  ) : '—'
                }
              </FieldRow>

              <FieldRow label="Due Date">
                {risk.dueDate ? (
                  <span className={
                    new Date(risk.dueDate) < new Date()
                      ? 'text-red-600 font-medium'
                      : ''
                  }>
                    {formatDate(risk.dueDate)}
                    {new Date(risk.dueDate) < new Date() && (
                      <span className="ml-2 text-xs bg-red-100 text-red-600
                                       px-1.5 py-0.5 rounded">
                        Overdue
                      </span>
                    )}
                  </span>
                ) : '—'}
              </FieldRow>

              <FieldRow label="Created">
                {formatDateTime(risk.createdDate)}
              </FieldRow>

              <FieldRow label="Last Updated">
                {formatDateTime(risk.lastModifiedDate)}
              </FieldRow>
            </div>

            {/* mitigation plan card */}
            <div className="bg-white rounded-xl border border-gray-200
                            shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase
                             tracking-wider mb-4">
                Mitigation Plan
              </h2>
              {risk.mitigationPlan ? (
                <p className="text-sm text-gray-700 leading-relaxed
                              whitespace-pre-wrap">
                  {risk.mitigationPlan}
                </p>
              ) : (
                <div className="flex items-center gap-3 py-4 text-gray-400">
                  <span className="text-2xl">📋</span>
                  <div>
                    <p className="text-sm">No mitigation plan defined</p>
                    <button
                      onClick={() => navigate(`/risks/${id}/edit`)}
                      className="text-xs text-primary hover:underline mt-0.5"
                    >
                      Add one now
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── AI Analysis card ── */}
            <div className="bg-white rounded-xl border border-gray-200
                            shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <h2 className="text-sm font-semibold text-gray-500
                                 uppercase tracking-wider">
                    AI Analysis
                  </h2>
                </div>
                <button
                  onClick={handleAskAi}
                  disabled={aiLoading}
                  className="px-4 py-1.5 bg-primary text-white text-xs
                             font-medium rounded-lg hover:opacity-90
                             disabled:opacity-50 transition flex items-center
                             gap-1.5"
                >
                  {aiLoading ? (
                    <>
                      <svg className="animate-spin h-3 w-3" fill="none"
                        viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12"
                          r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Analysing...
                    </>
                  ) : 'Ask AI'}
                </button>
              </div>

              {/* tab switcher */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
                {[
                  { key: 'describe',  label: '📝 Describe'    },
                  { key: 'recommend', label: '💡 Recommend'   },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setAiTab(key)
                      setAiDescription(null)
                      setAiRecommendations(null)
                      setAiError(null)
                    }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md
                                transition
                                ${aiTab === key
                                  ? 'bg-white text-primary shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* loading skeleton */}
              {aiLoading && (
                <div className="animate-pulse space-y-3 py-2">
                  <div className="h-4 bg-blue-100 rounded w-full" />
                  <div className="h-4 bg-blue-100 rounded w-4/5" />
                  <div className="h-4 bg-blue-100 rounded w-3/5" />
                </div>
              )}

              {/* error */}
              {aiError && !aiLoading && (
                <div className="flex items-start gap-3 bg-red-50
                                border border-red-200 rounded-lg px-4
                                py-3 text-sm text-red-700">
                  <span className="mt-0.5">⚠</span>
                  <div>
                    <p>{aiError}</p>
                    <button onClick={handleAskAi}
                      className="underline text-xs mt-1">
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* describe result */}
              {aiDescription && !aiLoading && (
                <div className="bg-blue-50 border border-blue-100
                                rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-gray-500">
                      AI Description
                      {aiDescription.generated_at && (
                        <span className="ml-2">
                          · {formatDateTime(aiDescription.generated_at)}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed
                                whitespace-pre-wrap">
                    {aiDescription.description
                      ?? aiDescription.content
                      ?? JSON.stringify(aiDescription, null, 2)}
                  </p>
                  {aiDescription.meta?.model_used && (
                    <p className="text-xs text-gray-400 mt-3">
                      Model: {aiDescription.meta.model_used}
                      {aiDescription.meta.cached && ' · cached'}
                    </p>
                  )}
                </div>
              )}

              {/* recommend result */}
              {aiRecommendations && !aiLoading && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 mb-2">
                    AI Recommendations
                  </p>
                  {aiRecommendations.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      No recommendations returned.
                    </p>
                  ) : (
                    aiRecommendations.map((rec, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-lg text-sm
                          ${PRIORITY_STYLES[rec.priority]
                            ?? 'bg-gray-50 border-l-4 border-gray-300'}`}
                      >
                        <div className="flex items-center justify-between
                                        mb-1">
                          <span className="font-semibold text-xs uppercase
                                           tracking-wide">
                            {rec.action_type ?? `Action ${i + 1}`}
                          </span>
                          {rec.priority && (
                            <span className="text-xs font-medium opacity-75">
                              {rec.priority} Priority
                            </span>
                          )}
                        </div>
                        <p className="leading-relaxed">{rec.description}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* placeholder when nothing has been asked yet */}
              {!aiLoading && !aiError && !aiDescription
                && !aiRecommendations && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-3xl mb-2">🤖</p>
                  <p className="text-sm">
                    Click <strong>Ask AI</strong> to get an AI-powered
                    {aiTab === 'describe'
                      ? ' description'
                      : ' recommendations'} for this risk.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* ── Right column: score + meta ── */}
          <div className="space-y-6">

            {/* score card */}
            <div className="bg-white rounded-xl border border-gray-200
                            shadow-sm p-6 flex flex-col items-center">
              <h2 className="text-sm font-semibold text-gray-500 uppercase
                             tracking-wider mb-4 self-start">
                Risk Score
              </h2>
              <div className="relative flex items-center justify-center
                              mb-3">
                <ScoreRing score={risk.score ?? 0} />
              </div>
              <p className={`text-sm font-semibold
                ${scoreTextColour(risk.score ?? 0)}`}>
                {(risk.score ?? 0) >= 75 ? 'Critical Risk'
                 : (risk.score ?? 0) >= 40 ? 'Moderate Risk'
                 : 'Low Risk'}
              </p>
              <p className="text-xs text-gray-400 mt-1 text-center">
                Score ranges: 0–39 Low · 40–74 Medium · 75–100 Critical
              </p>
            </div>

            {/* meta card */}
            <div className="bg-white rounded-xl border border-gray-200
                            shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase
                             tracking-wider mb-4">
                Quick Info
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Severity</p>
                  <span className={`px-2 py-1 rounded text-xs font-semibold
                    ${SEVERITY_STYLES[risk.severity]
                      ?? 'bg-gray-100 text-gray-600'}`}>
                    {risk.severity ?? '—'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Status</p>
                  <span className={`px-2 py-1 rounded text-xs font-semibold
                    ${STATUS_STYLES[risk.status]
                      ?? 'bg-gray-100 text-gray-600'}`}>
                    {risk.status ?? '—'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Category</p>
                  <p className="text-sm text-gray-700">
                    {risk.category ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Owner</p>
                  <p className="text-sm text-gray-700">
                    {risk.owner ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Due Date</p>
                  <p className="text-sm text-gray-700">
                    {formatDate(risk.dueDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* actions card */}
            <div className="bg-white rounded-xl border border-gray-200
                            shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase
                             tracking-wider mb-4">
                Actions
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/risks/${id}/edit`)}
                  className="w-full py-2.5 border border-primary text-primary
                             text-sm rounded-lg hover:bg-blue-50 transition
                             flex items-center justify-center gap-2"
                >
                  ✏️ Edit Risk
                </button>
                <button
                  onClick={() => navigate('/risks/new')}
                  className="w-full py-2.5 border border-gray-300
                             text-gray-600 text-sm rounded-lg
                             hover:bg-gray-50 transition flex items-center
                             justify-center gap-2"
                >
                  ➕ Create New Risk
                </button>
                <button
                  onClick={() => navigate('/risks')}
                  className="w-full py-2.5 border border-gray-300
                             text-gray-600 text-sm rounded-lg
                             hover:bg-gray-50 transition flex items-center
                             justify-center gap-2"
                >
                  ← Back to List
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-2.5 border border-red-200
                             text-red-600 text-sm rounded-lg
                             hover:bg-red-50 transition flex items-center
                             justify-center gap-2"
                >
                  🗑️ Delete Risk
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Delete confirmation modal ── */}
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