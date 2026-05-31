import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import Pagination from '../ui/Pagination.jsx'
import { formatDateTime } from '../../utils/formatters.js'

function alertTypeVariant(alertType) {
  const map = { SL_PROXIMITY: 'danger', TARGET_PROXIMITY: 'warning', PRICE_ALERT: 'info' }
  return map[alertType] ?? 'neutral'
}

function alertTypeLabel(alertType) {
  const map = { SL_PROXIMITY: 'Stop Loss', TARGET_PROXIMITY: 'Target Hit', PRICE_ALERT: 'Price Alert' }
  return map[alertType] ?? alertType ?? 'Alert'
}

function SkeletonRow() {
  return (
    <tr>
      {[40, 50, 45, 60, 35].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-3.5" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function AlertList({ alerts, loading, onAcknowledge, canAcknowledge, pagination, onPageChange }) {
  if (!loading && (!alerts || alerts.length === 0)) {
    return (
      <div className="card">
        <EmptyState
          icon="alert"
          title="No alerts"
          description="You're all clear — no unacknowledged alerts right now."
        />
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      {/* Count header */}
      {pagination?.totalElements > 0 && (
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-sm font-semibold text-slate-700">
            <span className="font-data">{pagination.totalElements}</span> alert{pagination.totalElements !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {['Ticker', 'Alert Type', 'Price at Trigger', 'Triggered At', canAcknowledge && 'Action'].filter(Boolean).map(h => (
                <th key={h} className="px-4 py-3 text-left label-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              : alerts.map(alert => (
                <tr key={alert.id} className="hover:bg-slate-50/80 transition-colors duration-100">
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-slate-800">{alert.ticker ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={alertTypeVariant(alert.alertType ?? alert.type)} dot>
                      {alertTypeLabel(alert.alertType ?? alert.type)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-slate-700 font-data">
                      {alert.priceAtTrigger != null ? `₹${alert.priceAtTrigger}` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-400 font-data">
                      {formatDateTime(alert.triggeredAt ?? alert.createdAt)}
                    </span>
                  </td>
                  {canAcknowledge && (
                    <td className="px-4 py-3.5">
                      <Button variant="ghost" size="xs" onClick={() => onAcknowledge?.(alert.id)}>
                        Acknowledge
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {pagination && onPageChange && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalElements={pagination.totalElements}
          pageSize={pagination.pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}
