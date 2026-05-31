import { useState, useEffect, useCallback } from 'react'
import * as analysisService from '../services/analysis.js'

export function useAnalysis(params = {}) {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 0, totalPages: 0, totalElements: 0, pageSize: 20,
  })

  const paramsKey = JSON.stringify(params)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      // Map internal 0-based page to 1-based API page; rename size→page_size
      const { page = 0, size, ...rest } = params
      const apiParams = {
        ...rest,
        page: page + 1,
        ...(size != null && { page_size: size }),
      }
      const res = await analysisService.listAnalyses(apiParams)
      const d = res.data
      if (Array.isArray(d)) {
        setAnalyses(d)
        setPagination({ page: 0, totalPages: 1, totalElements: d.length, pageSize: d.length || 20 })
      } else {
        // Spring Boot 3.1+ with VIA_DTO serialises pagination under d.page;
        // older/flat format has the fields at the top level — support both.
        const meta = (d.page && typeof d.page === 'object') ? d.page : d
        setAnalyses(d.content ?? [])
        setPagination({
          page:          meta.number        ?? 0,
          totalPages:    meta.totalPages    ?? 1,
          totalElements: meta.totalElements ?? 0,
          pageSize:      meta.size          ?? 20,
        })
      }
      setError(null)
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to load analyses')
    } finally {
      setLoading(false)
    }
  }, [paramsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch() }, [fetch])

  const createAnalysis = useCallback(async (data) => {
    const res = await analysisService.createAnalysis(data)
    await fetch()
    return res.data
  }, [fetch])

  const updateAnalysis = useCallback(async (id, data) => {
    const res = await analysisService.updateAnalysis(id, data)
    await fetch()
    return res.data
  }, [fetch])

  const setOutcome = useCallback(async (id, outcome) => {
    const res = await analysisService.setOutcome(id, outcome)
    await fetch()
    return res.data
  }, [fetch])

  const deleteAnalysis = useCallback(async (id) => {
    await analysisService.deleteAnalysis(id)
    await fetch()
  }, [fetch])

  return {
    analyses, loading, error, pagination, refetch: fetch,
    createAnalysis, updateAnalysis, setOutcome, deleteAnalysis,
  }
}
