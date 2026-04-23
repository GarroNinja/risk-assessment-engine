import { useState } from 'react'
import { describeRisk } from '../services/aiService'

function AiPanel({ riskData }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAsk = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await describeRisk(riskData)
      setResult(res.data)
    } catch {
      setError('AI service unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 mt-6 bg-blue-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-primary">AI Analysis</h3>
        <button
          onClick={handleAsk}
          disabled={loading}
          className="px-4 py-1.5 bg-primary text-white text-sm rounded hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Analysing...' : 'Ask AI'}
        </button>
      </div>

      {loading && (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-blue-200 rounded w-3/4" />
          <div className="h-4 bg-blue-200 rounded w-1/2" />
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm">
          {error}
          <button onClick={handleAsk} className="ml-2 underline">Retry</button>
        </div>
      )}

      {result && !loading && (
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {result.description ?? JSON.stringify(result, null, 2)}
        </div>
      )}
    </div>
  )
}

export default AiPanel