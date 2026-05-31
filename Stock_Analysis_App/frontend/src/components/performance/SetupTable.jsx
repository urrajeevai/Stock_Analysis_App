import { formatPercent } from '../../utils/formatters.js'
import { getRRColor } from '../../utils/rrCalculator.js'

export default function SetupTable({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-slate-400 text-center py-10">
        No setup statistics available yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-4 py-3 text-left label-xs">Setup Type</th>
            <th className="px-4 py-3 text-right label-xs">Trades</th>
            <th className="px-4 py-3 text-right label-xs">Wins</th>
            <th className="px-4 py-3 text-right label-xs">Losses</th>
            <th className="px-4 py-3 text-right label-xs">Win Rate</th>
            <th className="px-4 py-3 text-right label-xs">Avg R/R</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row, idx) => {
            const winRate = row.totalTrades > 0 ? (row.winCount / row.totalTrades) * 100 : 0
            return (
              <tr key={row.setupType ?? idx} className="hover:bg-slate-50/80 transition-colors duration-100">
                <td className="px-4 py-3.5">
                  <span className="text-sm font-medium text-slate-800">
                    {row.setupType?.replace(/_/g, ' ') ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right text-sm text-slate-600 font-data">
                  {row.totalTrades ?? 0}
                </td>
                <td className="px-4 py-3.5 text-right text-sm text-emerald-600 font-semibold font-data">
                  {row.winCount ?? 0}
                </td>
                <td className="px-4 py-3.5 text-right text-sm text-red-500 font-semibold font-data">
                  {row.lossCount ?? 0}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className={`text-sm font-semibold font-data ${
                    winRate >= 60 ? 'text-emerald-600'
                      : winRate >= 40 ? 'text-amber-500'
                      : 'text-red-500'
                  }`}>
                    {formatPercent(winRate)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className={`text-sm font-semibold font-data ${getRRColor(row.avgRR)}`}>
                    {row.avgRR != null ? `${parseFloat(row.avgRR).toFixed(2)}R` : '—'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
