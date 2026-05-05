import { useState } from 'react'
import { categoriseRisk, generateReport } from '../services/aiService'

const TABS = [
  { key: 'categorise', label: 'Categorise', icon: 'Tag' },
  { key: 'report', label: 'Report', icon: 'Doc' },
]

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

function MetaBadges({ meta }) {
  if (!meta) return null

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
      {meta.model_used && (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
          {meta.model_used}
        </span>
      )}
      {meta.cached && (
        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
          cached
        </span>
      )}
      {meta.response_time_ms != null && (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
          {meta.response_time_ms}ms
        </span>
      )}
      {meta.tokens_used != null && (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
          {meta.tokens_used} tokens
        </span>
      )}
    </div>
  )
}

function ConfidenceBar({ value }) {
  if (value == null) return null

  const pct = Math.round(value * 100)
  const colour = pct >= 75 ? 'bg-green-500'
    : pct >= 50 ? 'bg-yellow-400'
    : 'bg-red-400'

  return (
    <div className="min-w-32 flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Confidence</span>
        <span className="text-xs font-semibold text-gray-700">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colour}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function CategoriseCard({ data }) {
  const category = data?.category ?? 'Uncategorised'
  const reasoning = data?.reasoning ?? data?.reason

  return (
    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        AI Category
      </p>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg">
          {category}
        </span>
        <ConfidenceBar value={data?.confidence} />
      </div>
      {reasoning && (
        <p className="text-sm text-gray-600 leading-relaxed mt-2">
          <span className="font-medium text-gray-700">Reasoning: </span>
          {reasoning}
        </p>
      )}
      <MetaBadges meta={data?.meta} />
    </div>
  )
}

function ReportCard({ data }) {
  const reportText = data?.report ?? data?.content ?? data?.text
    ?? (typeof data === 'string' ? data : null)

  if (reportText) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          AI Report
        </p>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {reportText}
        </p>
        <MetaBadges meta={data?.meta} />
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        AI Report
      </p>
      <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

export default function AiPanel({ riskData }) {
  const [activeTab, setActiveTab] = useState('categorise')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState({})

  function buildPayload() {
    return {
      title: riskData?.title ?? '',
      description: riskData?.description ?? '',
      category: riskData?.category ?? '',
      severity: riskData?.severity ?? '',
      score: riskData?.score ?? 0,
    }
  }

  async function handleAskAi() {
    setLoading(true)
    setError(null)

    try {
      const payload = buildPayload()
      const res = activeTab === 'categorise'
        ? await categoriseRisk(payload)
        : await generateReport(payload)

      setResults(prev => ({ ...prev, [activeTab]: res.data }))
    } catch (err) {
      if (import.meta.env.DEV) console.error('AI panel error:', err)

      const msg =
        err.message === 'Network Error'
          ? 'Cannot reach the AI service. Make sure it is running.'
          : err.response?.status === 429
          ? 'Rate limit reached. Please wait a moment and try again.'
          : err.response?.status === 400
          ? 'Invalid input. Please check the risk data and try again.'
          : err.response?.data?.error
          ?? err.response?.data?.message
          ?? 'AI service unavailable. Please try again.'

      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const currentResult = results[activeTab]

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center text-sm">
            AI
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              AI Analysis
            </h3>
            <p className="text-xs text-gray-400">
              Categorisation and report generation
            </p>
          </div>
        </div>

        <button
          onClick={handleAskAi}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2"
        >
          {loading ? (
            <>
              <Spinner />
              Analysing...
            </>
          ) : (
            'Ask AI'
          )}
        </button>
      </div>

      <div className="flex gap-1 px-6 pt-4 pb-0 overflow-x-auto">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key)
              setError(null)
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition whitespace-nowrap ${
              activeTab === key
                ? 'border-primary text-primary bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      <div className="px-6 py-5">
        {loading && (
          <div className="animate-pulse space-y-3 py-2">
            <div className="h-4 bg-blue-100 rounded w-full" />
            <div className="h-4 bg-blue-100 rounded w-5/6" />
            <div className="h-4 bg-blue-100 rounded w-4/6" />
            <div className="h-4 bg-blue-100 rounded w-3/6" />
          </div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <span className="mt-0.5 shrink-0">!</span>
            <div className="flex-1">
              <p className="font-medium mb-0.5">AI Error</p>
              <p className="text-xs">{error}</p>
              <button
                onClick={handleAskAi}
                className="mt-2 text-xs underline font-medium hover:text-red-900"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && currentResult && (
          activeTab === 'categorise'
            ? <CategoriseCard data={currentResult} />
            : <ReportCard data={currentResult} />
        )}

        {!loading && !error && !currentResult && (
          <div className="text-center py-10 text-gray-400">
            <div className="text-sm font-semibold mb-3">
              {TABS.find(t => t.key === activeTab)?.label}
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              {activeTab === 'categorise'
                ? 'Classify this risk into a category'
                : 'Generate a structured report for this risk'}
            </p>
            <p className="text-xs text-gray-400">
              Click Ask AI to get started
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
