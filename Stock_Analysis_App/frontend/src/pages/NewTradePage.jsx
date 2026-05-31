import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useState } from 'react'
import { BeakerIcon } from '@heroicons/react/24/outline'
import TradeForm from '../components/trades/TradeForm.jsx'
import * as tradesService from '../services/trades.js'

export default function NewTradePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState('')

  const fromAnalysis = location.state?.fromAnalysis ?? null

  const handleSubmit = async (data) => {
    setServerError('')
    try {
      const payload = { ...data }
      if (fromAnalysis?.analysisId) {
        payload.analysisId = fromAnalysis.analysisId
      }
      const res = await tradesService.createTrade(payload)
      navigate(`/trades/${res.data.id}`)
    } catch (err) {
      setServerError(err.response?.data?.message ?? 'Failed to create trade. Please try again.')
      throw err
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="card p-7">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">New Trade</h2>
          <p className="text-sm text-slate-500 mt-0.5">Record your trade setup and key levels</p>
        </div>

        {fromAnalysis && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-brand/5 border border-brand/20 px-4 py-3">
            <BeakerIcon className="h-4 w-4 text-brand shrink-0" />
            <p className="text-sm text-brand">
              Pre-filled from analysis.{' '}
              <Link to={`/analysis/${fromAnalysis.analysisId}`} className="underline font-medium">
                View analysis
              </Link>
            </p>
          </div>
        )}

        {serverError && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-600">{serverError}</p>
          </div>
        )}

        <TradeForm
          mode="create"
          defaultValues={fromAnalysis ?? {}}
          onSubmit={handleSubmit}
          onCancel={() => navigate(fromAnalysis ? `/analysis/${fromAnalysis.analysisId}` : '/trades')}
        />
      </div>
    </div>
  )
}
