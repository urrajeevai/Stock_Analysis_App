import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  ArrowTrendingUpIcon,
  DocumentChartBarIcon,
  ChartBarSquareIcon,
  BellIcon,
  UsersIcon,
  BuildingLibraryIcon,
  ShieldCheckIcon,
  ArrowRightStartOnRectangleIcon,
  BoltIcon,
  SignalIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext.jsx'
import Badge from '../ui/Badge.jsx'

const navItems = [
  { label: 'Dashboard',   to: '/dashboard',   icon: HomeIcon,              roles: ['ADMIN', 'TRADER', 'VIEWER'] },
  { label: 'Trades',      to: '/trades',       icon: ArrowTrendingUpIcon,   roles: ['ADMIN', 'TRADER', 'VIEWER'] },
  { label: 'Analysis',    to: '/analysis',     icon: DocumentChartBarIcon,  roles: ['ADMIN', 'TRADER', 'VIEWER'] },
  { label: 'Performance', to: '/performance',  icon: ChartBarSquareIcon,    roles: ['ADMIN', 'TRADER', 'VIEWER'] },
  { label: 'Alerts',      to: '/alerts',       icon: BellIcon,              roles: ['ADMIN', 'TRADER', 'VIEWER'] },
  { label: 'Stocks',      to: '/stocks',       icon: BuildingLibraryIcon,   roles: ['ADMIN', 'TRADER', 'VIEWER'] },
  { label: 'Momentum',   to: '/momentum',     icon: BoltIcon,              roles: ['ADMIN', 'TRADER', 'VIEWER'] },
  { label: 'RSI',        to: '/rsi',          icon: SignalIcon,            roles: ['ADMIN', 'TRADER', 'VIEWER'] },
  { label: 'Roles',       to: '/roles',        icon: ShieldCheckIcon,       roles: ['ADMIN'] },
  { label: 'Users',       to: '/admin',        icon: UsersIcon,             roles: ['ADMIN'] },
]

const roleVariant = (role) => {
  if (role === 'ADMIN') return 'danger'
  if (role === 'TRADER') return 'info'
  return 'neutral'
}

export default function Sidebar({ onClose }) {
  const { user, logout, isAdmin, isTrader, isViewer } = useAuth()

  const userRole = user?.roleName ?? (user?.roles?.[0] ?? '')

  const hasRole = (roles) => {
    if (isAdmin && roles.includes('ADMIN')) return true
    if (isTrader && roles.includes('TRADER')) return true
    if (isViewer && roles.includes('VIEWER')) return true
    return false
  }

  const filteredNavItems = navItems.filter(item => hasRole(item.roles))

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.username
      ? user.username.slice(0, 2).toUpperCase()
      : 'U'

  return (
    <div
      className="flex flex-col h-full select-none"
      style={{ background: 'linear-gradient(180deg, #0b1120 0%, #0d1526 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 h-16 px-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand shadow-brand-sm shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 12l4-4 3 3 5-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <span className="text-sm font-semibold text-white tracking-tight">StockTrack</span>
          <span className="block text-[10px] text-slate-500 leading-none">Trade Journal</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-0.5">
        {filteredNavItems.map((item, i) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              style={{ animationDelay: `${i * 30}ms` }}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group relative',
                  isActive
                    ? 'text-white bg-white/8 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 font-normal',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand rounded-r-full" />
                  )}
                  <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? 'text-brand' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  {item.label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 16px' }} />

      {/* User section */}
      <div className="px-3 py-4 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1">
          <div className="h-8 w-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-brand-300">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-200 truncate leading-none mb-1">
              {user?.name ?? user?.username ?? 'User'}
            </p>
            {userRole && (
              <Badge variant={roleVariant(userRole)} size="sm">{userRole}</Badge>
            )}
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all duration-150"
        >
          <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}
