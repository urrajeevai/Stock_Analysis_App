import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext.jsx'
import * as momentumService from '../services/momentum.js'
import Button from '../components/ui/Button.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Badge from '../components/ui/Badge.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import { formatDate, formatDateTime } from '../utils/formatters.js'

// ── Helpers ────────────────────────────────────────────────────────────────

const SAMPLE_CSV = `Stock Name,Industry,Symbol,Exch,Sector Name,Industry Name,Score,4 Day Change,Close,Chg%,Symbol with Comma for External Upload
Reliance Industries Ltd,Oil & Gas,RELIANCE,NSE,Energy,Oil & Gas,78.50,2.30,2850.00,1.20,RELIANCE
Infosys Ltd,Technology,INFY,NSE,Information Technology,Software,82.30,3.10,1650.00,2.10,INFY
Tata Consultancy Services Ltd,Technology,TCS,NSE,Information Technology,Software,75.60,1.80,3900.00,0.90,TCS`

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'momentum_sample.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function scoreColor(score) {
  const n = parseFloat(score ?? 0)
  if (n >= 80) return 'text-emerald-600'
  if (n >= 60) return 'text-lime-600'
  if (n >= 40) return 'text-amber-500'
  return 'text-red-500'
}

function scoreBg(score) {
  const n = parseFloat(score ?? 0)
  if (n >= 80) return 'bg-emerald-50 border-emerald-200'
  if (n >= 60) return 'bg-lime-50 border-lime-200'
  if (n >= 40) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

function Tab({ label, active, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
        active
          ? 'bg-brand text-white shadow-sm'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
      ].join(' ')}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  )
}

