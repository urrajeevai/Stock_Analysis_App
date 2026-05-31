import { forwardRef } from 'react'
import { clsx } from 'clsx'

const Select = forwardRef(({ label, error, hint, children, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-medium text-slate-700 leading-none">{label}</label>
    )}
    <select
      ref={ref}
      className={clsx(
        'w-full rounded-lg border px-3 py-2 text-sm text-slate-900 bg-white transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
        'appearance-none cursor-pointer',
        error
          ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
          : 'border-slate-200 hover:border-slate-300',
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-xs text-red-500 leading-none">{error}</p>}
    {hint && !error && <p className="text-xs text-slate-400 leading-none">{hint}</p>}
  </div>
))

Select.displayName = 'Select'
export default Select
