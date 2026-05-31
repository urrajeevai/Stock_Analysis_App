import api from './api.js'

export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const refreshToken = (refreshToken) => api.post('/auth/refresh', { refreshToken })
export const logout = (refreshToken) => api.post('/auth/logout', { refreshToken })
export const getMe = () => api.get('/auth/me')
export const listUsers = () => api.get('/auth/users')
export const getUser = (id) => api.get(`/auth/users/${id}`)
export const updateUser = (id, data) => api.put(`/auth/users/${id}`, data)
export const updateUserRole = (id, roles) => api.put(`/auth/users/${id}/roles`, { roles })
export const deactivateUser = (id) => api.delete(`/auth/users/${id}`)
