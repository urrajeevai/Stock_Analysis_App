import api from './api.js'

export function uploadRsiCsv(file, scoreDate) {
  const formData = new FormData()
  formData.append('file', file)
  const params = scoreDate ? { scoreDate } : {}
  return api.post('/rsi/upload', formData, { params })
}

export function listRsiScores(params) {
  return api.get('/rsi/scores', { params })
}

export function getTrendingRsiStocks(params) {
  return api.get('/rsi/trending', { params })
}

export function listRsiUploads() {
  return api.get('/rsi/uploads')
}

export function getAvailableRsiDates() {
  return api.get('/rsi/dates')
}

export function getAvailableRsiSectors() {
  return api.get('/rsi/sectors')
}
