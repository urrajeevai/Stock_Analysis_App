import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { formatCurrency } from '../../utils/formatters.js'

function monthLabel(periodStart) {
  if (!periodStart) return ''
  const d = new Date(periodStart)
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-semibold font-data" style={{ color: p.color }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center gap-2">
          <span className="text-slate-500">Net P/L:</span>
          <span className={`font-semibold font-data ${
            (payload[0]?.value ?? 0) - (payload[1]?.value ?? 0) >= 0
              ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {formatCurrency((payload[0]?.value ?? 0) - (payload[1]?.value ?? 0))}
          </span>
        </div>
      )}
    </div>
  )
}

export default function MonthlyPLChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No closed trades yet
      </div>
    )
  }

  const chartData = [...data]
    .sort((a, b) => new Date(a.periodStart) - new Date(b.periodStart))
    .slice(-6)
    .map(d => ({
      label: monthLabel(d.periodStart),
      profit: parseFloat(d.totalProfitAmount ?? 0),
      loss: parseFloat(d.totalLossAmount ?? 0),
    }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `₹${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <ReferenceLine y={0} stroke="#e2e8f0" />
        <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[3, 3, 0, 0]} />
        <Bar dataKey="loss" name="Loss" fill="#ef4444" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
