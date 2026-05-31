import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as tradesService from '../../services/trades.js'
import { formatCurrency, formatDate } from '../../utils/formatters.js'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Spinner from '../ui/Spinner.jsx'

function holdingDaysLabel(days) {
  if (days == null) return '—'
  if (days === 0) return 'Same day'
  return `${days}d`
}

export default function PLTradeListPanel({ type, onClose }) {
  const navigate = useNavigate()
  const [trades, setTrades] = useState([])
  const [months, setMonths] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [ticker, setTicker] = useState('')
  const [direction, setDirection] = useState('')
  const title = type === 'PROFIT' ? 'Profit Trades' : 'Loss Trades'

  const load = useCallback(async (m, append = false) => {
    try {
      const res = await tradesService.getPLDetail({
        months: m,
        type,
        ticker: ticker || undefined,
        direction: direction || undefined,
      })
      const data = Array.isArray(res.data) ? res.data : []
      setTrades(append ? data : data)
    } catch {
      // silent — trades stay as empty
    }
  }, [type, ticker, direction])

  useEffect(() => {
    setLoading(true)
    setMonths(1)
    load(1).finally(() => setLoading(false))
  }, [load])

  const handleLoadMore = async () => {
    const next = months + 1
    setMonths(next)
    setLoadingMore(true)
    await load(next)
    setLoadingMore(false)
  }

  const columns = [
    { label: 'Symbol', key: 'ticker' },
    { label: 'Type', key: 'direction' },
    { label: 'Entry Date', key: 'createdAt' },
    { label: 'Exit Date', key: 'closedAt' },
    { label: 'Entry', key: 'entryPrice' },
    { label: 'Exit', key: 'actualExitPrice' },
    { label: 'Qty', key: 'quantity' },
    { label: 'P/L Amount', key: 'plAmount' },
    { label: 'P/L %', key: 'plPercent' },
    { label: 'Holding', key: 'holdingDays' },
    { label: 'Status', key: 'status' },
  ]

  return (
    <div className="card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="section-heading">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Last {months} month{months > 1 ? 's' : ''} · {trades.length} trade{trades.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/40">
        <div className="w-40">
          <Input
            label="Symbol"
            placeholder="RELIANCE"
            value={ticker}
            onChange={e => setTicker(e.target.value)}
          />
        </div>
        <div className="w-36">
          <Select label="Direction" value={direction} onChange={e => setDirection(e.target.value)}>
            <option value="">All</option>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : trades.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-12">
            No {title.toLowerCase()} in the last {months} month{months > 1 ? 's' : ''}.
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {columns.map(c => (
                  <th key={c.key} className="px-4 py-2.5 text-left label-xs whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {trades.map(t => {
                const isProfit = (t.plAmount ?? 0) >= 0
                return (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/trades/${t.id}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold text-sm text-slate-800 group-hover:text-brand transition-colors">
                        {t.ticker}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${t.direction === 'LONG' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-data whitespace-nowrap">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-data whitespace-nowrap">
                      {formatDate(t.closedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm font-data text-slate-700">
                      {formatCurrency(t.entryPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm font-data text-slate-700">
                      {t.actualExitPrice != null ? formatCurrency(t.actualExitPrice) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-data text-slate-600">
                      {t.quantity != null ? parseFloat(t.quantity).toLocaleString('en-IN') : '1'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold font-data ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isProfit ? '+' : ''}{formatCurrency(t.plAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-data ${isProfit ? 'text-emerald-500' : 'text-red-400'}`}>
                        {t.plPercent != null
                          ? `${isProfit ? '+' : ''}${parseFloat(t.plPercent).toFixed(2)}%`
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-data text-slate-500">
                      {holdingDaysLabel(t.holdingDays)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant="success" dot>CLOSED</Badge>
                        {t.outcome && (
                          <Badge variant={t.outcome === 'WIN' ? 'success' : t.outcome === 'LOSS' ? 'danger' : 'warning'}>
                            {t.outcome}
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Load More */}
      {!loading && (
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Showing data from last {months} month{months > 1 ? 's' : ''}
          </p>
          <Button variant="secondary" size="sm" onClick={handleLoadMore} loading={loadingMore}>
            Load More ({months + 1} months)
          </Button>
        </div>
      )}
    </div>
  )
}
