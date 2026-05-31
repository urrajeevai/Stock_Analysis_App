import { formatDateTime, formatCurrency } from '../../utils/formatters.js'

function dotColor(trail, idx, total) {
  if (idx === total - 1) return 'bg-brand ring-brand/30'
  return 'bg-amber-400 ring-amber-200'
}

function buildDescription(trail) {
  const parts = []

  if (trail.newStopLoss != null) {
    parts.push(
      `SL: ${formatCurrency(trail.previousStopLoss)} → ${formatCurrency(trail.newStopLoss)}`
    )
  }
  if (trail.newTarget != null) {
    parts.push(
      `Target: ${formatCurrency(trail.previousTarget)} → ${formatCurrency(trail.newTarget)}`
    )
  }

  return parts.join('  ·  ') || 'Trail entry recorded'
}

export default function TrailTimeline({ trails }) {
  if (!trails || trails.length === 0) {
    return (
      <div className="text-sm text-slate-400 text-center py-8">
        No trail entries yet. Use "Add Trail Entry" to track SL or target changes.
      </div>
    )
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-200" />

      <ol className="space-y-5">
        {trails.map((trail, idx) => {
          const isLatest = idx === trails.length - 1
          return (
            <li key={trail.id} className="relative flex gap-4 items-start">
              <span className={`absolute -left-[3px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white z-10 shrink-0 ${dotColor(trail, idx, trails.length)}`} />

              <div className="flex-1 min-w-0 pl-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-sm font-medium text-slate-700">{buildDescription(trail)}</p>
                  {isLatest && (
                    <span className="text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>

                {trail.reason && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="font-medium">Reason:</span> {trail.reason}
                  </p>
                )}
                {trail.notes && (
                  <p className="text-xs text-slate-400 mt-0.5 italic">{trail.notes}</p>
                )}

                <span className="text-xs text-slate-400 font-data mt-1 block">
                  {formatDateTime(trail.createdAt)}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
