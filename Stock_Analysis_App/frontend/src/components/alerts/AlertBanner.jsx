import { XMarkIcon } from '@heroicons/react/24/outline'

function getAlertType(alert) {
  return alert?.alertType ?? alert?.type ?? ''
}

function getBannerStyle(alerts) {
  if (!alerts || alerts.length === 0) return null
  const latest = alerts[0]
  const type = getAlertType(latest)
  if (type === 'SL_PROXIMITY') return 'bg-red-500 text-white'
  if (type === 'TARGET_PROXIMITY') return 'bg-amber-400 text-amber-900'
  return 'bg-indigo-500 text-white'
}

export default function AlertBanner({ alerts, onDismiss }) {
  if (!alerts || alerts.length === 0) return null

  const latest = alerts[0]
  const type = getAlertType(latest)
  const bannerStyle = getBannerStyle(alerts)

  const label =
    type === 'SL_PROXIMITY'
      ? 'Stop Loss Alert'
      : type === 'TARGET_PROXIMITY'
      ? 'Target Alert'
      : 'Alert'

  return (
    <div className={`flex items-center justify-between px-4 py-2.5 ${bannerStyle}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 text-xs font-bold uppercase tracking-wide opacity-80">
          {label}
        </span>
        <span className="text-sm truncate">
          {latest.ticker && (
            <span className="font-semibold mr-1">{latest.ticker}:</span>
          )}
          {latest.description ?? latest.message ?? `Price is near your ${type === 'SL_PROXIMITY' ? 'stop loss' : 'target'}.`}
        </span>
        {alerts.length > 1 && (
          <span className="shrink-0 text-xs opacity-70">+{alerts.length - 1} more</span>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors"
          aria-label="Dismiss alert"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
