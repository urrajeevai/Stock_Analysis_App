import { useState } from 'react'
import {
  ArrowTrendingUpIcon,
  TrophyIcon,
  ScaleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { usePerformance } from '../hooks/usePerformance.js'
import MetricsCard from '../components/performance/MetricsCard.jsx'
import WinLossChart from '../components/performance/WinLossChart.jsx'
import StrikeRateChart from '../components/performance/StrikeRateChart.jsx'
import RRChart from '../components/performance/RRChart.jsx'
import SetupTable from '../components/performance/SetupTable.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import Button from '../components/ui/Button.jsx'
import { formatPercent } from '../utils/formatters.js'

export default function PerformancePage() {
  const { summary, weekly, monthly, bestSetups, loading, error, refetch } = usePerformance()
  const [periodMode, setPeriodMode] = useState('weekly')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-sm text-slate-400">Loading performance data…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card px-5 py-4 flex items-center gap-4 text-sm text-red-600">
        <span>{error}</span>
        <Button variant="ghost" size="sm" onClick={refetch}>Retry</Button>
      </div>
    )
  }

  const periodData = periodMode === 'monthly' ? monthly : weekly
  const bestSetup = bestSetups.length > 0 ? bestSetups[0]?.setupType : '—'

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricsCard
          title="Total Trades"
          value={summary?.totalTrades ?? 0}
          subtitle="Closed trades"
          icon={ArrowTrendingUpIcon}
          accent="brand"
        />
        <MetricsCard
          title="Win Rate"
          value={formatPercent(summary?.winRate ?? 0)}
          subtitle={`${summary?.winCount ?? 0}W · ${summary?.lossCount ?? 0}L`}
          icon={TrophyIcon}
          accent={(summary?.winRate ?? 0) >= 50 ? 'success' : 'danger'}
          valueColor={(summary?.winRate ?? 0) >= 50 ? 'text-emerald-600' : 'text-red-500'}
        />
        <MetricsCard
          title="Avg R/R"
          value={summary?.avgRR != null ? `${parseFloat(summary.avgRR).toFixed(2)}R` : '—'}
          subtitle="Risk-reward ratio"
          icon={ScaleIcon}
          accent={(summary?.avgRR ?? 0) >= 2 ? 'success' : 'warning'}
          valueColor={(summary?.avgRR ?? 0) >= 2 ? 'text-emerald-600' : 'text-amber-500'}
        />
        <MetricsCard
          title="Best Setup"
          value={bestSetup}
          subtitle={
            bestSetups.length > 0 && bestSetups[0]?.winRate != null
              ? `${formatPercent(bestSetups[0].winRate)} win rate`
              : undefined
          }
          icon={SparklesIcon}
          accent="warning"
        />
      </div>

      {/* Period toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-medium">Time period:</span>
        <div className="segmented-control">
          {['weekly', 'monthly'].map(mode => (
            <button
              key={mode}
              onClick={() => setPeriodMode(mode)}
              className={`segmented-btn capitalize ${
                periodMode === mode ? 'segmented-btn-active' : 'segmented-btn-inactive'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="section-heading mb-1">Win / Loss Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">Overall outcome distribution</p>
          <WinLossChart data={summary} />
        </div>
        <div className="card p-5">
          <h3 className="section-heading mb-1">Strike Rate</h3>
          <p className="text-xs text-slate-400 mb-4 capitalize">{periodMode} win rate trend</p>
          <StrikeRateChart data={periodData} periodMode={periodMode} />
        </div>
      </div>

      {/* R/R by setup */}
      <div className="card p-5">
        <h3 className="section-heading mb-1">Avg R/R by Setup Type</h3>
        <p className="text-xs text-slate-400 mb-4">Which setups deliver the best risk-reward</p>
        <RRChart data={bestSetups} />
      </div>

      {/* Setup table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="section-heading">Setup Performance</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by win rate</p>
          </div>
        </div>
        <SetupTable data={bestSetups} />
      </div>
    </div>
  )
}
