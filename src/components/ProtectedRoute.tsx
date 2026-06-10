import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

export function ProtectedRoute() {
  const { isAuthenticated, isHydrated } = useAuthStore()

  if (!isHydrated) {
    return null // Ждем гидратации
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
