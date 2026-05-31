import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'
import ChartImageSlot from './ChartImageSlot.jsx'
import StockSearchCombobox from './StockSearchCombobox.jsx'

const SETUP_TYPES = [
  'BREAKOUT', 'PULLBACK', 'REVERSAL', 'MOMENTUM',
  'RANGE_BREAKOUT', 'SUPPORT_BOUNCE', 'RESISTANCE_REJECTION', 'GAP_FILL', 'OTHER',
]

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '2H', '4H', 'Daily', 'Weekly', 'Monthly']

function calcRR(direction, stockPrice, riskPrice, rewardPrice) {
  const sp = parseFloat(stockPrice)
  const rp = parseFloat(riskPrice)
  const rwp = parseFloat(rewardPrice)
  if (!sp || !rp || !rwp || sp <= 0 || !direction) return null

  let riskAmt, rewardAmt
  if (direction === 'LONG') {
    riskAmt   = sp - rp
    rewardAmt = rwp - sp
  } else {
    riskAmt   = rp - sp
    rewardAmt = sp - rwp
  }
  if (riskAmt <= 0 || rewardAmt <= 0) return null

  const riskPct   = (riskAmt / sp) * 100
  const rewardPct = (rewardAmt / sp) * 100
  const rrRatio   = rewardAmt / riskAmt
  const buyDecision = rrRatio > 2 ? 'YES' : 'NO'
  return { riskAmt, rewardAmt, riskPct, rewardPct, rrRatio, buyDecision }
}

