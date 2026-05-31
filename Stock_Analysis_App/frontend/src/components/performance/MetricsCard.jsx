import { clsx } from 'clsx'

const accentColors = {
  default: { bg: 'bg-slate-50', icon: 'text-slate-400', border: 'border-slate-100' },
  brand:   { bg: 'bg-brand-50', icon: 'text-brand', border: 'border-brand-100' },
  success: { bg: 'bg-emerald-50', icon: 'text-emerald-500', border: 'border-emerald-100' },
  danger:  { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-100' },
  warning: { bg: 'bg-amber-50', icon: 'text-amber-500', border: 'border-amber-100' },
}

export default function MetricsCard({
  title,
  value,
  subtitle,
  valueColor,
  icon: Icon,
  accent = 'default',
  trend,
  trendLabel,
}) {
  const colors = accentColors[accent] ?? accentColors.default

  return (
    <div className="card card-hover p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <p className="label-xs leading-none">{title}</p>
        {Icon && (
          <div className={clsx('flex items-center justify-center h-8 w-8 rounded-lg flex-shrink-0', colors.bg, `border ${colors.border}`)}>
            <Icon className={clsx('h-4 w-4', colors.icon)} />
          </div>
        )}
      </div>

      <div>
        <p className={clsx('text-2xl font-bold tracking-tight leading-none font-data', valueColor ?? 'text-slate-900')}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1.5 leading-none">{subtitle}</p>
        )}
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <span className={clsx(
            'flex items-center gap-0.5',
            trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-slate-400'
          )}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'}
            {trend !== 0 && `${Math.abs(trend)}%`}
          </span>
          {trendLabel && <span className="text-slate-400">{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}
