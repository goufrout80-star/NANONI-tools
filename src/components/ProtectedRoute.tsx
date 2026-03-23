import { Navigate } from 'react-router-dom'
import { useAuth, type UserRole } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { session, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
      </div>
    )
  }

  if (!isAuthenticated() || !session) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && session.role !== requiredRole) {
    // Wrong role → redirect to correct dashboard
    if (session.role === 'admin') {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