// ── Main Form ─────────────────────────────────────────────────────────────────
export default function AnalysisForm({
  onSubmit,
  onCancel,
  defaultValues = {},
  mode = 'create',
  analysisId = null,
  onImageUpdated,
  canEdit = true,
}) {
  const [submitting, setSubmitting] = useState(false)
  const [liveRR, setLiveRR] = useState(null)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      stockId:           defaultValues.stockId || '',
      ticker:            defaultValues.ticker || '',
      setupType:         defaultValues.setupType || '',
      expectedDirection: defaultValues.expectedDirection || 'LONG',
      thesis:            defaultValues.thesis || '',
      analysisDate:      defaultValues.analysisDate || new Date().toISOString().split('T')[0],
      stockPrice:        defaultValues.stockPrice || '',
      riskPrice:         defaultValues.riskPrice || '',
      rewardPrice:       defaultValues.rewardPrice || '',
      timeframe:         defaultValues.timeframe || '',
    }
  })

  const [direction, stockPrice, riskPrice, rewardPrice] =
    watch(['expectedDirection', 'stockPrice', 'riskPrice', 'rewardPrice'])

  useEffect(() => {
    setLiveRR(calcRR(direction, stockPrice, riskPrice, rewardPrice))
  }, [direction, stockPrice, riskPrice, rewardPrice])

  const handleStockSelect = (sel) => {
    if (sel) {
      setValue('stockId', sel.stockId)
      setValue('ticker', sel.symbol)   // auto-fill ticker; user can still override below
    } else {
      setValue('stockId', null)
    }
  }

  const doSubmit = async (data) => {
    setSubmitting(true)
    try {
      await onSubmit({ ...data, stockId: data.stockId ? Number(data.stockId) : null })
    } finally {
      setSubmitting(false)
    }
  }

  // current image URLs from server (defaultValues carries them after save)
  const imageUrls = [
    defaultValues.chartImage1Url,
    defaultValues.chartImage2Url,
    defaultValues.chartImage3Url,
    defaultValues.chartImage4Url,
  ]

  return (
    <form onSubmit={handleSubmit(doSubmit)} className="space-y-5">
      {/* ── Stock search ── */}
      <StockSearchCombobox
        initialValue={defaultValues.ticker || ''}
        onChange={handleStockSelect}
        canCreate={canEdit}
      />
      <input type="hidden" {...register('stockId')} />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Ticker Symbol"
          placeholder="RELIANCE.NS"
          error={errors.ticker?.message}
          {...register('ticker', { required: 'Ticker is required' })}
        />
        <Input
          label="Analysis Date"
          type="date"
          error={errors.analysisDate?.message}
          {...register('analysisDate', { required: 'Date is required' })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label="Setup Type" {...register('setupType')}>
          <option value="">Select setup</option>
          {SETUP_TYPES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </Select>
        <Select label="Expected Direction" {...register('expectedDirection')}>
          <option value="LONG">LONG ↑</option>
          <option value="SHORT">SHORT ↓</option>
        </Select>
      </div>

      {/* ── Price levels ── */}
      <div className="border-t border-slate-100 pt-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Price Levels</p>
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Stock Price"
            type="number"
            step="0.01"
            placeholder="1500.00"
            {...register('stockPrice', { valueAsNumber: true })}
          />
          <Input
            label="Risk Price (SL)"
            type="number"
            step="0.01"
            placeholder="1450.00"
            {...register('riskPrice', { valueAsNumber: true })}
          />
          <Input
            label="Reward Price (Target)"
            type="number"
            step="0.01"
            placeholder="1620.00"
            {...register('rewardPrice', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* ── Live R/R preview ── */}
      {liveRR && (
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
          <div className="grid grid-cols-3 gap-4 text-center mb-3">
            <div>
              <p className="label-xs mb-1.5">Risk Amount</p>
              <p className="text-sm font-semibold text-red-500 font-data">
                ₹{liveRR.riskAmt.toFixed(2)}
                <span className="text-xs font-normal text-red-400 ml-1">({liveRR.riskPct.toFixed(2)}%)</span>
              </p>
            </div>
            <div>
              <p className="label-xs mb-1.5">Reward Amount</p>
              <p className="text-sm font-semibold text-emerald-600 font-data">
                ₹{liveRR.rewardAmt.toFixed(2)}
                <span className="text-xs font-normal text-emerald-400 ml-1">({liveRR.rewardPct.toFixed(2)}%)</span>
              </p>
            </div>
            <div>
              <p className="label-xs mb-1.5">R/R Ratio</p>
              <p className={`text-sm font-bold font-data ${liveRR.rrRatio >= 3 ? 'text-emerald-500' : liveRR.rrRatio >= 2 ? 'text-lime-500' : liveRR.rrRatio >= 1 ? 'text-amber-500' : 'text-red-500'}`}>
                {liveRR.rrRatio.toFixed(2)}:1
              </p>
            </div>
          </div>
          <div className="text-center">
            <p className="label-xs mb-1.5">Buy Decision</p>
            <span className={`inline-flex items-center gap-1 text-sm font-bold px-4 py-1 rounded-full ${
              liveRR.buyDecision === 'YES'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-600'
            }`}>
              {liveRR.buyDecision === 'YES' ? '✓' : '✗'} {liveRR.buyDecision}
            </span>
          </div>
        </div>
      )}

      {/* ── Timeframe & Thesis ── */}
      <div className="grid grid-cols-2 gap-4">
        <Select label="Timeframe" {...register('timeframe')}>
          <option value="">Select timeframe</option>
          {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        <div /> {/* spacer */}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700 leading-none">Thesis</label>
        <textarea
          rows={5}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 placeholder:text-slate-400 hover:border-slate-300 resize-none leading-relaxed"
          placeholder="Your analysis rationale, key levels, market context, setup description…"
          {...register('thesis')}
        />
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 justify-center">
          Cancel
        </Button>
        <Button type="submit" loading={submitting} className="flex-1 justify-center">
          {mode === 'create' ? 'Save Analysis' : 'Update Analysis'}
        </Button>
      </div>

      {/* ── Chart Images (only when analysisId known) ── */}
      {(analysisId || mode === 'edit') && (
        <div className="border-t border-slate-100 pt-5">
          <p className="text-sm font-semibold text-slate-700 mb-1">Chart Images</p>
          <p className="text-xs text-slate-400 mb-4">Click to browse · drag an image onto a slot · or click a slot then Ctrl+V / ⌘V to paste</p>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(slot => (
              <ChartImageSlot
                key={slot}
                slot={slot}
                currentUrl={imageUrls[slot - 1]}
                analysisId={analysisId}
                canEdit={canEdit}
                onUpdated={onImageUpdated ?? (() => {})}
              />
            ))}
          </div>
        </div>
      )}
    </form>
  )
}
