import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext'
import { hasRole } from '../../../constants'

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles?.length && !hasRole(user, roles)) return <Navigate to="/dashboard" replace />
  return children
}
