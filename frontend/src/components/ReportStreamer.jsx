import { useState, useEffect, useRef } from 'react'
import { streamReport, generateReport } from '../services/aiService'

// defined OUTSIDE to prevent remount 
function ReportSection({ title, content }) {
  if (!content) return null
  return (
    <div className="mb-5">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest
                     mb-2">
        {title}
      </h4>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  )
}

function RecommendationItem({ item, index }) {
  return (
    <div className="flex gap-3 p-3 bg-blue-50 border border-blue-100
                    rounded-xl">
      <div className="w-6 h-6 bg-primary text-white rounded-full flex
                      items-center justify-center text-xs font-bold shrink-0">
        {index + 1}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">
        {typeof item === 'string' ? item : item.description ?? item.text
          ?? JSON.stringify(item)}
      </p>
    </div>
  )
}

// main component
export default function ReportStreamer({ riskData }) {
  const [streaming, setStreaming]     = useState(false)
  const [done, setDone]               = useState(false)
  const [error, setError]             = useState(null)
  const [rawText, setRawText]         = useState('')
  const [report, setReport]           = useState(null)
  const [useSSE, setUseSSE]           = useState(true)
  const cleanupRef                    = useRef(null)
  const scrollRef                     = useRef(null)

  // auto-scroll as text streams in
  useEffect(() => {
    if (scrollRef.current && streaming) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [rawText, streaming])

  // cleanup SSE on unmount
  useEffect(() => {
    return () => { if (cleanupRef.current) cleanupRef.current() }
  }, [])

  function handleStart() {
    setStreaming(true)
    setDone(false)
    setError(null)
    setRawText('')
    setReport(null)

    const payload = {
      title:       riskData?.title       ?? 'Risk Assessment Report',
      description: riskData?.description ?? '',
      category:    riskData?.category    ?? '',
      severity:    riskData?.severity    ?? '',
      score:       riskData?.score       ?? 0,
    }

    if (useSSE) {
      //  SSE streaming mode
      cleanupRef.current = streamReport(
        payload,
        // onChunk — each token appended
        (chunk) => setRawText(prev => prev + chunk),
        // onDone
        () => {
          setStreaming(false)
          setDone(true)
          // try to parse JSON if the server returned structured JSON
          setRawText(prev => {
            try {
              const parsed = JSON.parse(prev)
              setReport(parsed)
            } catch {
              // plain text — keep as is
            }
            return prev
          })
        },
        // onError — fallback to REST
        (errMsg) => {
          console.warn('SSE failed, falling back to REST:', errMsg)
          setUseSSE(false)
          handleRestFallback(payload)
        }
      )
    } else {
      handleRestFallback(payload)
    }
  }

  async function handleRestFallback(payload) {
    try {
      const res = await generateReport(payload)
      const data = res.data
      setReport(data)
      setRawText(JSON.stringify(data, null, 2))
      setDone(true)
    } catch (err) {
      setError(
        err.message === 'Network Error'
          ? 'Cannot reach AI service on port 5000.'
          : err.response?.data?.error
          ?? 'Report generation failed. Please try again.'
      )
    } finally {
      setStreaming(false)
    }
  }

  function handleStop() {
    if (cleanupRef.current) cleanupRef.current()
    setStreaming(false)
  }

  function handleReset() {
    if (cleanupRef.current) cleanupRef.current()
    setStreaming(false)
    setDone(false)
    setError(null)
    setRawText('')
    setReport(null)
  }

  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">

      {/* header */}
      <div className="flex items-center justify-between px-6 py-4
                      border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center
                          justify-center text-sm">
            📄
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              AI Report Generator
            </h3>
            <p className="text-xs text-gray-400">
              {useSSE ? 'SSE Streaming' : 'REST fallback'} · LLaMA-3.3-70b
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* SSE toggle */}
          <label className="flex items-center gap-2 text-xs text-gray-500
                            cursor-pointer">
            <div
              onClick={() => !streaming && setUseSSE(v => !v)}
              className={`w-8 h-4 rounded-full transition-colors relative
                          ${useSSE ? 'bg-primary' : 'bg-gray-300'}
                          ${streaming ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full
                               transition-transform
                               ${useSSE ? 'translate-x-4' : 'translate-x-0.5'}`}
              />
            </div>
            Streaming
          </label>

          {/* action buttons */}
          {!streaming && !done && (
            <button
              onClick={handleStart}
              className="px-4 py-2 bg-purple-600 text-white text-xs
                         font-semibold rounded-xl hover:bg-purple-700
                         transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor"
                strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0
                     012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0
                     01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Report
            </button>
          )}

          {streaming && (
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-red-500 text-white text-xs
                         font-semibold rounded-xl hover:bg-red-600
                         transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 animate-pulse" fill="currentColor"
                viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1"/>
              </svg>
              Stop
            </button>
          )}

          {done && (
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-200 text-gray-600
                         text-xs font-medium rounded-xl hover:bg-gray-50
                         transition"
            >
              Generate Again
            </button>
          )}
        </div>
      </div>

      {/* content */}
      <div className="p-6">

        {/* idle placeholder */}
        {!streaming && !done && !error && (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center
                            justify-center mx-auto mb-3 text-2xl">
              📄
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              Generate an AI-powered risk report
            </p>
            <p className="text-xs text-gray-400">
              Click Generate Report to create a structured analysis with
              executive summary, overview and recommendations.
            </p>
          </div>
        )}

        {/* error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200
                          rounded-xl px-4 py-3 text-sm text-red-700">
            <span className="mt-0.5 shrink-0">⚠</span>
            <div>
              <p className="font-medium">{error}</p>
              <button onClick={handleReset}
                className="underline text-xs mt-1">
                Try again
              </button>
            </div>
          </div>
        )}

        {/* streaming — raw text display */}
        {(streaming || (done && !report)) && rawText && (
          <div>
            {/* streaming indicator */}
            {streaming && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i}
                      className="w-1.5 h-1.5 bg-purple-500 rounded-full
                                 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-purple-600 font-medium">
                  Streaming response...
                </span>
              </div>
            )}
            <div
              ref={scrollRef}
              className="bg-gray-50 border border-gray-200 rounded-xl p-4
                         max-h-80 overflow-y-auto font-mono text-xs
                         text-gray-700 leading-relaxed whitespace-pre-wrap"
            >
              {rawText}
              {streaming && (
                <span className="inline-block w-0.5 h-3.5 bg-purple-500
                                 ml-0.5 animate-pulse align-middle" />
              )}
            </div>
          </div>
        )}

        {/* done — structured report display */}
        {done && report && (
          <div>
            {/* report title */}
            {report.title && (
              <div className="mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-purple-600 font-semibold
                                   uppercase tracking-wide">
                    AI Generated Report
                  </span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700
                                   text-xs rounded-full font-medium">
                    Complete
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {report.title}
                </h3>
              </div>
            )}

            <ReportSection
              title="Executive Summary"
              content={report.executive_summary ?? report.executiveSummary}
            />
            <ReportSection
              title="Overview"
              content={report.overview}
            />

            {/* top items */}
            {report.top_items?.length > 0 && (
              <div className="mb-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase
                               tracking-widest mb-2">
                  Top Risk Items
                </h4>
                <div className="space-y-2">
                  {report.top_items.map((item, i) => (
                    <RecommendationItem key={i} item={item} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* recommendations */}
            {report.recommendations?.length > 0 && (
              <div className="mb-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase
                               tracking-widest mb-2">
                  Recommendations
                </h4>
                <div className="space-y-2">
                  {report.recommendations.map((item, i) => (
                    <RecommendationItem key={i} item={item} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* meta */}
            {report.meta && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex
                              flex-wrap gap-2">
                {report.meta.model_used && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500
                                   text-xs rounded-full">
                    {report.meta.model_used}
                  </span>
                )}
                {report.meta.tokens_used && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500
                                   text-xs rounded-full">
                    {report.meta.tokens_used} tokens
                  </span>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}