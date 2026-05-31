import { formatCurrency, formatDate } from '../../utils/formatters.js'
import { useNavigate } from 'react-router-dom'

export default function TopTradesTable({ trades, title, emptyText, variant = 'profit' }) {
  const navigate = useNavigate()
  const isProfit = variant === 'profit'

  if (!trades || trades.length === 0) {
    return (
      <div className="text-sm text-slate-400 text-center py-6">{emptyText ?? 'No data'}</div>
    )
  }

  return (
    <div>
      <p className="label-xs mb-3">{title}</p>
      <ol className="space-y-2">
        {trades.map((t, idx) => (
          <li
            key={t.id}
            onClick={() => navigate(`/trades/${t.id}`)}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors group"
          >
            <span className={`text-xs font-bold w-5 text-center rounded-full shrink-0 ${
              isProfit ? 'text-emerald-600' : 'text-red-500'
            }`}>
              #{idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 group-hover:text-brand transition-colors truncate">
                {t.ticker}
                <span className={`ml-1.5 text-xs font-medium ${t.direction === 'LONG' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.direction}
                </span>
              </p>
              <p className="text-xs text-slate-400">{formatDate(t.closedAt)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-semibold font-data ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                {isProfit ? '+' : ''}{formatCurrency(t.plAmount)}
              </p>
              {t.plPercent != null && (
                <p className={`text-xs font-data ${isProfit ? 'text-emerald-500' : 'text-red-400'}`}>
                  {isProfit ? '+' : ''}{parseFloat(t.plPercent).toFixed(2)}%
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
