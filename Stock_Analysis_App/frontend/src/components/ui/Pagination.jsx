import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

const BTN = 'h-8 min-w-[2rem] px-1 flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-100 select-none'
const BTN_ACTIVE = 'bg-brand text-white shadow-sm'
const BTN_IDLE   = 'text-slate-600 hover:bg-slate-100'
const BTN_OFF    = 'text-slate-300 cursor-not-allowed pointer-events-none'

function pages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const delta = 2
  const left  = Math.max(0, current - delta)
  const right = Math.min(total - 1, current + delta)
  const nums = []
  if (left > 0) { nums.push(0); if (left > 1) nums.push('…l') }
  for (let i = left; i <= right; i++) nums.push(i)
  if (right < total - 1) { if (right < total - 2) nums.push('…r'); nums.push(total - 1) }
  return nums
}

/**
 * Reusable pagination bar.
 * Always shows the record count when totalElements > 0.
 * Only shows page navigation when totalPages > 1.
 *
 * displayMode="range" (default) — "Showing X–Y of Z records"
 * displayMode="page"            — "Showing page X of Y | Total Records: Z"
 */
export default function Pagination({ page, totalPages, totalElements, pageSize, onPageChange, displayMode = 'range' }) {
  if (!totalElements || totalElements === 0) return null

  const start = page * pageSize + 1
  const end   = Math.min((page + 1) * pageSize, totalElements)
  const multiPage = totalPages > 1
  const currentPageDisplay = page + 1

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
      <p className="text-xs text-slate-400 font-data">
        {displayMode === 'page' ? (
          <>
            Showing page{' '}
            <span className="font-semibold text-slate-700">{currentPageDisplay}</span>
            {' '}of{' '}
            <span className="font-semibold text-slate-700">{totalPages}</span>
            {totalElements > 0 && (
              <>
                {' '}|{' '}Total Records:{' '}
                <span className="font-semibold text-slate-700">{totalElements}</span>
              </>
            )}
          </>
        ) : (
          <>
            Showing{' '}
            <span className="font-semibold text-slate-700">{start}–{end}</span>
            {' '}of{' '}
            <span className="font-semibold text-slate-700">{totalElements}</span>
            {' '}records
          </>
        )}
      </p>

      {multiPage && (
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className={`${BTN} ${page === 0 ? BTN_OFF : BTN_IDLE}`}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>

          {pages(page, totalPages).map((n, i) =>
            typeof n === 'string' ? (
              <span key={n + i} className="h-8 w-5 flex items-center justify-center text-xs text-slate-300">…</span>
            ) : (
              <button
                key={n}
                onClick={() => onPageChange(n)}
                className={`${BTN} ${n === page ? BTN_ACTIVE : BTN_IDLE}`}
              >
                {n + 1}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className={`${BTN} ${page >= totalPages - 1 ? BTN_OFF : BTN_IDLE}`}
            aria-label="Next page"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
