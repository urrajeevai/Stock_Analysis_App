import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext.jsx'
import * as analysisService from '../services/analysis.js'
import * as tradesService from '../services/trades.js'
import AnalysisForm from '../components/analysis/AnalysisForm.jsx'
import ChartImageSlot from '../components/analysis/ChartImageSlot.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { formatDate, formatDateTime, formatCurrency } from '../utils/formatters.js'

function outcomeVariant(outcome) {
  const map = { CORRECT: 'success', FAILED: 'danger', PENDING: 'warning' }
  return map[outcome] ?? 'neutral'
}

function tradeStatusVariant(status) {
  const map = { OPEN: 'info', CLOSED: 'success', CANCELLED: 'neutral' }
  return map[status] ?? 'neutral'
}

function DetailItem({ label, value, valueClass = 'text-slate-800' }) {
  return (
    <div>
      <p className="label-xs mb-1">{label}</p>
      <p className={`text-sm font-semibold font-data ${valueClass}`}>{value ?? '—'}</p>
    </div>
  )
}

function getRRColor(rr) {
  if (rr == null) return 'text-slate-400'
  const n = parseFloat(rr)
  if (n >= 3) return 'text-emerald-500'
  if (n >= 2) return 'text-lime-500'
  if (n >= 1) return 'text-amber-500'
  return 'text-red-500'
}

