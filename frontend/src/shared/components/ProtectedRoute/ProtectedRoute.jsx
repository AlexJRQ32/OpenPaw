import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext'
import { hasRole } from '../../../constants'

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles?.length && !hasRole(user, roles)) return <Navigate to="/dashboard" replace />
  return children
}
