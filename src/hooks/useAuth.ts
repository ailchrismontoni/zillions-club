import { useMemo } from 'react'
import { useAuthStore } from '@/app/authStore'
import { useAppStore } from '@/app/store'
import type { Agent, Permission, UserAccount, UserRole } from '@/types'
import { hasPermission } from '@/lib/permissions'

export interface AuthContext {
  account: UserAccount | null
  agent: Agent | null
  role: UserRole
  permissions: Permission[]
  isAuthenticated: boolean
  isOnboardingComplete: boolean
  isOwner: boolean
  isAdmin: boolean
  isLeader: boolean
  isAgent: boolean
  /** RBAC check for the logged-in user. */
  can: (permission: Permission) => boolean
}

/** Combines the auth session with the linked agent's platform role + permissions. */
export function useAuth(): AuthContext {
  const sessionUserId = useAuthStore((s) => s.sessionUserId)
  const userAccounts = useAuthStore((s) => s.userAccounts)
  const agents = useAppStore((s) => s.agents)

  return useMemo(() => {
    const account = userAccounts.find((u) => u.id === sessionUserId) ?? null
    const agent = account ? agents.find((a) => a.id === account.agentId) ?? null : null
    // Platform role + permissions live on the agent; fall back to the account role.
    const role: UserRole = agent?.platformRole ?? account?.role ?? 'agent'
    const permissions = agent?.permissions ?? []
    return {
      account,
      agent,
      role,
      permissions,
      isAuthenticated: Boolean(account),
      isOnboardingComplete: Boolean(account?.onboardingComplete),
      isOwner: role === 'owner',
      isAdmin: role === 'admin',
      isLeader: role === 'leader',
      isAgent: role === 'agent',
      can: (permission: Permission) => hasPermission({ platformRole: role, permissions }, permission),
    }
  }, [sessionUserId, userAccounts, agents])
}
