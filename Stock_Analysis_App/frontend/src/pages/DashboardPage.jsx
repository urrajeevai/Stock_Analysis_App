import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ChartBarIcon,
  PlusIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext.jsx'
import MetricsCard from '../components/performance/MetricsCard.jsx'
import TradeTable from '../components/trades/TradeTable.jsx'
import AlertList from '../components/alerts/AlertList.jsx'
import WinLossChart from '../components/performance/WinLossChart.jsx'
import MonthlyPLChart from '../components/dashboard/MonthlyPLChart.jsx'
import WeeklyNetPLChart from '../components/dashboard/WeeklyNetPLChart.jsx'
import TopTradesTable from '../components/dashboard/TopTradesTable.jsx'
import PLTradeListPanel from '../components/dashboard/PLTradeListPanel.jsx'
import Button from '../components/ui/Button.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import * as performanceService from '../services/performance.js'
import * as tradesService from '../services/trades.js'
import * as alertsService from '../services/alerts.js'
import { formatCurrency } from '../utils/formatters.js'

function SectionHeader({ title, action, actionLabel }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="section-heading">{title}</h2>
      {action && (
        <button
          onClick={action}
          className="text-xs font-medium text-brand hover:text-brand-hover transition-colors flex items-center gap-0.5"
        >
          {actionLabel ?? 'View all'}
          <span aria-hidden>→</span>
        </button>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function ClickableMetricsCard({ title, value, subtitle, icon, accent, valueColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-xl"
    >
      <MetricsCard
        title={title}
        value={value}
        subtitle={subtitle}
        icon={icon}
        accent={accent}
        valueColor={valueColor}
      />
    </button>
  )
}

export default function DashboardPage() {
  const { user, isAdmin, isTrader } = useAuth()
  const navigate = useNavigate()

  const [summary, setSummary] = useState(null)
  const [plSummary, setPLSummary] = useState(null)
  const [openTrades, setOpenTrades] = useState([])
  const [monthly, setMonthly] = useState([])
  const [weekly, setWeekly] = useState([])
  const [allTrades, setAllTrades] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedPanel, setExpandedPanel] = useState(null) // 'PROFIT' | 'LOSS' | null

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [summaryRes, plRes, tradesRes, alertsRes, monthlyRes, weeklyRes, allTradesRes] =
        await Promise.allSettled([
          performanceService.getSummary(),
          tradesService.getPLSummary(),
          tradesService.getOpenTrades(),
          alertsService.getUnacknowledged(),
          performanceService.getMonthly(),
          performanceService.getWeekly(),
          tradesService.getPLDetail({ months: 3, type: 'ALL' }),
        ])

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data)
      if (plRes.status === 'fulfilled') setPLSummary(plRes.value.data)
      if (tradesRes.status === 'fulfilled') {
        const d = tradesRes.value.data
        setOpenTrades((Array.isArray(d) ? d : d.content ?? []).slice(0, 5))
      }
      if (alertsRes.status === 'fulfilled') {
        const d = alertsRes.value.data
        setAlerts((Array.isArray(d) ? d : d.content ?? []).slice(0, 3))
      }
      if (monthlyRes.status === 'fulfilled') setMonthly(monthlyRes.value.data ?? [])
      if (weeklyRes.status === 'fulfilled') setWeekly(weeklyRes.value.data ?? [])
      if (allTradesRes.status === 'fulfilled') {
        setAllTrades(Array.isArray(allTradesRes.value.data) ? allTradesRes.value.data : [])
      }

      setLoading(false)
    }
    loadData()
  }, [])

  const firstName = user?.name?.split(' ')[0] ?? user?.username ?? 'Trader'

  const netPL = plSummary?.netPL ?? 0
  const netPositive = parseFloat(netPL) >= 0

  const top5Profit = [...allTrades]
    .filter(t => t.plAmount != null && t.plAmount > 0)
    .sort((a, b) => b.plAmount - a.plAmount)
    .slice(0, 5)

  const top5Loss = [...allTrades]
    .filter(t => t.plAmount != null && t.plAmount < 0)
    .sort((a, b) => a.plAmount - b.plAmount)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-sm text-slate-400">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">

      {/* Greeting */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {(isAdmin || isTrader) && (
          <div className="flex gap-2">
            <Button onClick={() => navigate('/trades/new')} size="sm" leftIcon={<PlusIcon className="h-3.5 w-3.5" />}>
              New Trade
            </Button>
            <Button onClick={() => navigate('/analysis/new')} size="sm" variant="secondary" leftIcon={<DocumentChartBarIcon className="h-3.5 w-3.5" />}>
              New Analysis
            </Button>
          </div>
        )}
      </div>

      {/* ── P/L Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricsCard
          title="Total Trades"
          value={plSummary?.totalClosedTrades ?? summary?.totalTrades ?? 0}
          subtitle="Closed all time"
          icon={ChartBarIcon}
          accent="brand"
        />
        <ClickableMetricsCard
          title="Profit Trades"
          value={plSummary?.profitTradeCount ?? 0}
          subtitle="Click to view"
          icon={ArrowTrendingUpIcon}
          accent="success"
          valueColor="text-emerald-600"
          onClick={() => setExpandedPanel(p => p === 'PROFIT' ? null : 'PROFIT')}
        />
        <ClickableMetricsCard
          title="Loss Trades"
          value={plSummary?.lossTradeCount ?? 0}
          subtitle="Click to view"
          icon={ArrowTrendingDownIcon}
          accent="danger"
          valueColor="text-red-500"
          onClick={() => setExpandedPanel(p => p === 'LOSS' ? null : 'LOSS')}
        />
        <MetricsCard
          title="Total Profit (1M)"
          value={formatCurrency(plSummary?.totalProfitAmount ?? 0)}
          subtitle={`${plSummary?.periodStart ?? ''} – ${plSummary?.periodEnd ?? ''}`}
          icon={BanknotesIcon}
          accent="success"
          valueColor="text-emerald-600"
        />
        <MetricsCard
          title="Total Loss (1M)"
          value={formatCurrency(plSummary?.totalLossAmount ?? 0)}
          subtitle="Last 1 month"
          icon={ArrowTrendingDownIcon}
          accent="danger"
          valueColor="text-red-500"
        />
        <MetricsCard
          title="Net P/L (1M)"
          value={`${netPositive ? '+' : ''}${formatCurrency(netPL)}`}
          subtitle="Profit − Loss"
          icon={ArrowPathIcon}
          accent={netPositive ? 'success' : 'danger'}
          valueColor={netPositive ? 'text-emerald-600' : 'text-red-500'}
        />
      </div>

      {/* ── Expandable P/L list panels ── */}
      {expandedPanel && (
        <PLTradeListPanel
          type={expandedPanel}
          onClose={() => setExpandedPanel(null)}
        />
      )}

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5">
          <h3 className="section-heading mb-1">Monthly Profit vs Loss</h3>
          <p className="text-xs text-slate-400 mb-4">Last 6 months closed trade P/L</p>
          <MonthlyPLChart data={monthly} />
        </div>
        <div className="card p-5">
          <h3 className="section-heading mb-1">Win / Loss Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">All closed trades</p>
          <WinLossChart data={summary} />
        </div>
      </div>

      {/* ── Weekly P/L trend ── */}
      <div className="card p-5">
        <h3 className="section-heading mb-1">Weekly Net P/L Trend</h3>
        <p className="text-xs text-slate-400 mb-4">Last 8 weeks</p>
        <WeeklyNetPLChart data={weekly} />
      </div>

      {/* ── Top trades ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <TopTradesTable
            trades={top5Profit}
            title="Top 5 Profitable Trades (3 months)"
            emptyText="No profitable closed trades in the last 3 months"
            variant="profit"
          />
        </div>
        <div className="card p-5">
          <TopTradesTable
            trades={top5Loss}
            title="Top 5 Losing Trades (3 months)"
            emptyText="No losing closed trades in the last 3 months"
            variant="loss"
          />
        </div>
      </div>

      {/* ── Open trades ── */}
      <section>
        <SectionHeader
          title="Open Trades"
          action={() => navigate('/trades')}
          actionLabel="View all"
        />
        <TradeTable
          trades={openTrades}
          loading={false}
          onRowClick={(id) => navigate(`/trades/${id}`)}
          canCreate={isAdmin || isTrader}
          onNewTrade={() => navigate('/trades/new')}
        />
      </section>

      {/* ── Recent alerts ── */}
      {alerts.length > 0 && (
        <section>
          <SectionHeader
            title="Recent Alerts"
            action={() => navigate('/alerts')}
            actionLabel="View all"
          />
          <AlertList
            alerts={alerts}
            loading={false}
            canAcknowledge={isAdmin || isTrader}
            onAcknowledge={async (id) => {
              await alertsService.acknowledgeAlert(id)
              setAlerts(prev => prev.filter(a => a.id !== id))
            }}
          />
        </section>
      )}
    </div>
  )
}
