import { useState, useEffect, useCallback } from 'react'
import * as tradesService from '../services/trades.js'

export function useTrades(params = {}) {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 0, totalPages: 0, totalElements: 0, pageSize: 20,
  })

  const paramsKey = JSON.stringify(params)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await tradesService.listTrades(params)
      const d = res.data
      if (Array.isArray(d)) {
        setTrades(d)
        setPagination({ page: 0, totalPages: 1, totalElements: d.length, pageSize: d.length || 20 })
      } else {
        const meta = (d.page && typeof d.page === 'object') ? d.page : d
        setTrades(d.content ?? [])
        setPagination({
          page:          meta.number        ?? 0,
          totalPages:    meta.totalPages    ?? 1,
          totalElements: meta.totalElements ?? 0,
          pageSize:      meta.size          ?? 20,
        })
      }
      setError(null)
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to load trades')
    } finally {
      setLoading(false)
    }
  }, [paramsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch() }, [fetch])

  const createTrade = useCallback(async (data) => {
    const res = await tradesService.createTrade(data)
    await fetch()
    return res.data
  }, [fetch])

  const updateTrade = useCallback(async (id, data) => {
    const res = await tradesService.updateTrade(id, data)
    await fetch()
    return res.data
  }, [fetch])

  const closeTrade = useCallback(async (id, data) => {
    const res = await tradesService.closeTrade(id, data)
    await fetch()
    return res.data
  }, [fetch])

  return {
    trades, loading, error, pagination, refetch: fetch,
    createTrade, updateTrade, closeTrade,
  }
}
