import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Spinner from '../ui/Spinner.jsx'

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, token, loading, isAdmin, isTrader, isViewer } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user) {
    const roleMap = { ADMIN: isAdmin, TRADER: isTrader, VIEWER: isViewer }
    const hasRole = allowedRoles.some(r => roleMap[r])
    if (!hasRole) return <Navigate to="/dashboard" replace />
  }

  return children ?? <Outlet />
}
