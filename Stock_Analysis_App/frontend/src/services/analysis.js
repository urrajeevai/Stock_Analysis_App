import api from './api.js'

export function listAnalyses(params) {
  return api.get('/analyses', { params })
}

export function getAnalysis(id) {
  return api.get(`/analyses/${id}`)
}

export function createAnalysis(data) {
  return api.post('/analyses', data)
}

export function updateAnalysis(id, data) {
  return api.put(`/analyses/${id}`, data)
}

export function setOutcome(id, outcome) {
  return api.patch(`/analyses/${id}/outcome`, { outcome })
}

export function deleteAnalysis(id) {
  return api.delete(`/analyses/${id}`)
}

export function getSetupStats() {
  return api.get('/analyses/setup-stats')
}

export function getTickerStats() {
  return api.get('/analyses/ticker-stats')
}

export function uploadAnalysisImage(id, slot, file) {
  const formData = new FormData()
  formData.append('file', file)
  // Do NOT set Content-Type manually — axios sets multipart/form-data with the
  // correct boundary automatically when given a FormData object.
  return api.post(`/analyses/${id}/images/${slot}`, formData)
}

export function deleteAnalysisImage(id, slot) {
  return api.delete(`/analyses/${id}/images/${slot}`)
}
