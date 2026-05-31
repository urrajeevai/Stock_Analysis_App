import { useState, useEffect, useMemo } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext.jsx'
import AlertList from '../components/alerts/AlertList.jsx'
import Button from '../components/ui/Button.jsx'
import * as alertsService from '../services/alerts.js'

const ALERT_PAGE_SIZE = 20

export default function AlertsPage() {
  const { isAdmin, isTrader } = useAuth()
  const [showAll, setShowAll] = useState(false)
  const [allAlerts, setAllAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [alertPage, setAlertPage] = useState(0)
  const canAcknowledge = isAdmin || isTrader

  async function loadAlerts() {
    setLoading(true)
    setAlertPage(0)
    try {
      const res = showAll ? await alertsService.listAlerts() : await alertsService.getUnacknowledged()
      const d = res.data
      setAllAlerts(Array.isArray(d) ? d : d.content ?? [])
    } catch {
      setError('Failed to load alerts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAlerts() }, [showAll]) // eslint-disable-line

  const displayedAlerts = useMemo(
    () => allAlerts.slice(alertPage * ALERT_PAGE_SIZE, (alertPage + 1) * ALERT_PAGE_SIZE),
    [allAlerts, alertPage]
  )

  const alertPagination = {
    page: alertPage,
    totalPages: Math.ceil(allAlerts.length / ALERT_PAGE_SIZE),
    totalElements: allAlerts.length,
    pageSize: ALERT_PAGE_SIZE,
  }

  const handleAcknowledge = async (id) => {
    try {
      await alertsService.acknowledgeAlert(id)
      await loadAlerts()
    } catch {
      setError('Failed to acknowledge alert.')
    }
  }

  return (
    <div className="space-y-4 max-w-5xl animate-fade-in">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Filter toggle */}
      <div className="flex items-center gap-3">
        <div className="segmented-control">
          <button
            onClick={() => setShowAll(false)}
            className={`segmented-btn ${!showAll ? 'segmented-btn-active' : 'segmented-btn-inactive'}`}
          >
            Unacknowledged
          </button>
          <button
            onClick={() => setShowAll(true)}
            className={`segmented-btn ${showAll ? 'segmented-btn-active' : 'segmented-btn-inactive'}`}
          >
            All Alerts
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadAlerts}
          leftIcon={<ArrowPathIcon className="h-3.5 w-3.5" />}
        >
          Refresh
        </Button>
      </div>

      <AlertList
        alerts={loading ? [] : displayedAlerts}
        loading={loading}
        onAcknowledge={handleAcknowledge}
        canAcknowledge={canAcknowledge}
        pagination={loading ? null : alertPagination}
        onPageChange={setAlertPage}
      />
    </div>
  )
}