function ResultRow({ label, value, color = 'text-slate-700' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-bold font-data ${color}`}>{value}</span>
    </div>
  )
}

// ── Upload Tab ─────────────────────────────────────────────────────────────

function UploadTab({ canEdit }) {
  const fileRef = useRef(null)
  const [csvFile, setCsvFile] = useState(null)
  const [scoreDate, setScoreDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [uploads, setUploads] = useState([])
  const [histLoading, setHistLoading] = useState(true)

  const loadHistory = useCallback(async () => {
    try {
      const res = await momentumService.listUploads()
      setUploads(Array.isArray(res.data) ? res.data : [])
    } catch { /* silent */ }
    finally { setHistLoading(false) }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) { setError('Only .csv files accepted.'); return }
    setError('')
    setCsvFile(f)
  }

  const handleUpload = async () => {
    if (!csvFile) return
    setUploading(true)
    setError('')
    setResult(null)
    try {
      const res = await momentumService.uploadMomentumCsv(csvFile, scoreDate || null)
      setResult(res.data)
      loadHistory()
    } catch (e) {
      setError(e.response?.data?.message || 'Upload failed. Check the file format.')
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setCsvFile(null)
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Upload panel */}
      <div className="card p-6 space-y-5">
        <div>
          <h3 className="section-heading mb-0.5">Upload CSV</h3>
          <p className="text-xs text-slate-400">Upserts by Symbol + Score Date</p>
        </div>

        {/* Format guide */}
        {!result && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-4 w-4 text-slate-500 shrink-0" />
              <p className="text-sm font-semibold text-slate-700">CSV Format</p>
            </div>
            <code className="text-xs text-slate-600 block whitespace-pre font-mono bg-white rounded-lg border border-slate-100 px-3 py-2 overflow-x-auto">
{`Stock Name,Symbol,Sector Name,Score,...(other cols ignored)
Reliance Industries Ltd,RELIANCE,Energy,78.50
Infosys Ltd,INFY,IT,82.30`}
            </code>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
              <li><strong>Required columns</strong>: Stock Name, Symbol, Score</li>
              <li><strong>Optional</strong>: Sector Name</li>
              <li>All other columns are ignored</li>
              <li>Header row is skipped automatically</li>
              <li>Duplicate symbols within one upload are rejected</li>
            </ul>
            <button onClick={downloadSample} className="text-xs font-medium text-brand hover:underline flex items-center gap-1">
              ↓ Download sample CSV
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="rounded-xl border p-4 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2">
              {result.failed === 0 && result.total > 0
                ? <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                : <XCircleIcon className="h-5 w-5 text-amber-500" />
              }
              <p className="text-sm font-semibold text-slate-700">Upload Complete — {result.scoreDate}</p>
            </div>
            <div className="divide-y divide-slate-100">
              <ResultRow label="Total rows" value={result.total} />
              <ResultRow label="Inserted" value={result.inserted} color="text-emerald-600" />
              <ResultRow label="Updated" value={result.updated} color="text-brand" />
              <ResultRow label="Skipped / Failed" value={result.failed} color={result.failed > 0 ? 'text-red-500' : 'text-slate-400'} />
            </div>
            {result.errors?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-600 mb-1.5">{result.errors.length} issue{result.errors.length !== 1 ? 's' : ''}</p>
                <div className="max-h-32 overflow-y-auto rounded-lg bg-red-50 border border-red-100 px-3 py-2 space-y-1">
                  {result.errors.map((e, i) => <p key={i} className="text-xs text-red-600 font-mono">{e}</p>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* File picker */}
        {!result && (
          <>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Score Date (optional)</label>
              <input
                type="date"
                value={scoreDate}
                onChange={e => setScoreDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
              />
              <p className="text-xs text-slate-400 mt-1">Leave blank to use today's date</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Select CSV File</label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFile}
                className="block w-full text-sm text-slate-600
                  file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0
                  file:text-sm file:font-medium file:bg-brand file:text-white
                  hover:file:bg-brand/90 file:cursor-pointer cursor-pointer
                  border border-slate-200 rounded-lg px-2 py-1.5 bg-white
                  focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              {csvFile && (
                <p className="mt-1 text-xs text-slate-500">
                  {csvFile.name} · {(csvFile.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>

            {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 border border-red-200">{error}</div>}
          </>
        )}

        <div className="flex gap-3">
          {result ? (
            <>
              <Button variant="secondary" onClick={reset} className="flex-1 justify-center">Upload Another</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => reset()} className="flex-1 justify-center">Clear</Button>
              <Button
                onClick={handleUpload}
                loading={uploading}
                disabled={!csvFile || !canEdit}
                className="flex-1 justify-center"
                leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}
              >
                Upload & Process
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Upload history */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="section-heading mb-0">Upload History</h3>
          <p className="text-xs text-slate-400 mt-0.5">{uploads.length} uploads</p>
        </div>
        {histLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : uploads.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-10">No uploads yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-2.5 text-left label-xs">File</th>
                  <th className="px-4 py-2.5 text-left label-xs">Score Date</th>
                  <th className="px-4 py-2.5 text-left label-xs">Uploaded</th>
                  <th className="px-4 py-2.5 text-center label-xs">In</th>
                  <th className="px-4 py-2.5 text-center label-xs">Up</th>
                  <th className="px-4 py-2.5 text-center label-xs">Fail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {uploads.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-slate-700 font-medium max-w-[140px] truncate">{u.fileName || '—'}</td>
                    <td className="px-4 py-2.5 text-xs font-data text-slate-600">{formatDate(u.scoreDate)}</td>
                    <td className="px-4 py-2.5 text-xs font-data text-slate-400 whitespace-nowrap">{formatDateTime(u.uploadedAt)}</td>
                    <td className="px-4 py-2.5 text-xs text-center font-semibold text-emerald-600">{u.inserted}</td>
                    <td className="px-4 py-2.5 text-xs text-center font-semibold text-brand">{u.updated}</td>
                    <td className="px-4 py-2.5 text-xs text-center font-semibold text-red-500">{u.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Scores Tab ─────────────────────────────────────────────────────────────

function ScoresTab() {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage] = useState(0)
  const [sectors, setSectors] = useState([])

  const [filters, setFilters] = useState({
    quickRange: '7', dateFrom: '', dateTo: '', sector: '', symbol: '',
  })

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    try {
      const params = { page: p, size: 20 }
      if (filters.quickRange && !filters.dateFrom) {
        params.lastNDays = parseInt(filters.quickRange)
      } else {
        if (filters.dateFrom) params.dateFrom = filters.dateFrom
        if (filters.dateTo) params.dateTo = filters.dateTo
      }
      if (filters.sector) params.sector = filters.sector
      if (filters.symbol) params.symbol = filters.symbol

      const res = await momentumService.listMomentumScores(params)
      const data = res.data
      setScores(Array.isArray(data.content) ? data.content : Array.isArray(data) ? data : [])
      const meta = (data.page && typeof data.page === 'object') ? data.page : data
      setTotalPages(meta.totalPages ?? 1)
      setTotalElements(meta.totalElements ?? scores.length)
      setPage(p)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load(0) }, [load])

  useEffect(() => {
    momentumService.getAvailableSectors().then(r => setSectors(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }, [])

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-36">
            <Select label="Quick Range" value={filters.quickRange}
              onChange={e => setF('quickRange', e.target.value)}>
              <option value="">Custom</option>
              <option value="3">Last 3 days</option>
              <option value="5">Last 5 days</option>
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </Select>
          </div>
          {!filters.quickRange && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">From</label>
                <input type="date" value={filters.dateFrom} onChange={e => setF('dateFrom', e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">To</label>
                <input type="date" value={filters.dateTo} onChange={e => setF('dateTo', e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
            </>
          )}
          {sectors.length > 0 && (
            <div className="w-48">
              <Select label="Sector" value={filters.sector} onChange={e => setF('sector', e.target.value)}>
                <option value="">All Sectors</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          )}
          <div className="w-40">
            <Input label="Symbol" placeholder="RELIANCE" value={filters.symbol}
              onChange={e => setF('symbol', e.target.value)} />
          </div>
          <div className="flex items-end pb-px">
            <Button size="sm" onClick={() => load(0)} leftIcon={<MagnifyingGlassIcon className="h-3.5 w-3.5" />}>
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            <span className="font-data">{totalElements}</span> results
          </p>
        </div>
        {loading ? (
          <div className="flex justify-center py-14"><Spinner size="lg" /></div>
        ) : scores.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-14">No scores found for the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left label-xs">Symbol</th>
                  <th className="px-4 py-3 text-left label-xs">Stock Name</th>
                  <th className="px-4 py-3 text-left label-xs">Sector</th>
                  <th className="px-4 py-3 text-center label-xs">Score</th>
                  <th className="px-4 py-3 text-left label-xs">Score Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {scores.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-brand font-data">{s.symbol}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">{s.stockName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{s.sectorName || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-sm font-bold font-data border ${scoreBg(s.score)} ${scoreColor(s.score)}`}>
                        {parseFloat(s.score).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-data text-slate-400">{formatDate(s.scoreDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={20}
          onPageChange={(p) => load(p)}
        />
      </div>
    </div>
  )
}

