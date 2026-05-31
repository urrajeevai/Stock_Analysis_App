import { formatDistanceToNow, parseISO } from 'date-fns'

export function formatCurrency(value, symbol = '₹') {
  if (value == null || isNaN(value)) return `${symbol}0.00`
  return `${symbol}${parseFloat(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatPercent(value) {
  if (value == null || isNaN(value)) return '0.00%'
  return `${parseFloat(value).toFixed(2)}%`
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '—'
  }
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '—'
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return '—'
  }
}

export function statusColor(status) {
  const map = {
    OPEN: 'bg-blue-100 text-blue-700',
    CLOSED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-slate-100 text-slate-600',
    WIN: 'bg-emerald-100 text-emerald-700',
    LOSS: 'bg-red-100 text-red-700',
    BREAKEVEN: 'bg-amber-100 text-amber-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    CORRECT: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-red-100 text-red-700',
  }
  return map[status] ?? 'bg-slate-100 text-slate-600'
}