export default function AnalysisDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin, isTrader } = useAuth()

  const [analysis, setAnalysis] = useState(null)
  const [linkedTrades, setLinkedTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const canEdit = isAdmin || isTrader

  async function loadAnalysis() {
    try {
      const [res, tradesRes] = await Promise.all([
        analysisService.getAnalysis(id),
        tradesService.getTradesByAnalysis(id),
      ])
      setAnalysis(res.data)
      setLinkedTrades(Array.isArray(tradesRes.data) ? tradesRes.data : [])
    } catch {
      setError('Failed to load analysis.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAnalysis() }, [id]) // eslint-disable-line

  const handleUpdate = async (data) => {
    setActionError('')
    try {
      await analysisService.updateAnalysis(id, data)
      setEditOpen(false)
      await loadAnalysis()
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Update failed.')
    }
  }

  const handleOutcome = async (outcome) => {
    setActionLoading(true)
    setActionError('')
    try {
      await analysisService.setOutcome(id, outcome)
      await loadAnalysis()
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Failed to set outcome.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this analysis?')) return
    try {
      await analysisService.deleteAnalysis(id)
      navigate('/analysis')
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Delete failed.')
    }
  }

  const handleCreateTrade = () => {
    navigate('/trades/new', {
      state: {
        fromAnalysis: {
          analysisId: analysis.id,
          ticker: analysis.ticker,
          direction: analysis.expectedDirection ?? 'LONG',
          entryPrice: analysis.stockPrice,
          stopLoss: analysis.riskPrice,
          targetPrice: analysis.rewardPrice,
          setupType: analysis.setupType,
          notes: analysis.thesis,
        }
      }
    })
  }

  const handleImageUpdated = (updatedAnalysis) => {
    setAnalysis(updatedAnalysis)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (error || !analysis) return <div className="card px-5 py-4 text-sm text-red-600">{error || 'Analysis not found.'}</div>

  const hasPrices = analysis.stockPrice != null

  const chartImages = [
    analysis.chartImage1Url,
    analysis.chartImage2Url,
    analysis.chartImage3Url,
    analysis.chartImage4Url,
  ].filter(Boolean)

  return (
    <div className="space-y-5 max-w-4xl animate-fade-in">
      <button
        onClick={() => navigate('/analysis')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        All Analyses
      </button>

      {actionError && (
        <div className="card px-5 py-3.5 text-sm text-red-600 border-red-200 bg-red-50">{actionError}</div>
      )}

      {/* ── Main info card ── */}
      <div className="card p-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{analysis.ticker}</h2>
              {analysis.expectedDirection && (
                <span className={`text-sm font-bold ${
                  analysis.expectedDirection === 'LONG' ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {analysis.expectedDirection}
                </span>
              )}
              {analysis.timeframe && (
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {analysis.timeframe}
                </span>
              )}
              <Badge variant={outcomeVariant(analysis.outcome)} dot>
                {analysis.outcome ?? 'PENDING'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">{formatDateTime(analysis.createdAt)}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {canEdit && hasPrices && (
              <Button
                size="sm"
                onClick={handleCreateTrade}
                leftIcon={<PlusIcon className="h-3.5 w-3.5" />}
              >
                Create Trade
              </Button>
            )}
            {canEdit && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setEditOpen(!editOpen)}>
                  {editOpen ? 'Cancel Edit' : 'Edit'}
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={handleDelete}>
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 mb-5">
          {analysis.setupType && (
            <DetailItem label="Setup Type" value={analysis.setupType.replace(/_/g, ' ')} valueClass="text-slate-700 font-medium font-sans" />
          )}
          {analysis.analysisDate && (
            <DetailItem label="Analysis Date" value={formatDate(analysis.analysisDate)} valueClass="text-slate-600 font-sans" />
          )}
        </div>

        {/* ── Price Levels ── */}
        {hasPrices && (
          <div className="mb-5 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Price Levels</p>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              <DetailItem label="Stock Price" value={formatCurrency(analysis.stockPrice)} />
              <DetailItem label="Risk Price (SL)" value={formatCurrency(analysis.riskPrice)} valueClass="text-red-500" />
              <DetailItem label="Reward Price (Target)" value={formatCurrency(analysis.rewardPrice)} valueClass="text-emerald-600" />
            </div>
          </div>
        )}

        {/* ── R/R Computed ── */}
        {analysis.rrRatio != null && (
          <div className="mb-5 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Risk / Reward</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4 items-end">
              <div>
                <p className="label-xs mb-1">Risk Amount</p>
                <p className="text-sm font-semibold text-red-500 font-data">
                  {formatCurrency(analysis.riskAmount)}
                  {analysis.riskPercent != null && (
                    <span className="text-xs font-normal text-red-400 ml-1">
                      ({parseFloat(analysis.riskPercent).toFixed(2)}%)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="label-xs mb-1">Reward Amount</p>
                <p className="text-sm font-semibold text-emerald-600 font-data">
                  {formatCurrency(analysis.rewardAmount)}
                  {analysis.rewardPercent != null && (
                    <span className="text-xs font-normal text-emerald-400 ml-1">
                      ({parseFloat(analysis.rewardPercent).toFixed(2)}%)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="label-xs mb-1">R/R Ratio</p>
                <p className={`text-sm font-bold font-data ${getRRColor(analysis.rrRatio)}`}>
                  {parseFloat(analysis.rrRatio).toFixed(2)}R
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="label-xs mb-1">Buy Decision</p>
                <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-4 py-1 rounded-full ${
                  analysis.buyDecision === 'YES'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {analysis.buyDecision === 'YES' ? '✓' : '✗'} {analysis.buyDecision}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Thesis ── */}
        {analysis.thesis && (
          <div className="mb-4 pt-4 border-t border-slate-100">
            <p className="label-xs mb-2">Thesis</p>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{analysis.thesis}</p>
            </div>
          </div>
        )}

        {/* ── Chart Images ── */}
        {(chartImages.length > 0 || canEdit) && (
          <div className="pt-4 border-t border-slate-100">
            <p className="label-xs mb-1">Chart Images</p>
            <p className="text-[10px] text-slate-400 mb-3">
              Click to browse · drag an image · or click a slot then Ctrl+V / ⌘V to paste
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(slot => {
                const url = [
                  analysis.chartImage1Url,
                  analysis.chartImage2Url,
                  analysis.chartImage3Url,
                  analysis.chartImage4Url,
                ][slot - 1]
                if (!url && !canEdit) return null
                return (
                  <ChartImageSlot
                    key={slot}
                    slot={slot}
                    currentUrl={url}
                    analysisId={id}
                    canEdit={canEdit}
                    onUpdated={handleImageUpdated}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Linked Trades ── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-heading mb-0.5">Linked Trades</h3>
            <p className="text-xs text-slate-400">Trades created from this analysis</p>
          </div>
          {canEdit && hasPrices && (
            <Button size="sm" onClick={handleCreateTrade} leftIcon={<PlusIcon className="h-3.5 w-3.5" />}>
              Create Trade
            </Button>
          )}
        </div>

        {linkedTrades.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-8">
            No trades linked yet.{hasPrices && canEdit && ' Click "Create Trade" to start one from this analysis.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {linkedTrades.map(t => (
              <Link
                key={t.id}
                to={`/trades/${t.id}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${t.direction === 'LONG' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.direction}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    Entry {formatCurrency(t.entryPrice)}
                  </span>
                  {t.setupType && (
                    <span className="hidden sm:inline text-xs text-slate-400">{t.setupType}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-data">{formatDate(t.createdAt)}</span>
                  <Badge variant={tradeStatusVariant(t.status)} dot>{t.status}</Badge>
                  {t.outcome && (
                    <Badge variant={t.outcome === 'WIN' ? 'success' : t.outcome === 'LOSS' ? 'danger' : 'warning'}>
                      {t.outcome}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Mark outcome ── */}
      {canEdit && (!analysis.outcome || analysis.outcome === 'PENDING') && (
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-700 mb-1">Mark Outcome</p>
          <p className="text-xs text-slate-400 mb-4">Did this analysis play out as expected?</p>
          <div className="flex gap-3">
            <Button variant="success" size="sm" loading={actionLoading}
              onClick={() => handleOutcome('CORRECT')} leftIcon={<CheckCircleIcon className="h-4 w-4" />}>
              Correct
            </Button>
            <Button variant="danger" size="sm" loading={actionLoading}
              onClick={() => handleOutcome('FAILED')} leftIcon={<XCircleIcon className="h-4 w-4" />}>
              Failed
            </Button>
          </div>
        </div>
      )}

      {/* ── Edit form ── */}
      {editOpen && canEdit && (
        <div className="card p-6">
          <h3 className="section-heading mb-5">Edit Analysis</h3>
          <AnalysisForm
            mode="edit"
            defaultValues={analysis}
            onSubmit={handleUpdate}
            onCancel={() => setEditOpen(false)}
            analysisId={id}
            canEdit={canEdit}
            onImageUpdated={handleImageUpdated}
          />
        </div>
      )}
    </div>
  )
}
