import { useState, useEffect, useCallback } from 'react'
import * as alertsService from '../services/alerts.js'

export function useAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await alertsService.getUnacknowledged()
      setAlerts(Array.isArray(res.data) ? res.data : (res.data.content ?? []))
      setError(null)
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const acknowledge = useCallback(async (id) => {
    await alertsService.acknowledgeAlert(id)
    await fetch()
  }, [fetch])

  return { alerts, loading, error, refetch: fetch, acknowledge }
}
