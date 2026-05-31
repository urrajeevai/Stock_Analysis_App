import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import AnalysisForm from '../components/analysis/AnalysisForm.jsx'
import * as analysisService from '../services/analysis.js'

export default function NewAnalysisPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const handleSubmit = async (data) => {
    setServerError('')
    try {
      const res = await analysisService.createAnalysis(data)
      navigate(`/analysis/${res.data.id}`)
    } catch (err) {
      setServerError(err.response?.data?.message ?? 'Failed to create analysis. Please try again.')
      throw err
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="card p-7">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">New Analysis</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Record price levels, thesis and timeframe — chart images can be added after saving
          </p>
        </div>

        {serverError && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-600">{serverError}</p>
          </div>
        )}

        <AnalysisForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/analysis')}
        />
      </div>
    </div>
  )
}
