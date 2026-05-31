import { clsx } from 'clsx'

const variants = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  danger:  'bg-red-50 text-red-600 ring-1 ring-red-200/60',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  info:    'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/60',
  purple:  'bg-purple-50 text-purple-700 ring-1 ring-purple-200/60',
  brand:   'bg-brand-50 text-brand ring-1 ring-brand-200/60',
}

const dotColors = {
  success: 'bg-emerald-500',
  danger:  'bg-red-500',
  warning: 'bg-amber-500',
  info:    'bg-blue-500',
  neutral: 'bg-slate-400',
  purple:  'bg-purple-500',
  brand:   'bg-brand',
}

export default function Badge({ variant = 'neutral', size = 'sm', dot = false, children, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        variants[variant],
        className
      )}
    >
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  )
}