// ── Trending Tab ───────────────────────────────────────────────────────────

function fmtDay(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

// ── Sort indicator icon ────────────────────────────────────────────────────

function SortIcon({ colKey, sortKey, sortDir }) {
  if (sortKey !== colKey) return <ChevronUpDownIcon className="h-3 w-3 text-slate-400 ml-1 inline-block" />
  return sortDir === 'asc'
    ? <ChevronUpIcon   className="h-3 w-3 text-brand ml-1 inline-block" />
    : <ChevronDownIcon className="h-3 w-3 text-brand ml-1 inline-block" />
}

function SortTh({ colKey, sortKey, sortDir, onSort, align = 'center', className = '', children }) {
  const active = sortKey === colKey
  return (
    <th
      onClick={() => onSort(colKey)}
      className={[
        'py-3 label-xs cursor-pointer select-none whitespace-nowrap transition-colors',
        align === 'center' ? 'px-3 text-center' : 'px-4 text-left',
        active ? 'text-brand' : 'hover:text-slate-700',
        className,
      ].join(' ')}
    >
      {children}
      <SortIcon colKey={colKey} sortKey={sortKey} sortDir={sortDir} />
    </th>
  )
}

// ── CSV export helper ─────────────────────────────────────────────────────

function exportTrendingToCsv(rows, minScore, filterMode, effectiveNDays, dateFrom, dateTo) {
  if (!rows || rows.length === 0) return

  const lines = []

  // Header row — dynamic day columns
  const dayHeaders = rows[0].dailyScores.map((ds, i) => `"Day ${i + 1} (${fmtDay(ds.date)})"`)
  lines.push(['#', 'Symbol', 'Stock Name', 'Sector', ...dayHeaders, 'Change'].join(','))

  // Data rows (in current display order — reflects active client-side sort)
  rows.forEach((stock, idx) => {
    const dayScores = stock.dailyScores.map(ds => parseFloat(ds.score).toFixed(2))
    const name = stock.stockName?.includes(',') ? `"${stock.stockName}"` : (stock.stockName || '')
    const sector = stock.sectorName?.includes(',') ? `"${stock.sectorName}"` : (stock.sectorName || '')
    lines.push([
      idx + 1,
      stock.symbol,
      name,
      sector,
      ...dayScores,
      `+${parseFloat(stock.scoreChange).toFixed(2)}`,
    ].join(','))
  })

  // Build filename with applied filter context
  const today = new Date().toISOString().split('T')[0]
  const filterSuffix = filterMode === 'ndays'
    ? `last${effectiveNDays}d`
    : (dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : today)
  const filename = `trending_stocks_minScore${minScore}_${filterSuffix}_${today}.csv`

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Trending Tab ───────────────────────────────────────────────────────────

function TrendingTab() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filterMode, setFilterMode] = useState('ndays') // 'ndays' | 'daterange'
  const [lastNDays, setLastNDays] = useState('3')
  const [minScore, setMinScore] = useState('60')
  const [customDays, setCustomDays] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searched, setSearched] = useState(false)

  // sortKey: null | 'change' | 'day-0' | 'day-1' | 'day-2' | …
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  const effectiveNDays = lastNDays === 'custom' ? (parseInt(customDays) || 3) : parseInt(lastNDays)

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  // Derived sorted list — no new API call needed
  const displayResults = useMemo(() => {
    if (!results || !sortKey) return results
    return [...results].sort((a, b) => {
      let va, vb
      if (sortKey === 'change') {
        va = parseFloat(a.scoreChange)
        vb = parseFloat(b.scoreChange)
      } else {
        const idx = parseInt(sortKey.split('-')[1], 10)
        va = a.dailyScores[idx] ? parseFloat(a.dailyScores[idx].score) : 0
        vb = b.dailyScores[idx] ? parseFloat(b.dailyScores[idx].score) : 0
      }
      return sortDir === 'asc' ? va - vb : vb - va
    })
  }, [results, sortKey, sortDir])

  const handleFind = async () => {
    setLoading(true)
    setSearched(true)
    setSortKey(null)   // reset sort on new search
    setSortDir('desc')
    try {
      const params = { minScore }
      if (filterMode === 'ndays') {
        params.lastNDays = effectiveNDays
      } else {
        if (dateFrom) params.dateFrom = dateFrom
        if (dateTo)   params.dateTo   = dateTo
      }
      const res = await momentumService.getTrendingStocks(params)
      setResults(Array.isArray(res.data) ? res.data : [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="card p-5">
        <h3 className="section-heading mb-1">Trending Criteria</h3>
        <p className="text-xs text-slate-400 mb-4">
          Find stocks whose momentum score increases every day for the selected period.
          All scores must be ≥ min score.
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilterMode('ndays')}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              filterMode === 'ndays'
                ? 'bg-brand text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            Last N Days
          </button>
          <button
            onClick={() => setFilterMode('daterange')}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              filterMode === 'daterange'
                ? 'bg-brand text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            Date Range
          </button>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          {filterMode === 'ndays' ? (
            <>
              <div className="w-44">
                <Select label="Last N Days" value={lastNDays} onChange={e => setLastNDays(e.target.value)}>
                  <option value="3">Last 3 days</option>
                  <option value="5">Last 5 days</option>
                  <option value="7">Last 7 days</option>
                  <option value="10">Last 10 days</option>
                  <option value="custom">Custom…</option>
                </Select>
              </div>
              {lastNDays === 'custom' && (
                <div className="w-28">
                  <Input
                    label="N days"
                    type="number"
                    min="2"
                    placeholder="e.g. 4"
                    value={customDays}
                    onChange={e => setCustomDays(e.target.value)}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>
            </>
          )}
          <div className="w-36">
            <Input label="Min Score" type="number" step="0.01" value={minScore}
              onChange={e => setMinScore(e.target.value)} />
          </div>
          <div className="pb-px">
            <Button
              onClick={handleFind}
              loading={loading}
              leftIcon={<ArrowTrendingUpIcon className="h-4 w-4" />}
            >
              Find Trending Stocks
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex justify-center py-14"><Spinner size="lg" /></div>
      )}

      {!loading && searched && results !== null && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="section-heading mb-0.5">
                {results.length > 0
                  ? `${results.length} Trending Stock${results.length !== 1 ? 's' : ''}`
                  : 'No Trending Stocks Found'}
              </h3>
              <p className="text-xs text-slate-400">
                Score ≥ {minScore}, strictly increasing every day
                {filterMode === 'ndays'
                  ? ` over ${effectiveNDays} score date${effectiveNDays !== 1 ? 's' : ''}`
                  : dateFrom && dateTo ? ` from ${dateFrom} to ${dateTo}` : ''}
                {sortKey && (
                  <span className="ml-2 text-brand font-medium">
                    · sorted by {sortKey === 'change' ? 'Change' : `Day ${parseInt(sortKey.split('-')[1], 10) + 1}`} ({sortDir === 'asc' ? '↑ asc' : '↓ desc'})
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {sortKey && (
                <button
                  onClick={() => { setSortKey(null); setSortDir('desc') }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
                >
                  Reset sort
                </button>
              )}
              {results.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => exportTrendingToCsv(
                    displayResults, minScore, filterMode, effectiveNDays, dateFrom, dateTo
                  )}
                  leftIcon={<ArrowDownTrayIcon className="h-3.5 w-3.5" />}
                >
                  Download CSV
                </Button>
              )}
            </div>
          </div>

          {results.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-14">
              No stocks match the trending criteria. Try reducing min score or number of days.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-4 py-3 text-left label-xs">#</th>
                    <th className="px-4 py-3 text-left label-xs">Symbol</th>
                    <th className="px-4 py-3 text-left label-xs">Stock Name</th>
                    <th className="px-4 py-3 text-left label-xs">Sector</th>
                    {results[0].dailyScores.map((ds, i) => (
                      <SortTh
                        key={ds.date}
                        colKey={`day-${i}`}
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={handleSort}
                        className="min-w-[80px]"
                      >
                        <span className="block">Day {i + 1}</span>
                        <span className="block text-[9px] text-slate-400 font-normal">{fmtDay(ds.date)}</span>
                      </SortTh>
                    ))}
                    <SortTh
                      colKey="change"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    >
                      Change
                    </SortTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayResults.map((stock, idx) => (
                    <tr key={stock.symbol} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 text-xs text-slate-400 font-data">{idx + 1}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-bold text-brand font-data">{stock.symbol}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-800 max-w-[200px] truncate">{stock.stockName}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">{stock.sectorName || '—'}</td>
                      {stock.dailyScores.map((ds, i) => (
                        <td key={ds.date} className="px-3 py-3.5 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            {i > 0 && <ChevronUpIcon className="h-3 w-3 text-emerald-500" />}
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold font-data border ${scoreBg(ds.score)} ${scoreColor(ds.score)}`}>
                              {parseFloat(ds.score).toFixed(1)}
                            </span>
                          </div>
                        </td>
                      ))}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm font-semibold font-data text-emerald-600">
                          +{parseFloat(stock.scoreChange).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function MomentumPage() {
  const { isAdmin, isTrader } = useAuth()
  const [tab, setTab] = useState('upload')
  const canEdit = isAdmin || isTrader

  return (
    <div className="space-y-5 max-w-7xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Momentum Score Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Upload daily momentum scores, browse historical data, and identify trending stocks
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        <Tab label="Upload" active={tab === 'upload'} onClick={() => setTab('upload')} icon={ArrowUpTrayIcon} />
        <Tab label="Scores Browser" active={tab === 'scores'} onClick={() => setTab('scores')} icon={MagnifyingGlassIcon} />
        <Tab label="Trending Report" active={tab === 'trending'} onClick={() => setTab('trending')} icon={ArrowTrendingUpIcon} />
      </div>

      {/* Tab content */}
      {tab === 'upload'   && <UploadTab canEdit={canEdit} />}
      {tab === 'scores'   && <ScoresTab />}
      {tab === 'trending' && <TrendingTab />}
    </div>
  )
}
