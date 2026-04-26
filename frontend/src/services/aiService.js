import axios from 'axios'

const AI_BASE = import.meta.env.VITE_AI_URL ?? 'http://localhost:5000'

const aiApi = axios.create({
  baseURL: AI_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export const describeRisk    = (data)     => aiApi.post('/describe', data)
export const recommendActions = (data)    => aiApi.post('/recommend', data)
export const categoriseRisk  = (data)     => aiApi.post('/categorise', data)
export const queryRag        = (question) => aiApi.post('/query', { question })
export const generateReport  = (data)     => aiApi.post('/generate-report', data)
export const analyseDocument = (text)     => aiApi.post('/analyse-document', { text })
export const getAiHealth     = ()         => aiApi.get('/health')

//  SSE streaming — returns cleanup function 
export function streamReport(payload, onChunk, onDone, onError) {
  const AI_URL = import.meta.env.VITE_AI_URL ?? 'http://localhost:5000'

  // build query string from payload
  const params = new URLSearchParams(
    Object.entries(payload).map(([k, v]) => [k, String(v)])
  ).toString()

  const url = `${AI_URL}/generate-report/stream?${params}`
  const es  = new EventSource(url)

  es.onmessage = (e) => {
    if (e.data === '[DONE]') {
      es.close()
      onDone()
    } else {
      onChunk(e.data)
    }
  }

  es.onerror = (err) => {
    console.error('SSE error:', err)
    es.close()
    onError('Streaming connection failed. Please try again.')
  }

  // return cleanup so React can close on unmount
  return () => es.close()
}