import api from './api.js'

export function getSummary() {
  return api.get('/performance/summary')
}

export function getWeekly() {
  return api.get('/performance/weekly')
}

export function getMonthly() {
  return api.get('/performance/monthly')
}

export function getPeriod(from, to) {
  return api.get('/performance/period', { params: { from, to } })
}

export function getBestSetups() {
  return api.get('/performance/best-setups')
}

export function getRRDistribution() {
  return api.get('/performance/rr-distribution')
}

export function recompute() {
  return api.post('/performance/recompute')
}
