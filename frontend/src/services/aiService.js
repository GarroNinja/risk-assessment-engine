import api from './api'

export const describeRisk = (data) =>
  api.post('/ai/describe', data)

export const recommendActions = (data) =>
  api.post('/ai/recommend', data)

export const categoriseRisk = (data) =>
  api.post('/ai/categorise', data)

export const queryRag = (question) =>
  api.post('/ai/query', { question })

export const generateReport = (data) =>
  api.post('/ai/generate-report', data)