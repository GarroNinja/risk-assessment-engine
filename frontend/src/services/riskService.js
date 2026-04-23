import api from './api'

export const getAllRisks = (page = 0, size = 10, sortBy = 'id', sortDir = 'asc') =>
  api.get('/risks/all', { params: { page, size, sortBy, sortDir } })

export const getRiskById = (id) =>
  api.get(`/risks/${id}`)

export const createRisk = (data) =>
  api.post('/risks/create', data)

export const updateRisk = (id, data) =>
  api.put(`/risks/${id}`, data)

export const deleteRisk = (id) =>
  api.delete(`/risks/${id}`)

export const searchRisks = (q) =>
  api.get('/risks/search', { params: { q } })

export const getRiskStats = () =>
  api.get('/risks/stats')

export const exportRisksCSV = () =>
  api.get('/risks/export', { responseType: 'blob' })