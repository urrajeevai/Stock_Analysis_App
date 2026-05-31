export function calculateRR({ direction, entryPrice, stopLoss, target }) {
  const e = parseFloat(entryPrice)
  const sl = parseFloat(stopLoss)
  const t = parseFloat(target)
  if ([e, sl, t].some(v => isNaN(v) || v <= 0)) return null
  let risk, reward
  if (direction === 'LONG') {
    if (!(sl < e && e < t)) return null
    risk = e - sl
    reward = t - e
  } else {
    if (!(t < e && e < sl)) return null
    risk = sl - e
    reward = e - t
  }
  return {
    risk: parseFloat(risk.toFixed(4)),
    reward: parseFloat(reward.toFixed(4)),
    rrRatio: parseFloat((reward / risk).toFixed(2)),
    riskPct: parseFloat(((risk / e) * 100).toFixed(2)),
    rewardPct: parseFloat(((reward / e) * 100).toFixed(2)),
  }
}

export function getRRColor(rrRatio) {
  if (rrRatio == null) return 'text-gray-400'
  if (rrRatio >= 3.0) return 'text-emerald-500'
  if (rrRatio >= 2.0) return 'text-lime-500'
  if (rrRatio >= 1.0) return 'text-amber-500'
  return 'text-red-500'
}
