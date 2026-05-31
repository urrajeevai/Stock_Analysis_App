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
import { formatDate } from '../../utils/formatters.js'

function outcomeVariant(outcome) {
  const map = { CORRECT: 'success', FAILED: 'danger', PENDING: 'warning' }
  return map[outcome] ?? 'neutral'
}

function getRRColor(rr) {
  if (rr == null) return 'text-slate-400'
  const n = parseFloat(rr)
  if (n >= 3) return 'text-emerald-500'
  if (n >= 2) return 'text-lime-500'
  if (n >= 1) return 'text-amber-500'
  return 'text-red-500'
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

function SkeletonRow() {
  return (
    <tr>
      {[40, 50, 35, 35, 45, 45, 55, 70].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-3.5" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function AnalysisTable({
  analyses,
  loading,
  onRowClick,
  canCreate,
  onNewAnalysis,
  filters = {},
  onFilterChange,
  pagination,
  onPageChange,
  sortKey = 'analysisDate',
  sortDir = 'desc',
  onSort,
  onResetSort,
}) {
  const showFilters = !!onFilterChange
  const displayAnalyses = analyses

  return (
    <div className="card overflow-hidden">
      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="w-36">
            <Select
              label="Outcome"
              value={filters.outcome ?? ''}
              onChange={e => onFilterChange?.({ ...filters, outcome: e.target.value || undefined })}
            >
              <option value="">All Outcomes</option>
              <option value="PENDING">Pending</option>
              <option value="CORRECT">Correct</option>
              <option value="FAILED">Failed</option>
            </Select>
          </div>
          <div className="w-44">
            <Input
              label="Ticker"
              placeholder="e.g. NIFTY"
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
            {onResetSort && sortKey !== 'analysisDate' && (
              <button
                type="button"
                onClick={onResetSort}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Reset sort
              </button>
            )}
            {canCreate && (
              <Button onClick={onNewAnalysis} size="sm" leftIcon={<PlusIcon className="h-3.5 w-3.5" />}>
                New Analysis
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
              <th className="px-4 py-3 text-left label-xs">Setup</th>
              <th className="px-4 py-3 text-left label-xs">Dir.</th>
              <th className="px-4 py-3 text-left label-xs">TF</th>
              <SortTh
                label="R/R"
                sortKey="rrRatio"
                currentSortKey={sortKey}
                currentSortDir={sortDir}
                onSort={onSort}
                className="text-center"
              />
              <th className="px-4 py-3 text-center label-xs">Decision</th>
              <SortTh
                label="Outcome"
                sortKey="outcome"
                currentSortKey={sortKey}
                currentSortDir={sortDir}
                onSort={onSort}
                className="text-left"
              />
              <SortTh
                label="Date"
                sortKey="analysisDate"
                currentSortKey={sortKey}
                currentSortDir={sortDir}
                onSort={onSort}
                className="text-left"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : displayAnalyses.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    title="No analyses found"
                    description="Start by recording your first pre-trade market analysis."
                    action={
                      canCreate && (
                        <Button onClick={onNewAnalysis} size="sm" leftIcon={<PlusIcon className="h-3.5 w-3.5" />}>
                          New Analysis
                        </Button>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              displayAnalyses.map(analysis => (
                <tr
                  key={analysis.id}
                  onClick={() => onRowClick?.(analysis.id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors duration-100 group"
                >
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-brand transition-colors">
                      {analysis.ticker}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">
                    {analysis.setupType
                      ? analysis.setupType.replace(/_/g, ' ')
                      : <span className="text-slate-300">—</span>
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold tracking-wide ${
                      analysis.expectedDirection === 'LONG' ? 'text-emerald-600'
                        : analysis.expectedDirection === 'SHORT' ? 'text-red-500'
                        : 'text-slate-400'
                    }`}>
                      {analysis.expectedDirection ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {analysis.timeframe
                      ? <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">{analysis.timeframe}</span>
                      : <span className="text-slate-300 text-sm">—</span>
                    }
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {analysis.rrRatio != null
                      ? <span className={`text-sm font-semibold font-data ${getRRColor(analysis.rrRatio)}`}>
                          {parseFloat(analysis.rrRatio).toFixed(2)}R
                        </span>
                      : <span className="text-slate-300 text-sm">—</span>
                    }
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {analysis.buyDecision
                      ? <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          analysis.buyDecision === 'YES'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {analysis.buyDecision}
                        </span>
                      : <span className="text-slate-300 text-sm">—</span>
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={outcomeVariant(analysis.outcome)} dot>
                      {analysis.outcome ?? 'PENDING'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 font-data">
                    {formatDate(analysis.analysisDate ?? analysis.createdAt)}
                  </td>
                </tr>
              ))
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
          displayMode="page"
        />
      )}
    </div>
  )
}
