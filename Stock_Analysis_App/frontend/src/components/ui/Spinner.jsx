import { clsx } from 'clsx'

export default function Spinner({ size = 'md', className = '' }) {
  const s = size === 'xs' ? 'h-3 w-3 border-[1.5px]'
    : size === 'sm' ? 'h-4 w-4 border-2'
    : size === 'lg' ? 'h-8 w-8 border-[3px]'
    : 'h-5 w-5 border-2'

  return (
    <div
      aria-label="Loading"
      role="status"
      className={clsx(
        'animate-spin rounded-full border-slate-200 border-t-brand',
        s,
        className
      )}
    />
  )
}
