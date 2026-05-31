import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { formatCurrency } from '../../utils/formatters.js'

function weekLabel(periodStart) {
  if (!periodStart) return ''
  const d = new Date(periodStart)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-600 mb-1">Week of {label}</p>
      <p className={`font-bold font-data text-sm ${val >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {val >= 0 ? '+' : ''}{formatCurrency(val)}
      </p>
    </div>
  )
}

export default function WeeklyNetPLChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No weekly data yet
      </div>
    )
  }

  const chartData = [...data]
    .sort((a, b) => new Date(a.periodStart) - new Date(b.periodStart))
    .slice(-8)
    .map(d => ({
      label: weekLabel(d.periodStart),
      netPL: parseFloat(d.totalPL ?? 0),
    }))

  const allPositive = chartData.every(d => d.netPL >= 0)
  const allNegative = chartData.every(d => d.netPL <= 0)
  const gradientColor = allPositive ? '#10b981' : allNegative ? '#ef4444' : '#6366f1'

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="netPLGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={gradientColor} stopOpacity={0.2} />
            <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `₹${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#e2e8f0" strokeDasharray="4 2" />
        <Area
          type="monotone"
          dataKey="netPL"
          stroke={gradientColor}
          strokeWidth={2}
          fill="url(#netPLGrad)"
          dot={{ r: 3, fill: gradientColor, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
