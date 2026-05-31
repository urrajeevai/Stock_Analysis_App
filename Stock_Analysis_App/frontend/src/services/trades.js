import api from './api.js'

export function listTrades(params) {
  return api.get('/trades', { params })
}

export function getTrade(id) {
  return api.get(`/trades/${id}`)
}

export function createTrade(data) {
  return api.post('/trades', data)
}

export function updateTrade(id, data) {
  return api.put(`/trades/${id}`, data)
}

export function closeTrade(id, data) {
  return api.patch(`/trades/${id}/close`, data)
}

export function cancelTrade(id) {
  return api.patch(`/trades/${id}/cancel`)
}

export function deleteTrade(id) {
  return api.delete(`/trades/${id}`)
}

export function getRevisions(id) {
  return api.get(`/trades/${id}/revisions`)
}

export function getOpenTrades() {
  return api.get('/trades/open')
}

export function getTradeStats() {
  return api.get('/trades/stats')
}

export function getTradesByAnalysis(analysisId) {
  return api.get(`/trades/by-analysis/${analysisId}`)
}

export function addTrailEntry(tradeId, data) {
  return api.post(`/trades/${tradeId}/trails`, data)
}

export function getTrailEntries(tradeId) {
  return api.get(`/trades/${tradeId}/trails`)
}

export function getPLSummary() {
  return api.get('/trades/pl-summary')
}

export function getPLDetail(params) {
  return api.get('/trades/pl-detail', { params })
}
