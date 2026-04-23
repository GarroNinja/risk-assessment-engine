import api from './api'

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const register = (email, password) =>
  api.post('/auth/register', { email, password })

export const refresh = () =>
  api.post('/auth/refresh')