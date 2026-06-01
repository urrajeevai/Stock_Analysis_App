import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeftIcon, BeakerIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext.jsx'
import * as tradesService from '../services/trades.js'
import TradeForm from '../components/trades/TradeForm.jsx'
import RevisionTimeline from '../components/trades/RevisionTimeline.jsx'
import TrailTimeline from '../components/trades/TrailTimeline.jsx'
import Modal from '../components/ui/Modal.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import Select from '../components/ui/Select.jsx'
import Input from '../components/ui/Input.jsx'
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters.js'
import { calculateRR, getRRColor } from '../utils/rrCalculator.js'

function statusVariant(status) {
  const map = { OPEN: 'info', CLOSED: 'success', CANCELLED: 'neutral' }
  return map[status] ?? 'neutral'
}

function DetailItem({ label, value, valueClass = 'text-slate-800' }) {
  return (
    <div>
      <p className="label-xs mb-1">{label}</p>
      <p className={`text-sm font-semibold font-data ${valueClass}`}>{value}</p>
    </div>
  )
}

function pnlColor(pct) {
  if (pct == null) return 'text-slate-400'
  return pct >= 0 ? 'text-emerald-600' : 'text-red-500'
}

export default function TradeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin, isTrader } = useAuth()

  const [trade, setTrade] = useState(null)
  const [revisions, setRevisions] = useState([])
  const [trails, setTrails] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [closeModalOpen, setCloseModalOpen] = useState(false)
  const [trailModalOpen, setTrailModalOpen] = useState(false)
  const [closeData, setCloseData] = useState({ actualExitPrice: '', outcome: 'WIN' })
  const [trailData, setTrailData] = useState({ newStopLoss: '', newTarget: '', reason: '', notes: '' })
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const canEdit = isAdmin || isTrader

  async function loadTrade() {
    try {
      const [tradeRes, revisionsRes, trailsRes] = await Promise.all([
        tradesService.getTrade(id),
        tradesService.getRevisions(id),
        tradesService.getTrailEntries(id),
      ])
      setTrade(tradeRes.data)
      setRevisions(Array.isArray(revisionsRes.data) ? revisionsRes.data : revisionsRes.data?.content ?? [])
      setTrails(Array.isArray(trailsRes.data) ? trailsRes.data : [])
    } catch {
      setError('Failed to load trade.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTrade() }, [id]) // eslint-disable-line

  const handleUpdate = async (data) => {
    setActionError('')
    try {
      await tradesService.updateTrade(id, data)
      setEditOpen(false)
      await loadTrade()
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Update failed.')
    }
  }

  const handleClose = async () => {
    setActionLoading(true)
    setActionError('')
    try {
      await tradesService.closeTrade(id, {
        actualExitPrice: parseFloat(closeData.actualExitPrice),
        outcome: closeData.outcome,
      })
      setCloseModalOpen(false)
      await loadTrade()
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Failed to close trade.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel this trade?')) return
    setActionLoading(true)
    try {
      await tradesService.cancelTrade(id)
      await loadTrade()
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Failed to cancel trade.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddTrail = async () => {
    setActionLoading(true)
    setActionError('')
    try {
      const payload = {}
      if (trailData.newStopLoss) payload.newStopLoss = parseFloat(trailData.newStopLoss)
      if (trailData.newTarget) payload.newTarget = parseFloat(trailData.newTarget)
      if (trailData.reason) payload.reason = trailData.reason
      if (trailData.notes) payload.notes = trailData.notes

      await tradesService.addTrailEntry(id, payload)
      setTrailModalOpen(false)
      setTrailData({ newStopLoss: '', newTarget: '', reason: '', notes: '' })
      await loadTrade()
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Failed to add trail entry.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !trade) {
    return (
      <div className="card px-5 py-4 text-sm text-red-600">
        {error || 'Trade not found.'}
      </div>
    )
  }

  const activeSL = trade.activeStopLoss ?? trade.stopLoss
  const activeTarget = trade.activeTarget ?? trade.targetPrice
  const hasTrails = trails.length > 0

  const rrResult = calculateRR({
    direction: trade.direction,
    entryPrice: trade.entryPrice,
    stopLoss: activeSL,
    target: activeTarget,
  })

  const originalRR = calculateRR({
    direction: trade.direction,
    entryPrice: trade.entryPrice,
    stopLoss: trade.stopLoss,
    target: trade.targetPrice,
  })

  const riskMoved = hasTrails && activeSL !== trade.stopLoss
  const targetMoved = hasTrails && activeTarget !== trade.targetPrice

  return (
    <div className="space-y-5 max-w-4xl animate-fade-in">
      <button
        onClick={() => navigate('/trades')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        All Trades
      </button>

      {actionError && (
        <div className="card px-5 py-3.5 text-sm text-red-600 border-red-200 bg-red-50">
          {actionError}
        </div>
      )}

      {/* ── Trade info card ── */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{trade.ticker}</h2>
              <span className={`text-sm font-bold ${trade.direction === 'LONG' ? 'text-emerald-600' : 'text-red-500'}`}>
                {trade.direction}
              </span>
              <Badge variant={statusVariant(trade.status)} dot>{trade.status}</Badge>
              {trade.outcome && (
                <Badge
                  variant={trade.outcome === 'WIN' ? 'success' : trade.outcome === 'LOSS' ? 'danger' : 'warning'}
                  dot
                >
                  {trade.outcome}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400">Created {formatDateTime(trade.createdAt)}</p>
          </div>

          {canEdit && trade.status === 'OPEN' && (
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(!editOpen)}>
                {editOpen ? 'Cancel Edit' : 'Edit'}
              </Button>
              <Button size="sm" variant="warning" onClick={() => setTrailModalOpen(true)}>
                Add Trail Entry
              </Button>
              <Button size="sm" variant="success" onClick={() => setCloseModalOpen(true)}>
                Close Trade
              </Button>
              <Button size="sm" variant="danger" onClick={handleCancel} loading={actionLoading}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* ── Analysis reference ── */}
        {trade.analysisId && (
          <div className="mb-5 pb-5 border-b border-slate-100">
            <p className="label-xs mb-1.5">Linked Analysis</p>
            <Link
              to={`/analysis/${trade.analysisId}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              <BeakerIcon className="h-3.5 w-3.5" />
              View source analysis
            </Link>
          </div>
        )}

        {/* ── Active levels (from trail) ── */}
        {hasTrails && (
          <div className="mb-5 pb-5 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Active Levels
              <span className="ml-2 text-xs font-normal text-brand normal-case">(trailing)</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
              <DetailItem label="Entry Price" value={formatCurrency(trade.entryPrice)} />
              <DetailItem
                label="Active Stop Loss"
                value={formatCurrency(activeSL)}
                valueClass={riskMoved ? 'text-amber-500' : 'text-red-500'}
              />
              <DetailItem
                label="Active Target"
                value={formatCurrency(activeTarget)}
                valueClass={targetMoved ? 'text-lime-600' : 'text-emerald-600'}
              />
              <DetailItem
                label="Current R/R"
                value={rrResult ? `${rrResult.rrRatio}R` : '—'}
                valueClass={getRRColor(rrResult?.rrRatio)}
              />
            </div>
          </div>
        )}

        {/* ── Original levels ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-5">
          <DetailItem label="Entry Price" value={formatCurrency(trade.entryPrice)} />
          <DetailItem
            label={hasTrails ? 'Original Stop Loss' : 'Stop Loss'}
            value={formatCurrency(trade.stopLoss)}
            valueClass="text-red-500"
          />
          <DetailItem
            label={hasTrails ? 'Original Target' : 'Target Price'}
            value={formatCurrency(trade.targetPrice)}
            valueClass="text-emerald-600"
          />
          <DetailItem
            label={hasTrails ? 'Original R/R' : 'R/R Ratio'}
            value={originalRR ? `${originalRR.rrRatio}R` : '—'}
            valueClass={getRRColor(originalRR?.rrRatio)}
          />
          {trade.quantity != null && (
            <DetailItem
              label="No of Shares"
              value={parseFloat(trade.quantity).toLocaleString('en-IN')}
              valueClass="text-slate-700"
            />
          )}
          {trade.totalValue != null && (
            <DetailItem
              label="Total Value"
              value={formatCurrency(trade.totalValue)}
              valueClass="text-slate-700"
            />
          )}
          {trade.actualExitPrice != null && (
            <DetailItem label="Exit Price" value={formatCurrency(trade.actualExitPrice)} />
          )}
          {trade.setupType && (
            <DetailItem label="Setup Type" value={trade.setupType} valueClass="text-slate-700 font-medium font-sans" />
          )}
          {trade.closedAt && (
            <DetailItem label="Closed At" value={formatDate(trade.closedAt)} valueClass="text-slate-600 font-sans" />
          )}
        </div>

        {trade.notes && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="label-xs mb-2">Notes</p>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{trade.notes}</p>
          </div>
        )}
      </div>

      {/* ── Inline edit form ── */}
      {editOpen && canEdit && (
        <div className="card p-6 border-brand/20">
          <h3 className="section-heading mb-5">Edit Trade</h3>
          <TradeForm mode="edit" defaultValues={trade} onSubmit={handleUpdate} onCancel={() => setEditOpen(false)} canCreate={canEdit} />
        </div>
      )}

      {/* ── Trail history ── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="section-heading">Trail History</h3>
          {canEdit && trade.status === 'OPEN' && (
            <Button size="sm" variant="warning" onClick={() => setTrailModalOpen(true)}>
              + Add Trail Entry
            </Button>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-5">Immutable log of all stop-loss and target adjustments</p>
        <TrailTimeline trails={trails} />
      </div>

      {/* ── Revision history ── */}
      <div className="card p-6">
        <h3 className="section-heading mb-1">Revision History</h3>
        <p className="text-xs text-slate-400 mb-5">All field-level edits</p>
        <RevisionTimeline revisions={revisions} />
      </div>

      {/* ── Add Trail Entry modal ── */}
      <Modal isOpen={trailModalOpen} onClose={() => setTrailModalOpen(false)} title="Add Trail Entry">
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Current active SL: <span className="font-semibold text-red-500 font-data">{formatCurrency(activeSL)}</span>
            &nbsp;·&nbsp;
            Target: <span className="font-semibold text-emerald-600 font-data">{formatCurrency(activeTarget)}</span>
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="New Stop Loss (optional)"
              type="number"
              step="0.01"
              placeholder={activeSL}
              value={trailData.newStopLoss}
              onChange={e => setTrailData(d => ({ ...d, newStopLoss: e.target.value }))}
            />
            <Input
              label="New Target (optional)"
              type="number"
              step="0.01"
              placeholder={activeTarget}
              value={trailData.newTarget}
              onChange={e => setTrailData(d => ({ ...d, newTarget: e.target.value }))}
            />
          </div>

          <Input
            label="Reason"
            placeholder="Price action triggered, breakout confirmed…"
            value={trailData.reason}
            onChange={e => setTrailData(d => ({ ...d, reason: e.target.value }))}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 leading-none">Notes</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 placeholder:text-slate-400 resize-none"
              rows={2}
              placeholder="Additional observations…"
              value={trailData.notes}
              onChange={e => setTrailData(d => ({ ...d, notes: e.target.value }))}
            />
          </div>

          {actionError && <p className="text-sm text-red-500">{actionError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setTrailModalOpen(false)}>Cancel</Button>
            <Button
              variant="warning"
              onClick={handleAddTrail}
              loading={actionLoading}
              disabled={!trailData.newStopLoss && !trailData.newTarget}
            >
              Save Trail Entry
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Close trade modal ── */}
      <Modal isOpen={closeModalOpen} onClose={() => setCloseModalOpen(false)} title="Close Trade">
        <div className="space-y-4">
          <Input
            label="Actual Exit Price"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={closeData.actualExitPrice}
            onChange={e => setCloseData(d => ({ ...d, actualExitPrice: e.target.value }))}
          />
          <Select
            label="Outcome"
            value={closeData.outcome}
            onChange={e => setCloseData(d => ({ ...d, outcome: e.target.value }))}
          >
            <option value="WIN">WIN</option>
            <option value="LOSS">LOSS</option>
            <option value="BREAKEVEN">BREAKEVEN</option>
          </Select>

          {actionError && <p className="text-sm text-red-500">{actionError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCloseModalOpen(false)}>Cancel</Button>
            <Button
              variant="success"
              onClick={handleClose}
              loading={actionLoading}
              disabled={!closeData.actualExitPrice}
            >
              Confirm Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
