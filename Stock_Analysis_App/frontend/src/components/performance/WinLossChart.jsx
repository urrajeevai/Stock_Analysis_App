import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = {
  wins: '#10b981',
  losses: '#ef4444',
  breakeven: '#f59e0b',
}

export default function WinLossChart({ data }) {
  if (!data) return null

  const { winCount = 0, lossCount = 0, breakevenCount = 0 } = data

  const chartData = [
    { name: 'Wins', value: winCount, color: COLORS.wins },
    { name: 'Losses', value: lossCount, color: COLORS.losses },
    { name: 'Breakeven', value: breakevenCount, color: COLORS.breakeven },
  ].filter(d => d.value > 0)

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No closed trades yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [value, name]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
