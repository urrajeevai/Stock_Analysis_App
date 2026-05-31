import { clsx } from 'clsx'

const variants = {
  primary:
    'bg-brand text-white hover:bg-brand-hover active:scale-[0.97] shadow-brand-sm hover:shadow-brand-md',
  secondary:
    'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] shadow-card',
  danger:
    'bg-red-500 hover:bg-red-600 text-white active:scale-[0.97] shadow-sm',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
  success:
    'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.97] shadow-sm',
  warning:
    'bg-amber-500 hover:bg-amber-600 text-white active:scale-[0.97] shadow-sm',
  outline:
    'border border-brand text-brand hover:bg-brand-light active:scale-[0.97]',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs gap-1.5',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  leftIcon,
  rightIcon,
  children,
  className,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center font-medium rounded-lg transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full shrink-0" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  )
}
