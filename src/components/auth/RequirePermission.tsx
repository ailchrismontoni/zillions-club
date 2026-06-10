import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { Permission } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { EmptyState } from '@/components/ui/EmptyState'
import { ShieldAlert } from 'lucide-react'

/** Page-level RBAC guard. Owner always passes. */
export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { can } = useAuth()
  if (!can(permission)) {
    return (
      <div className="py-16">
        <EmptyState
          icon={ShieldAlert}
          title="You don't have access to this page"
          description="Ask an owner or admin to grant you the required permission."
        />
      </div>
    )
  }
  return <>{children}</>
}

/** Redirect variant for routes that should bounce silently. */
export function RequirePermissionRedirect({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { can } = useAuth()
  if (!can(permission)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
