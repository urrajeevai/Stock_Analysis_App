import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { calculateRR, getRRColor } from '../../utils/rrCalculator.js'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'
import StockSearchCombobox from '../analysis/StockSearchCombobox.jsx'

export default function TradeForm({ onSubmit, onCancel, defaultValues = {}, mode = 'create', canCreate = true }) {
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      stockId: defaultValues.stockId || '',
      ticker: defaultValues.ticker || '',
      direction: defaultValues.direction || 'LONG',
      entryPrice: defaultValues.entryPrice || '',
      stopLoss: defaultValues.stopLoss || '',
      targetPrice: defaultValues.targetPrice || '',
      quantity: defaultValues.quantity || '',
      setupType: defaultValues.setupType || '',
      notes: defaultValues.notes || '',
    }
  })

  const [direction, entryPrice, stopLoss, targetPrice] = watch(['direction', 'entryPrice', 'stopLoss', 'targetPrice'])
  const rrResult = calculateRR({ direction, entryPrice, stopLoss, target: targetPrice })

  const handleStockSelect = (sel) => {
    if (sel) {
      setValue('stockId', sel.stockId)
      setValue('ticker', sel.symbol)
    } else {
      setValue('stockId', '')
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

  return (
    <form onSubmit={handleSubmit(doSubmit)} className="space-y-5">
      {/* Stock search combobox */}
      <StockSearchCombobox
        initialValue={defaultValues.ticker || ''}
        onChange={handleStockSelect}
        canCreate={canCreate}
      />
      <input type="hidden" {...register('stockId')} />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Ticker Symbol"
          placeholder="RELIANCE.NS"
          error={errors.ticker?.message}
          {...register('ticker', { required: 'Ticker is required' })}
        />
        <Select
          label="Direction"
          error={errors.direction?.message}
          {...register('direction', { required: true })}
        >
          <option value="LONG">LONG ↑</option>
          <option value="SHORT">SHORT ↓</option>
        </Select>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Entry Price"
          type="number"
          step="0.01"
          placeholder="1500.00"
          error={errors.entryPrice?.message}
          {...register('entryPrice', { required: 'Required', valueAsNumber: true })}
        />
        <Input
          label="Stop Loss"
          type="number"
          step="0.01"
          placeholder="1450.00"
          error={errors.stopLoss?.message}
          {...register('stopLoss', { required: 'Required', valueAsNumber: true })}
        />
        <Input
          label="Target"
          type="number"
          step="0.01"
          placeholder="1620.00"
          error={errors.targetPrice?.message}
          {...register('targetPrice', { required: 'Required', valueAsNumber: true })}
        />
      </div>

      <Input
        label="Quantity"
        type="number"
        step="1"
        placeholder="1"
        error={errors.quantity?.message}
        {...register('quantity', { valueAsNumber: true, min: { value: 0.0001, message: 'Must be positive' } })}
      />

      {/* Live R/R display */}
      {rrResult && (
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="label-xs mb-1.5">Risk</p>
            <p className="text-sm font-semibold text-red-500 font-data">
              ₹{rrResult.risk.toFixed(2)}
              <span className="text-xs font-normal text-red-400 ml-1">({rrResult.riskPct}%)</span>
            </p>
          </div>
          <div>
            <p className="label-xs mb-1.5">Reward</p>
            <p className="text-sm font-semibold text-emerald-600 font-data">
              ₹{rrResult.reward.toFixed(2)}
              <span className="text-xs font-normal text-emerald-400 ml-1">({rrResult.rewardPct}%)</span>
            </p>
          </div>
          <div>
            <p className="label-xs mb-1.5">R/R Ratio</p>
            <p className={`text-sm font-bold font-data ${getRRColor(rrResult.rrRatio)}`}>
              {rrResult.rrRatio}:1
            </p>
          </div>
        </div>
      )}

      <Input
        label="Setup Type"
        placeholder="BREAKOUT, PULLBACK, REVERSAL…"
        {...register('setupType')}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700 leading-none">Notes</label>
        <textarea
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 placeholder:text-slate-400 hover:border-slate-300 resize-none"
          rows={3}
          placeholder="Trade rationale, market conditions, observations…"
          {...register('notes')}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 justify-center">
          Cancel
        </Button>
        <Button type="submit" loading={submitting} className="flex-1 justify-center">
          {mode === 'create' ? 'Create Trade' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
