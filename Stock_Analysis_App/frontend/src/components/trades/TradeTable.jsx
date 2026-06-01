import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Pagination from '../ui/Pagination.jsx'
import { getRRColor, calculateRR } from '../../utils/rrCalculator.js'
import { formatCurrency, formatDate } from '../../utils/formatters.js'

function statusVariant(status) {
  const map = { OPEN: 'info', CLOSED: 'success', CANCELLED: 'neutral', WIN: 'success', LOSS: 'danger' }
  return map[status] ?? 'neutral'
}

function PLCell({ plAmount, plPercent }) {
  if (plAmount == null) return <span className="text-slate-300 font-data">—</span>
  const positive = plAmount >= 0
  return (
    <div className={`text-sm font-semibold font-data ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
      <div>{formatCurrency(plAmount)}</div>
      {plPercent != null && (
        <div className={`text-xs font-normal ${positive ? 'text-emerald-500' : 'text-red-400'}`}>
          {positive ? '+' : ''}{parseFloat(plPercent).toFixed(2)}%
        </div>
      )}
    </div>
  )
}

function SortIcon({ active, dir }) {
  if (!active) return <ChevronUpDownIcon className="h-3 w-3 text-slate-300 inline ml-0.5" />
  return dir === 'asc'
    ? <ChevronUpIcon className="h-3 w-3 text-brand inline ml-0.5" />
    : <ChevronDownIcon className="h-3 w-3 text-brand inline ml-0.5" />
}

function SortTh({ label, sortKey, currentSortKey, currentSortDir, onSort, className = '' }) {
  const active = currentSortKey === sortKey
  return (
    <th
      className={`px-4 py-3 label-xs cursor-pointer select-none hover:text-slate-700 transition-colors ${active ? 'text-brand' : ''} ${className}`}
      onClick={() => onSort(sortKey)}
    >
      {label}
      <SortIcon active={active} dir={currentSortDir} />
    </th>
  )
}

function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-3.5" style={{ width: `${45 + (i * 11) % 35}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function TradeTable({
  trades,
  loading,
  onRowClick,
  canCreate,
  onNewTrade,
  filters = {},
  onFilterChange,
  showPL = false,
  pagination,
  onPageChange,
  sortKey = 'createdAt',
  sortDir = 'desc',
  onSort,
  onResetSort,
}) {
  const showFilters = !!onFilterChange
  const hasClosed = trades.some(t => t.status === 'CLOSED')
  const showPLCol = showPL || hasClosed

  // Ticker, Dir., Entry, SL, Target, R/R, Shares, Total Val., [P/L], Status, Setup, Date
  const colCount = showPLCol ? 12 : 11

  return (
    <div className="card overflow-hidden">
      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="w-36">
            <Select
              label="Status"
              value={filters.status ?? ''}
              onChange={e => onFilterChange?.({ ...filters, status: e.target.value || undefined })}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
          <div className="w-44">
            <Input
              label="Ticker"
              placeholder="e.g. RELIANCE"
              value={filters.ticker ?? ''}
              onChange={e => onFilterChange?.({ ...filters, ticker: e.target.value || undefined })}
            />
          </div>
          <div className="ml-auto flex items-end gap-3">
            {pagination?.totalElements > 0 && (
              <span className="text-xs text-slate-400 font-data pb-px">
                <span className="font-semibold text-slate-600">{pagination.totalElements}</span> records
              </span>
            )}
            {onResetSort && sortKey !== 'createdAt' && (
              <button
                type="button"
                onClick={onResetSort}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Reset sort
              </button>
            )}
            {canCreate && (
              <Button
                onClick={onNewTrade}
                size="sm"
                leftIcon={<PlusIcon className="h-3.5 w-3.5" />}
              >
                New Trade
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-4 py-3 text-left label-xs">Ticker</th>
              <th className="px-4 py-3 text-left label-xs">Dir.</th>
              <th className="px-4 py-3 text-right label-xs">Entry</th>
              <th className="px-4 py-3 text-right label-xs">Stop Loss</th>
              <th className="px-4 py-3 text-right label-xs">Target</th>
              <th className="px-4 py-3 text-center label-xs">R/R</th>
              <th className="px-4 py-3 text-right label-xs">Shares</th>
              <th className="px-4 py-3 text-right label-xs">Total Val.</th>
              {showPLCol && (
                <th className="px-4 py-3 text-right label-xs">P/L</th>
              )}
              <SortTh
                label="Status"
                sortKey="status"
                currentSortKey={sortKey}
                currentSortDir={sortDir}
                onSort={onSort}
                className="text-left"
              />
              <th className="px-4 py-3 text-left label-xs">Setup</th>
              <SortTh
                label="Date"
                sortKey="createdAt"
                currentSortKey={sortKey}
                currentSortDir={sortDir}
                onSort={onSort}
                className="text-left"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={colCount} />)
            ) : trades.length === 0 ? (
              <tr>
                <td colSpan={colCount}>
                  <EmptyState
                    icon="trade"
                    title="No trades found"
                    description="There are no trades matching your filters."
                    action={
                      canCreate && (
                        <Button onClick={onNewTrade} size="sm" leftIcon={<PlusIcon className="h-3.5 w-3.5" />}>
                          Add your first trade
                        </Button>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              trades.map(trade => {
                const rrResult = calculateRR({
                  direction: trade.direction,
                  entryPrice: trade.entryPrice,
                  stopLoss: trade.stopLoss,
                  target: trade.targetPrice,
                })
                return (
                  <tr
                    key={trade.id}
                    onClick={() => onRowClick?.(trade.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors duration-100 group"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-800 text-sm group-hover:text-brand transition-colors">
                        {trade.ticker}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold tracking-wide ${
                        trade.direction === 'LONG' ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-slate-700 font-data">{formatCurrency(trade.entryPrice)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-red-500 font-data">{formatCurrency(trade.stopLoss)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-emerald-600 font-data">{formatCurrency(trade.targetPrice)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-sm font-semibold font-data ${getRRColor(rrResult?.rrRatio)}`}>
                        {rrResult ? `${rrResult.rrRatio}R` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-slate-600 font-data">
                        {trade.quantity != null
                          ? parseFloat(trade.quantity).toLocaleString('en-IN')
                          : <span className="text-slate-300">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-slate-700 font-data">
                        {trade.totalValue != null
                          ? formatCurrency(trade.totalValue)
                          : <span className="text-slate-300">—</span>}
                      </span>
                    </td>
                    {showPLCol && (
                      <td className="px-4 py-3.5 text-right">
                        <PLCell plAmount={trade.plAmount} plPercent={trade.plPercent} />
                      </td>
                    )}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <Badge variant={statusVariant(trade.status)} dot>
                          {trade.status}
                        </Badge>
                        {trade.outcome && (
                          <Badge variant={statusVariant(trade.outcome)}>
                            {trade.outcome}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-500">
                      {trade.setupType ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 font-data">
                      {formatDate(trade.createdAt)}
                    </td>
                  </tr>
                )
              })
            )}
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
