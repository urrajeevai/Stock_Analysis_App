import { formatDateTime } from '../../utils/formatters.js'

function getChangeDescription(revision) {
  const { changeType, fieldChanged, oldValue, newValue, reason, notes } = revision

  if (changeType === 'CLOSED') {
    return `Trade closed — Exit at ₹${newValue ?? '—'}${reason ? ` · ${reason}` : ''}`
  }
  if (changeType === 'CANCELLED') {
    return `Trade cancelled${reason ? ` — ${reason}` : ''}`
  }
  if (changeType === 'CREATED') {
    return 'Trade created'
  }
  if (fieldChanged) {
    const label = fieldChanged.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
    let desc = `${label} changed: ₹${oldValue ?? '—'} → ₹${newValue ?? '—'}`
    if (reason) desc += ` · ${reason}`
    if (notes) desc += ` (${notes})`
    return desc
  }
  if (notes) return notes
  return changeType ?? 'Updated'
}

function dotColor(changeType) {
  if (changeType === 'CLOSED') return 'bg-emerald-500'
  if (changeType === 'CANCELLED') return 'bg-slate-300'
  if (changeType === 'CREATED') return 'bg-brand'
  return 'bg-amber-400'
}

export default function RevisionTimeline({ revisions }) {
  if (!revisions || revisions.length === 0) {
    return (
      <div className="text-sm text-slate-400 text-center py-8">No revision history yet.</div>
    )
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-200" />

      <ol className="space-y-4">
        {revisions.map((rev, idx) => (
          <li key={rev.id ?? idx} className="relative flex gap-4 items-start">
            {/* Dot */}
            <span className={`absolute -left-[3px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white z-10 shrink-0 ${dotColor(rev.changeType)}`} />

            {/* Content */}
            <div className="flex-1 min-w-0 pl-1">
              <p className="text-sm text-slate-700 leading-relaxed">{getChangeDescription(rev)}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-400 font-data">
                  {formatDateTime(rev.createdAt ?? rev.timestamp)}
                </span>
                {rev.changedBy && (
                  <span className="text-xs text-slate-400">· {rev.changedBy}</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
