import { useLocation, useNavigate } from 'react-router-dom'
import { Bars3Icon, BellIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAlerts } from '../../hooks/useAlerts.js'

const breadcrumbs = {
  '/dashboard':    [{ label: 'Dashboard' }],
  '/trades':       [{ label: 'Trades' }],
  '/trades/new':   [{ label: 'Trades', to: '/trades' }, { label: 'New Trade' }],
  '/analysis':     [{ label: 'Analysis' }],
  '/analysis/new': [{ label: 'Analysis', to: '/analysis' }, { label: 'New Analysis' }],
  '/performance':  [{ label: 'Performance' }],
  '/alerts':       [{ label: 'Alerts' }],
  '/stocks':       [{ label: 'Stocks' }],
  '/roles':        [{ label: 'Roles' }],
  '/admin':        [{ label: 'Users' }],
}

function getBreadcrumbs(pathname) {
  if (breadcrumbs[pathname]) return breadcrumbs[pathname]
  if (pathname.startsWith('/trades/')) return [{ label: 'Trades', to: '/trades' }, { label: 'Trade Detail' }]
  if (pathname.startsWith('/analysis/')) return [{ label: 'Analysis', to: '/analysis' }, { label: 'Analysis Detail' }]
  return [{ label: 'StockTrack' }]
}

export default function Topbar({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { alerts } = useAlerts()

  const crumbs = getBreadcrumbs(location.pathname)
  const unreadCount = alerts.length

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.username
      ? user.username.slice(0, 2).toUpperCase()
      : 'U'

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-3 shrink-0">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        aria-label="Open menu"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* Breadcrumb */}
      <nav className="flex-1 flex items-center gap-1.5 text-sm min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRightIcon className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
            {crumb.to ? (
              <button
                onClick={() => navigate(crumb.to)}
                className="text-slate-500 hover:text-slate-700 transition-colors truncate"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="font-semibold text-slate-800 truncate">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Alerts bell */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Alerts"
        >
          <BellIcon className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* User avatar */}
        <div className="h-7 w-7 rounded-full bg-brand flex items-center justify-center ml-1">
          <span className="text-[10px] font-bold text-white leading-none">{initials}</span>
        </div>
      </div>
    </header>
  )
}
