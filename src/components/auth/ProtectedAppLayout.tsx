import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AppShell } from '@/components/layout/AppShell'

/** Guards the internal app: must be authenticated AND onboarded. */
export function ProtectedAppLayout() {
  const { isAuthenticated, isOnboardingComplete } = useAuth()
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />
  if (!isOnboardingComplete) return <Navigate to="/onboarding" replace />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
