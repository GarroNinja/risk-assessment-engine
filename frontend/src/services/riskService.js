import api from './api'

export const getAllRisks = (page = 0, size = 10, sortBy = 'id', sortDir = 'asc') =>
  api.get('/api/risk-records/all', { params: { page, size, sortBy, sortDir } })

export const getRiskById = (id) =>
  api.get(`/api/risk-records/${id}`)

export const createRisk = (data) =>
  api.post('/api/risk-records/create', data)

export const updateRisk = (id, data) =>
  api.put(`/api/risk-records/${id}`, data)

export const deleteRisk = (id) =>
  api.delete(`/api/risk-records/${id}`)

export const searchRisks = (q) =>
  api.get('/api/risk-records/search', { params: { q } })

export const getRiskStats = () =>
  api.get('/api/risk-records/stats')

export const exportRisksCSV = () =>
  api.get('/api/risk-records/export', { responseType: 'blob' })
