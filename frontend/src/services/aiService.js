import axios from 'axios'

const AI_BASE = import.meta.env.VITE_AI_URL
  || (import.meta.env.DEV ? 'http://localhost:5000' : undefined)

if (!AI_BASE) {
  throw new Error('VITE_AI_URL must be set for production AI builds.')
}

const aiApi = axios.create({
  baseURL: AI_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export const categoriseRisk = (data) =>
  aiApi.post('/categorise', data)

export const generateReport = (data) =>
  aiApi.post('/generate-report', data)

export const getAiHealth = () =>
  aiApi.get('/health')

export function streamReport(payload, onChunk, onDone, onError) {
  const controller = new AbortController()

  fetch(`${AI_BASE}/generate-report/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: controller.signal,
  })
    .then(async res => {
      if (!res.ok) {
        onError(`AI service returned ${res.status}`)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          if (buffer && emitSseLines(buffer, onChunk, onDone)) return
          onDone()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        if (emitSseLines(lines.join('\n'), onChunk, onDone)) return
      }
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        onError('Streaming connection failed. Please try again.')
      }
    })

  return () => controller.abort()
}

function emitSseLines(text, onChunk, onDone) {
  for (const line of text.split('\n')) {
    if (!line.startsWith('data: ')) continue

    const chunk = line.replace('data: ', '').trim()
    if (chunk === '[DONE]') {
      onDone()
      return true
    }
    if (chunk) onChunk(chunk)
  }
  return false
}
