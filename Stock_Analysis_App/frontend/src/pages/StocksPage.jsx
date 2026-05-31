import { useState, useEffect, useRef, useMemo } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { listStocks, createStock, updateStock, deleteStock, uploadStocksCsv } from '../services/stocks.js'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Modal from '../components/ui/Modal.jsx'
import Badge from '../components/ui/Badge.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Pagination from '../components/ui/Pagination.jsx'

const STOCKS_PAGE_SIZE = 20

const CSV_TEMPLATE_HEADER = 'Company Name,Industry,Symbol,Series,ISIN Code'
const CSV_SAMPLE_ROWS = [
  'Reliance Industries Ltd,Oil & Gas,RELIANCE,EQ,INE002A01018',
  'Infosys Ltd,Information Technology,INFY,EQ,INE009A01021',
  'Tata Consultancy Services Ltd,Information Technology,TCS,EQ,INE467B01029',
]

function downloadTemplate() {
  const content = [CSV_TEMPLATE_HEADER, ...CSV_SAMPLE_ROWS].join('\n')
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'stock_upload_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function ResultRow({ label, value, color = 'text-slate-700' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-bold font-data ${color}`}>{value}</span>
    </div>
  )
}

export default function StocksPage() {
  const { isAdmin, isTrader } = useAuth()
  const fileInputRef = useRef(null)

  const [stocks, setStocks] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [stockPage, setStockPage] = useState(0)

  // Single stock modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', symbol: '', exchange: '', industry: '', series: '', isinCode: '', active: true })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // CSV upload modal
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [csvFile, setCsvFile] = useState(null)
  const [csvUploading, setCsvUploading] = useState(false)
  const [csvResult, setCsvResult] = useState(null)
  const [csvError, setCsvError] = useState('')

  const load = () => {
    setLoading(true)
    listStocks(activeOnly)
      .then(r => { setStocks(r.data); setFiltered(r.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [activeOnly]) // eslint-disable-line

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(stocks.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.symbol.toLowerCase().includes(q) ||
      (s.exchange || '').toLowerCase().includes(q) ||
      (s.industry || '').toLowerCase().includes(q) ||
      (s.isinCode || '').toLowerCase().includes(q)
    ))
    setStockPage(0)
  }, [search, stocks])

  useEffect(() => { setStockPage(0) }, [activeOnly])

  const displayedStocks = useMemo(
    () => filtered.slice(stockPage * STOCKS_PAGE_SIZE, (stockPage + 1) * STOCKS_PAGE_SIZE),
    [filtered, stockPage]
  )

  // ── Single stock CRUD ────────────────────────────────────────────────────

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', symbol: '', exchange: 'NSE', industry: '', series: 'EQ', isinCode: '', active: true })
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (stock) => {
    setEditing(stock)
    setForm({
      name: stock.name || '',
      symbol: stock.symbol || '',
      exchange: stock.exchange || '',
      industry: stock.industry || '',
      series: stock.series || '',
      isinCode: stock.isinCode || '',
      active: stock.active,
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        await updateStock(editing.stockId, form)
      } else {
        await createStock(form)
      }
      setModalOpen(false)
      load()
    } catch (e) {
      setFormError(e.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (stockId) => {
    if (!window.confirm('Delete this stock?')) return
    try {
      await deleteStock(stockId)
      load()
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed')
    }
  }

  // ── CSV Upload ───────────────────────────────────────────────────────────

  const openCsvModal = () => {
    setCsvFile(null)
    setCsvResult(null)
    setCsvError('')
    setCsvModalOpen(true)
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setCsvError('Please select a .csv file.')
      return
    }
    setCsvError('')
    setCsvFile(f)
  }

  const handleCsvUpload = async () => {
    if (!csvFile) return
    setCsvUploading(true)
    setCsvError('')
    setCsvResult(null)
    try {
      const res = await uploadStocksCsv(csvFile)
      setCsvResult(res.data)
      load() // refresh stock list
    } catch (e) {
      setCsvError(e.response?.data?.message || 'Upload failed. Please check the file format.')
    } finally {
      setCsvUploading(false)
    }
  }

  const handleCsvModalClose = () => {
    setCsvModalOpen(false)
    setCsvFile(null)
    setCsvResult(null)
    setCsvError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const canEdit = isAdmin || isTrader

  return (
    <div className="space-y-5 max-w-7xl animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Stock Master Data</h1>
          <p className="text-sm text-slate-500 mt-0.5">{stocks.length} stocks in database</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={openCsvModal}
              leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}
            >
              Upload CSV
            </Button>
            <Button onClick={openAdd} leftIcon={<PlusIcon className="h-4 w-4" />}>
              Add Stock
            </Button>
          </div>
        )}
      </div>

      {/* Table card */}
      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="flex gap-3 items-center flex-wrap px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative w-64">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbol, name, industry, ISIN…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-slate-400 transition-all"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={e => setActiveOnly(e.target.checked)}
              className="rounded border-slate-300 text-brand focus:ring-brand"
            />
            Active only
          </label>
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} results</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-14"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No stocks found"
            description="Add stocks manually or upload a CSV file."
            action={canEdit && (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={openCsvModal} leftIcon={<ArrowUpTrayIcon className="h-3.5 w-3.5" />}>
                  Upload CSV
                </Button>
                <Button size="sm" onClick={openAdd} leftIcon={<PlusIcon className="h-3.5 w-3.5" />}>
                  Add Stock
                </Button>
              </div>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left label-xs">Symbol</th>
                  <th className="px-4 py-3 text-left label-xs">Company Name</th>
                  <th className="px-4 py-3 text-left label-xs">Industry</th>
                  <th className="px-4 py-3 text-left label-xs">Series</th>
                  <th className="px-4 py-3 text-left label-xs">ISIN Code</th>
                  <th className="px-4 py-3 text-left label-xs">Exchange</th>
                  <th className="px-4 py-3 text-left label-xs">Status</th>
                  {canEdit && <th className="px-4 py-3 text-left label-xs">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayedStocks.map(s => (
                  <tr key={s.stockId} className="hover:bg-slate-50/80 transition-colors duration-100">
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-brand font-data">{s.symbol}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-800">{s.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{s.industry || <span className="text-slate-300">—</span>}</span>
                    </td>
                    <td className="px-4 py-3">
                      {s.series
                        ? <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{s.series}</span>
                        : <span className="text-slate-300 text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-data text-slate-500">{s.isinCode || <span className="text-slate-300">—</span>}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {s.exchange || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.active ? 'success' : 'neutral'} dot>
                        {s.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="xs" onClick={() => openEdit(s)}>Edit</Button>
                          {isAdmin && (
                            <Button
                              variant="ghost" size="xs"
                              className="text-red-500 hover:bg-red-50"
                              onClick={() => handleDelete(s.stockId)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={stockPage}
          totalPages={Math.ceil(filtered.length / STOCKS_PAGE_SIZE)}
          totalElements={filtered.length}
          pageSize={STOCKS_PAGE_SIZE}
          onPageChange={setStockPage}
        />
      </div>

      {/* ── Single Stock Modal ── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Stock' : 'Add New Stock'}>
        <div className="space-y-4">
          {formError && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 border border-red-200">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input
                label="Company Name *"
                placeholder="Reliance Industries Ltd"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <Input
              label="Symbol *"
              placeholder="RELIANCE"
              value={form.symbol}
              onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))}
            />
            <Input
              label="Exchange"
              placeholder="NSE / BSE / NASDAQ"
              value={form.exchange}
              onChange={e => setForm(f => ({ ...f, exchange: e.target.value.toUpperCase() }))}
            />
            <Input
              label="Industry"
              placeholder="Oil & Gas"
              value={form.industry}
              onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
            />
            <Input
              label="Series"
              placeholder="EQ"
              value={form.series}
              onChange={e => setForm(f => ({ ...f, series: e.target.value.toUpperCase() }))}
            />
            <div className="col-span-2">
              <Input
                label="ISIN Code"
                placeholder="INE002A01018"
                value={form.isinCode}
                onChange={e => setForm(f => ({ ...f, isinCode: e.target.value.toUpperCase() }))}
              />
            </div>
          </div>
          {editing && (
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                className="rounded border-slate-300 text-brand focus:ring-brand"
              />
              Active stock
            </label>
          )}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1 justify-center">
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} className="flex-1 justify-center">
              {editing ? 'Save Changes' : 'Add Stock'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── CSV Upload Modal ── */}
      <Modal isOpen={csvModalOpen} onClose={handleCsvModalClose} title="Bulk Upload Stocks (CSV)">
        <div className="space-y-5">

          {/* Format description */}
          {!csvResult && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4 text-slate-500 shrink-0" />
                <p className="text-sm font-semibold text-slate-700">Required CSV Format</p>
              </div>
              <div className="overflow-x-auto">
                <code className="text-xs text-slate-600 block whitespace-pre font-mono bg-white rounded-lg border border-slate-100 px-3 py-2">
{`Company Name,Industry,Symbol,Series,ISIN Code
Reliance Industries Ltd,Oil & Gas,RELIANCE,EQ,INE002A01018
Infosys Ltd,IT,INFY,EQ,INE009A01021`}
                </code>
              </div>
              <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                <li>First row is the <strong>header</strong> — it will be skipped automatically</li>
                <li><strong>Symbol</strong> and <strong>Company Name</strong> are required</li>
                <li>Existing symbols are <strong>updated</strong>; new symbols are <strong>inserted</strong></li>
                <li>Exchange defaults to <strong>NSE</strong> for new stocks</li>
                <li>Fields with commas should be wrapped in double quotes</li>
              </ul>
              <button
                onClick={downloadTemplate}
                className="text-xs font-medium text-brand hover:underline flex items-center gap-1"
              >
                ↓ Download sample template
              </button>
            </div>
          )}

          {/* Upload result */}
          {csvResult && (
            <div className="rounded-xl border p-4 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                {csvResult.failed === 0 && csvResult.total > 0
                  ? <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                  : <XCircleIcon className="h-5 w-5 text-amber-500" />
                }
                <p className="text-sm font-semibold text-slate-700">Upload Complete</p>
              </div>

              <div className="divide-y divide-slate-100">
                <ResultRow label="Total rows processed" value={csvResult.total} />
                <ResultRow label="Inserted (new)" value={csvResult.inserted} color="text-emerald-600" />
                <ResultRow label="Updated (existing)" value={csvResult.updated} color="text-brand" />
                <ResultRow label="Failed / Skipped" value={csvResult.failed} color={csvResult.failed > 0 ? 'text-red-500' : 'text-slate-400'} />
              </div>

              {csvResult.errors?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-red-600 mb-1.5">
                    {csvResult.errors.length} error{csvResult.errors.length !== 1 ? 's' : ''}
                  </p>
                  <div className="max-h-40 overflow-y-auto rounded-lg bg-red-50 border border-red-100 px-3 py-2 space-y-1">
                    {csvResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600 font-mono">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File picker */}
          {!csvResult && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Select CSV File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-600
                    file:mr-3 file:py-1.5 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-brand file:text-white
                    hover:file:bg-brand-hover
                    file:cursor-pointer cursor-pointer
                    border border-slate-200 rounded-lg px-2 py-1.5 bg-white
                    focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
                {csvFile && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Selected: <span className="font-medium text-slate-700">{csvFile.name}</span>
                    {' '}({(csvFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {csvError && (
                <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 border border-red-200">
                  {csvError}
                </div>
              )}
            </>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={handleCsvModalClose} className="flex-1 justify-center">
              {csvResult ? 'Close' : 'Cancel'}
            </Button>
            {!csvResult && (
              <Button
                onClick={handleCsvUpload}
                loading={csvUploading}
                disabled={!csvFile}
                className="flex-1 justify-center"
                leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}
              >
                {csvUploading ? 'Uploading…' : 'Upload & Process'}
              </Button>
            )}
            {csvResult && (
              <Button
                variant="secondary"
                onClick={() => { setCsvResult(null); setCsvFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                className="flex-1 justify-center"
              >
                Upload Another
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
