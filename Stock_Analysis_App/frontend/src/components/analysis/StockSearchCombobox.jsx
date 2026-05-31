import { useState, useRef, useEffect, useCallback } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, PlusCircleIcon } from '@heroicons/react/24/outline'
import { searchStocks, createStock } from '../../services/stocks.js'

// ── Constants ─────────────────────────────────────────────────────────────────

const EXCHANGES = ['NSE', 'BSE', 'NASDAQ', 'NYSE', 'OTHER']
const MIN_LEN    = 2      // minimum chars before search fires
const DEBOUNCE   = 300   // ms

// ── StockSearchCombobox ───────────────────────────────────────────────────────
//
// Props
//   initialValue  string   — text to pre-fill (e.g. ticker from edit mode)
//   onChange      fn({ stockId, symbol }) | null  — called on select or clear
//   canCreate     bool     — show "Create new stock" option (ADMIN/TRADER only)

export default function StockSearchCombobox({ initialValue = '', onChange, canCreate = true }) {
  const [query,       setQuery]       = useState(initialValue)
  const [results,     setResults]     = useState([])
  const [status,      setStatus]      = useState('idle')   // idle | loading | done
  const [isOpen,      setIsOpen]      = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const [showCreate,  setShowCreate]  = useState(false)

  const [createForm,  setCreateForm]  = useState({ symbol: '', name: '', exchange: 'NSE', industry: '' })
  const [creating,    setCreating]    = useState(false)
  const [createError, setCreateError] = useState('')

  const containerRef = useRef(null)
  const inputRef     = useRef(null)
  const debounceRef  = useRef(null)

  // ── Search ──────────────────────────────────────────────────────────────────

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < MIN_LEN) {
      setResults([])
      setIsOpen(false)
      setStatus('idle')
      return
    }
    setStatus('loading')
    try {
      const res  = await searchStocks(q.trim())
      const data = Array.isArray(res.data) ? res.data : []
      setResults(data)
      setHighlighted(-1)
      setIsOpen(true)
      setStatus('done')
    } catch {
      setResults([])
      setStatus('done')
    }
  }, [])

  const handleQueryChange = (e) => {
    const q = e.target.value
    setQuery(q)
    setShowCreate(false)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(q), DEBOUNCE)
  }

  // Paste fires onChange on the input, so debounced search picks it up naturally.
  // Nothing extra needed — the hint text below tells users this works.

  // ── Click-outside closes dropdown ───────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), [])

  // ── Keyboard navigation ─────────────────────────────────────────────────────

  const handleKeyDown = (e) => {
    if (!isOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted >= 0 && results[highlighted]) selectStock(results[highlighted])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // ── Selection helpers ───────────────────────────────────────────────────────

  const selectStock = (stock) => {
    setQuery(`${stock.symbol} — ${stock.name}`)
    setIsOpen(false)
    setShowCreate(false)
    setStatus('idle')
    onChange({ stockId: stock.stockId, symbol: stock.symbol })
  }

  const clearSelection = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    setShowCreate(false)
    setStatus('idle')
    clearTimeout(debounceRef.current)
    onChange(null)
    inputRef.current?.focus()
  }

  // ── Inline create form ──────────────────────────────────────────────────────

  const openCreateForm = () => {
    setIsOpen(false)
    setCreateError('')
    // Pre-fill symbol from whatever the user typed (strip non-ticker characters)
    const sym = query.trim().toUpperCase().replace(/[^A-Z0-9.&-]/g, '').slice(0, 30)
    setCreateForm({ symbol: sym, name: '', exchange: 'NSE', industry: '' })
    setShowCreate(true)
  }

  const handleCreateSubmit = async () => {
    const sym  = createForm.symbol.trim().toUpperCase()
    const name = createForm.name.trim()
    if (!sym || !name) { setCreateError('Symbol and Company Name are required'); return }
    setCreating(true)
    setCreateError('')
    try {
      const res = await createStock({
        symbol:   sym,
        name,
        exchange: createForm.exchange || 'NSE',
        industry: createForm.industry.trim() || null,
      })
      selectStock(res.data)
      setShowCreate(false)
    } catch (err) {
      setCreateError(err.response?.data?.message ?? 'Failed to create stock')
    } finally {
      setCreating(false)
    }
  }

  const setCF = (key, val) => setCreateForm(f => ({ ...f, [key]: val }))

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative">
      <label className="text-sm font-medium text-slate-700 block mb-1.5">Stock</label>

      {/* ── Search input ── */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 && query.trim().length >= MIN_LEN) setIsOpen(true)
          }}
          placeholder="Search by symbol or company name…"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-lg border border-slate-200 pl-9 pr-8 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all hover:border-slate-300"
        />

        {/* Clear / spinner */}
        {(query.length > 0 || status === 'loading') && (
          <button
            type="button"
            onClick={clearSelection}
            tabIndex={-1}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {status === 'loading' ? (
              <svg className="h-3.5 w-3.5 animate-spin text-brand" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <XMarkIcon className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
        Type or paste ≥ 2 characters · use ↑ ↓ to navigate · Enter to select · optional (Ticker below is required)
      </p>

      {/* ── Results dropdown ── */}
      {isOpen && !showCreate && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {results.length > 0 ? (
            <>
              <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
                {results.map((stock, i) => (
                  <li key={stock.stockId} role="option" aria-selected={i === highlighted}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlighted(i)}
                      onClick={() => selectStock(stock)}
                      className={[
                        'w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors',
                        i === highlighted ? 'bg-brand/10' : 'hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <span className="text-sm font-bold font-data text-brand w-28 shrink-0 truncate">
                        {stock.symbol}
                      </span>
                      <span className="text-sm text-slate-700 truncate flex-1">{stock.name}</span>
                      {stock.exchange && (
                        <span className="text-[11px] text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          {stock.exchange}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>

              {canCreate && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="flex items-center gap-1.5 text-xs font-medium text-brand hover:underline underline-offset-2 transition-colors"
                  >
                    <PlusCircleIcon className="h-3.5 w-3.5" />
                    Not in the list? Create a new stock
                  </button>
                </div>
              )}
            </>
          ) : status === 'done' ? (
            /* No results */
            <div className="px-4 py-4 space-y-3">
              <p className="text-sm text-slate-500">
                No stocks found for{' '}
                <span className="font-semibold text-slate-700">"{query}"</span>
              </p>
              {canCreate && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="flex items-center gap-2 text-sm font-medium text-brand hover:underline underline-offset-2"
                >
                  <PlusCircleIcon className="h-4 w-4" />
                  Add "{query.toUpperCase()}" as a new stock
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ── Inline create form ── */}
      {showCreate && (
        <div className="mt-2 rounded-xl border border-brand/25 bg-indigo-50/50 p-4 space-y-3 animate-fade-in">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">Add New Stock</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Will be added to the master stock list and auto-selected
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors mt-0.5"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {createError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {createError}
            </div>
          )}

          <div className="space-y-3">
            {/* Symbol + Exchange */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Symbol <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.symbol}
                  onChange={e => setCF('symbol', e.target.value.toUpperCase())}
                  placeholder="RELIANCE"
                  autoFocus
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-data bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Exchange</label>
                <select
                  value={createForm.exchange}
                  onChange={e => setCF('exchange', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                >
                  {EXCHANGES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={e => setCF('name', e.target.value)}
                placeholder="Reliance Industries Ltd"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
              />
            </div>

            {/* Industry (optional) */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Industry{' '}
                <span className="text-[10px] text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={createForm.industry}
                onChange={e => setCF('industry', e.target.value)}
                placeholder="Energy, Technology, Banking…"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSubmit}
                disabled={creating || !createForm.symbol.trim() || !createForm.name.trim()}
                className="flex-1 py-1.5 px-3 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating…' : 'Create & Select'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
