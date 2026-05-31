import api from './api.js'

export function listAlerts(params) {
  return api.get('/alerts', { params })
}

export function getUnacknowledged() {
  return api.get('/alerts/unacknowledged')
}

export function acknowledgeAlert(id) {
  return api.patch(`/alerts/${id}/acknowledge`)
}

export function deleteAlert(id) {
  return api.delete(`/alerts/${id}`)
}
