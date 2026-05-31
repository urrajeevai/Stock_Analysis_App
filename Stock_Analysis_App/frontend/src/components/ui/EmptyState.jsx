function InboxIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#f1f5f9"/>
      <path d="M10 24h4l2.5-3h7l2.5 3H30M10 24v4a1 1 0 001 1h18a1 1 0 001-1v-4M10 24l3-8h14l3 8" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function TradeIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#f1f5f9"/>
      <path d="M13 27l5-5 4 4 5-7" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="27" cy="19" r="1.5" fill="#94a3b8"/>
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#f1f5f9"/>
      <path d="M20 13v1M20 26v1M14 20h-1M27 20h-1M15.5 15.5l.7.7M23.8 23.8l.7.7M15.5 24.5l.7-.7M23.8 16.2l.7-.7" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="20" cy="20" r="4" stroke="#94a3b8" strokeWidth="1.5"/>
    </svg>
  )
}

const icons = {
  inbox: InboxIcon,
  trade: TradeIcon,
  alert: AlertIcon,
}

export default function EmptyState({ title, description, action, icon = 'inbox' }) {
  const Icon = icons[icon] ?? InboxIcon

  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
      <div className="mb-4">
        <Icon />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 mb-5 max-w-xs leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  )
}
