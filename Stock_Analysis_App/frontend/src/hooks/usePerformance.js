import { useState, useEffect, useCallback } from 'react'
import * as performanceService from '../services/performance.js'

export function usePerformance() {
  const [summary, setSummary] = useState(null)
  const [weekly, setWeekly] = useState([])
  const [monthly, setMonthly] = useState([])
  const [bestSetups, setBestSetups] = useState([])
  const [rrDistribution, setRRDistribution] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [summaryRes, weeklyRes, monthlyRes, setupsRes, rrRes] = await Promise.allSettled([
        performanceService.getSummary(),
        performanceService.getWeekly(),
        performanceService.getMonthly(),
        performanceService.getBestSetups(),
        performanceService.getRRDistribution(),
      ])

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data)
      if (weeklyRes.status === 'fulfilled') setWeekly(weeklyRes.value.data ?? [])
      if (monthlyRes.status === 'fulfilled') setMonthly(monthlyRes.value.data ?? [])
      if (setupsRes.status === 'fulfilled') setBestSetups(setupsRes.value.data ?? [])
      if (rrRes.status === 'fulfilled') setRRDistribution(rrRes.value.data ?? [])

      setError(null)
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to load performance data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { summary, weekly, monthly, bestSetups, rrDistribution, loading, error, refetch: fetch }
}
