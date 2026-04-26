import { useState } from 'react'
import { describeRisk, recommendActions, categoriseRisk, queryRag } from '../services/aiService'

// ── priority styles for recommendations — defined OUTSIDE ────────────────────
const PRIORITY_STYLES = {
  HIGH:   'border-l-4 border-red-400 bg-red-50',
  MEDIUM: 'border-l-4 border-yellow-400 bg-yellow-50',
  LOW:    'border-l-4 border-green-400 bg-green-50',
}

const PRIORITY_TEXT = {
  HIGH:   'text-red-700',
  MEDIUM: 'text-yellow-700',
  LOW:    'text-green-700',
}

// tab definitions 
const TABS = [
  { key: 'describe',  label: 'Describe',   icon: '📝' },
  { key: 'recommend', label: 'Recommend',  icon: '💡' },
  { key: 'categorise',label: 'Categorise', icon: '🏷️' },
  { key: 'query',     label: 'RAG Query',  icon: '🔍' },
]

//  spinner 
function Spinner({ size = 4 }) {
  return (
    <svg className={`animate-spin h-${size} w-${size}`}
      fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

//  confidence bar 
function ConfidenceBar({ value }) {
  if (value == null) return null
  const pct = Math.round(value * 100)
  const colour = pct >= 75 ? 'bg-green-500'
               : pct >= 50 ? 'bg-yellow-400'
               : 'bg-red-400'
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Confidence</span>
        <span className="text-xs font-semibold text-gray-700">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500
                         ${colour}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

//  meta badge row 
function MetaBadges({ meta }) {
  if (!meta) return null
  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3
                    border-t border-gray-100">
      {meta.model_used && (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-500
                         text-xs rounded-full">
          {meta.model_used}
        </span>
      )}
      {meta.cached && (
        <span className="px-2 py-0.5 bg-blue-50 text-blue-600
                         text-xs rounded-full">
          ⚡ cached
        </span>
      )}
      {meta.response_time_ms != null && (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-500
                         text-xs rounded-full">
          {meta.response_time_ms}ms
        </span>
      )}
      {meta.tokens_used != null && (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-500
                         text-xs rounded-full">
          {meta.tokens_used} tokens
        </span>
      )}
    </div>
  )
}

//  describe result card 
function DescribeCard({ data }) {
  const text = data?.description ?? data?.content ?? data?.text
             ?? (typeof data === 'string' ? data : null)
  if (!text) return null
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 bg-green-500 rounded-full" />
        <span className="text-xs font-semibold text-gray-500 uppercase
                         tracking-wide">
          AI Description
        </span>
        {data?.is_fallback && (
          <span className="ml-auto px-2 py-0.5 bg-yellow-100 text-yellow-700
                           text-xs rounded-full">
            fallback
          </span>
        )}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {text}
      </p>
      <MetaBadges meta={data?.meta} />
    </div>
  )
}

//  recommend result card 
function RecommendCard({ data }) {
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.recommendations)
    ? data.recommendations
    : []

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        No recommendations returned.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase
                    tracking-wide mb-1">
        AI Recommendations
      </p>
      {items.map((rec, i) => (
        <div key={i}
          className={`p-4 rounded-xl text-sm
            ${PRIORITY_STYLES[rec.priority]
              ?? 'border-l-4 border-gray-300 bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`font-semibold text-xs uppercase tracking-wide
              ${PRIORITY_TEXT[rec.priority] ?? 'text-gray-700'}`}>
              {rec.action_type ?? `Action ${i + 1}`}
            </span>
            {rec.priority && (
              <span className={`text-xs font-medium
                ${PRIORITY_TEXT[rec.priority] ?? 'text-gray-500'}`}>
                {rec.priority} Priority
              </span>
            )}
          </div>
          <p className={`leading-relaxed
            ${PRIORITY_TEXT[rec.priority] ?? 'text-gray-700'}`}>
            {rec.description}
          </p>
        </div>
      ))}
      {data?.meta && <MetaBadges meta={data.meta} />}
    </div>
  )
}

//  categorise result card 
function CategoriseCard({ data }) {
  if (!data) return null
  const category  = data.category  ?? '—'
  const reasoning = data.reasoning ?? data.reason ?? null
  return (
    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase
                    tracking-wide mb-3">
        AI Category
      </p>
      <div className="flex items-center gap-3 mb-3">
        <span className="px-4 py-2 bg-purple-600 text-white text-sm
                         font-semibold rounded-lg">
          {category}
        </span>
        <ConfidenceBar value={data.confidence} />
      </div>
      {reasoning && (
        <p className="text-sm text-gray-600 leading-relaxed mt-2">
          <span className="font-medium text-gray-700">Reasoning: </span>
          {reasoning}
        </p>
      )}
      <MetaBadges meta={data.meta} />
    </div>
  )
}

//  RAG query result card 
function RagCard({ data }) {
  if (!data) return null
  const answer  = data.answer  ?? data.response ?? data.content ?? null
  const sources = data.sources ?? data.chunks   ?? []
  return (
    <div className="space-y-3">
      {answer && (
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase
                        tracking-wide mb-2">
            AI Answer
          </p>
          <p className="text-sm text-gray-700 leading-relaxed
                        whitespace-pre-wrap">
            {answer}
          </p>
        </div>
      )}
      {sources.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase
                        tracking-wide mb-2">
            Sources
          </p>
          <div className="space-y-2">
            {sources.map((src, i) => (
              <div key={i}
                className="bg-gray-50 border border-gray-200 rounded-lg
                           px-3 py-2 text-xs text-gray-600">
                <span className="font-medium text-gray-700 mr-1">
                  [{i + 1}]
                </span>
                {typeof src === 'string' ? src : src.text ?? src.content
                  ?? JSON.stringify(src)}
              </div>
            ))}
          </div>
        </div>
      )}
      <MetaBadges meta={data.meta} />
    </div>
  )
}

// main AI panel component
export default function AiPanel({ riskData }) {
  const [activeTab, setActiveTab]   = useState('describe')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [results, setResults]       = useState({}) // { tab: data }
  const [ragQuestion, setRagQuestion] = useState('')
  const [ragInputError, setRagInputError] = useState('')

  //  clear results when switching tabs 
  function handleTabChange(key) {
    setActiveTab(key)
    setError(null)
    setRagInputError('')
  }

  // main AI call 
  async function handleAskAi() {
    // RAG tab needs a question
    if (activeTab === 'query') {
      if (!ragQuestion.trim()) {
        setRagInputError('Please enter a question first.')
        return
      }
      setRagInputError('')
    }

    setLoading(true)
    setError(null)

    const payload = riskData
      ? {
          title:       riskData.title       ?? '',
          description: riskData.description ?? '',
          category:    riskData.category    ?? '',
          severity:    riskData.severity    ?? '',
          score:       riskData.score       ?? 0,
        }
      : {}

    try {
      let res

      if (activeTab === 'describe') {
        res = await describeRisk(payload)
        setResults(prev => ({ ...prev, describe: res.data }))

      } else if (activeTab === 'recommend') {
        res = await recommendActions(payload)
        setResults(prev => ({ ...prev, recommend: res.data }))

      } else if (activeTab === 'categorise') {
        res = await categoriseRisk(payload)
        setResults(prev => ({ ...prev, categorise: res.data }))

      } else if (activeTab === 'query') {
        res = await queryRag(ragQuestion.trim())
        setResults(prev => ({ ...prev, query: res.data }))
      }

    } catch (err) {
      console.error('AI panel error:', err)
      const msg =
        err.message === 'Network Error'
          ? 'Cannot reach the AI service. Make sure it is running on port 5000.'
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

  // main render
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

      {/* ── panel header ── */}
      <div className="flex items-center justify-between px-6 py-4
                      border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-lg
                          flex items-center justify-center text-sm">
            🤖
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              AI Analysis
            </h3>
            <p className="text-xs text-gray-400">
              Powered by Groq · LLaMA-3.3-70b
            </p>
          </div>
        </div>

        {/* Ask AI button */}
        <button
          onClick={handleAskAi}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white text-sm font-medium
                     rounded-lg hover:opacity-90 disabled:opacity-50
                     transition flex items-center gap-2"
        >
          {loading ? (
            <>
              <Spinner size={4} />
              Analysing...
            </>
          ) : (
            <>
              <span>✨</span>
              Ask AI
            </>
          )}
        </button>
      </div>

      {/* ── tab bar ── */}
      <div className="flex gap-1 px-6 pt-4 pb-0 overflow-x-auto">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs
                        font-medium rounded-t-lg border-b-2 transition
                        whitespace-nowrap
                        ${activeTab === key
                          ? 'border-primary text-primary bg-blue-50'
                          : 'border-transparent text-gray-500'
                            + ' hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* ── content area ── */}
      <div className="px-6 py-5">

        {/* RAG question input */}
        {activeTab === 'query' && (
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-600 mb-1.5
                              block">
              Ask a question about risks in your organisation
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ragQuestion}
                onChange={e => {
                  setRagQuestion(e.target.value)
                  setRagInputError('')
                }}
                onKeyDown={e => e.key === 'Enter' && handleAskAi()}
                placeholder="e.g. What are the top compliance risks?"
                className={`flex-1 px-3 py-2 border rounded-lg text-sm
                            focus:outline-none focus:ring-2
                            focus:ring-primary transition
                            ${ragInputError
                              ? 'border-red-400 bg-red-50'
                              : 'border-gray-300'}`}
              />
            </div>
            {ragInputError && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <span>⚠</span> {ragInputError}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Press Enter or click Ask AI
            </p>
          </div>
        )}

        {/* loading skeleton */}
        {loading && (
          <div className="animate-pulse space-y-3 py-2">
            <div className="h-4 bg-blue-100 rounded w-full" />
            <div className="h-4 bg-blue-100 rounded w-5/6" />
            <div className="h-4 bg-blue-100 rounded w-4/6" />
            <div className="h-4 bg-blue-100 rounded w-3/6" />
          </div>
        )}

        {/* error banner */}
        {error && !loading && (
          <div className="flex items-start gap-3 bg-red-50 border
                          border-red-200 rounded-xl px-4 py-3 text-sm
                          text-red-700">
            <span className="mt-0.5 shrink-0">⚠</span>
            <div className="flex-1">
              <p className="font-medium mb-0.5">AI Error</p>
              <p className="text-xs">{error}</p>
              <button
                onClick={handleAskAi}
                className="mt-2 text-xs underline font-medium
                           hover:text-red-900"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* results */}
        {!loading && !error && currentResult && (
          <>
            {activeTab === 'describe'  && (
              <DescribeCard data={currentResult} />
            )}
            {activeTab === 'recommend' && (
              <RecommendCard data={currentResult} />
            )}
            {activeTab === 'categorise' && (
              <CategoriseCard data={currentResult} />
            )}
            {activeTab === 'query' && (
              <RagCard data={currentResult} />
            )}
          </>
        )}

        {/* placeholder — nothing asked yet */}
        {!loading && !error && !currentResult && (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-3">
              {TABS.find(t => t.key === activeTab)?.icon}
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              {activeTab === 'describe'
                ? 'Get an AI-powered description of this risk'
                : activeTab === 'recommend'
                ? 'Get 3 actionable recommendations from AI'
                : activeTab === 'categorise'
                ? 'Let AI classify this risk into a category'
                : 'Ask a question — AI searches the knowledge base'}
            </p>
            <p className="text-xs text-gray-400">
              Click <strong>Ask AI</strong> to get started
            </p>
          </div>
        )}

      </div>
    </div>
  )
}