import api from './api'

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const registerUser = (data) =>
  api.post('/auth/register', data).then(res => res.data)

export const refresh = () =>
  api.post('/auth/refresh')