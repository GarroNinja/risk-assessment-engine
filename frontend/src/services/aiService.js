import api from './api'

const AI_BASE = import.meta.env.VITE_AI_URL ?? 'http://localhost:5000'

// use axios but point directly to Flask AI service on port 5000
import axios from 'axios'

const aiApi = axios.create({
  baseURL: AI_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export const describeRisk = (data) =>
  aiApi.post('/describe', data)

export const recommendActions = (data) =>
  aiApi.post('/recommend', data)

export const categoriseRisk = (data) =>
  aiApi.post('/categorise', data)

export const queryRag = (question) =>
  aiApi.post('/query', { question })

export const generateReport = (data) =>
  aiApi.post('/generate-report', data)

export const analyseDocument = (text) =>
  aiApi.post('/analyse-document', { text })

export const getAiHealth = () =>
  aiApi.get('/health')