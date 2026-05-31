import api from './api.js'

export function uploadMomentumCsv(file, scoreDate) {
  const formData = new FormData()
  formData.append('file', file)
  const params = scoreDate ? { scoreDate } : {}
  return api.post('/momentum/upload', formData, { params })
}

export function listMomentumScores(params) {
  return api.get('/momentum/scores', { params })
}

export function getTrendingStocks(params) {
  return api.get('/momentum/trending', { params })
}

export function listUploads() {
  return api.get('/momentum/uploads')
}

export function getAvailableDates() {
  return api.get('/momentum/dates')
}

export function getAvailableSectors() {
  return api.get('/momentum/sectors')
}

export function exportTrendingCsv(params) {
  return api.get('/momentum/trending/export', { params, responseType: 'blob' })
}
