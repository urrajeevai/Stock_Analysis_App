import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { formatDate } from '../../utils/formatters.js'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{formatDate(label)}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          Strike Rate: {p.value}%
        </p>
      ))}
      {payload[0]?.payload?.totalTrades != null && (
        <p className="text-slate-400 mt-1">{payload[0].payload.totalTrades} trades</p>
      )}
    </div>
  )
}

export default function StrikeRateChart({ data = [], periodMode = 'weekly' }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="periodStart"
          tickFormatter={v => {
            try {
              const d = new Date(v)
              return periodMode === 'monthly'
                ? d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
                : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
            } catch {
              return v
            }
          }}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={v => `${v}%`}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={50} stroke="#e2e8f0" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="strikeRate"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ fill: '#6366f1', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
