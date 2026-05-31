import api from './api.js'

export const listStocks = (activeOnly = false) =>
  api.get(`/stocks?activeOnly=${activeOnly}`)

export const searchStocks = (q) =>
  api.get(`/stocks/search?q=${encodeURIComponent(q)}`)

export const getStock = (id) => api.get(`/stocks/${id}`)

export const createStock = (data) => api.post('/stocks', data)

export const updateStock = (id, data) => api.put(`/stocks/${id}`, data)

export const deleteStock = (id) => api.delete(`/stocks/${id}`)

export const uploadStocksCsv = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/stocks/upload-csv', formData)
}
