import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Agent, OnboardingData, UserAccount } from '@/types'
import { SEED_USER_ACCOUNTS } from '@/data/seed'
import { useAppStore } from '@/app/store'
import { resolveTeam, type RoutingResult } from '@/services/teamRouting'
import { supabaseEnabled } from '@/lib/supabase'
import { sbSignIn, sbSignOut, sbSignUp } from '@/services/supabase/auth'
import { fetchAgents } from '@/services/supabase/data'
import { nowIso, uid } from '@/lib/utils'

export interface SignupInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  inviteCode?: string
  sponsor?: string
}

interface AuthResult {
  ok: boolean
  error?: string
  account?: UserAccount
}

interface AuthState {
  userAccounts: UserAccount[]
  sessionUserId: string | null

  signup: (input: SignupInput) => Promise<AuthResult>
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => void
  completeOnboarding: (data: OnboardingData) => Promise<RoutingResult | null>
  updateAccount: (id: string, patch: Partial<UserAccount>) => void
  /** Used by the Supabase bootstrap to restore a session on reload. */
  setSupabaseSession: (agent: Agent | null) => void
}

/** Build the local "account" object that drives useAuth, from an agent. */
function accountFromAgent(agent: Agent, password = ''): UserAccount {
  return {
    id: `acct_${agent.id}`,
    agentId: agent.id,
    firstName: agent.firstName,
    lastName: agent.lastName,
    fullName: agent.fullName,
    email: agent.email,
    phone: agent.phone,
    passwordHash: password,
    role: agent.platformRole ?? 'agent',
    accountStatus: agent.onboardingComplete ? 'Active' : 'Pending Onboarding',
    teamId: agent.teamId,
    teamName: agent.teamName,
    sponsor: agent.sponsor,
    inviteCode: '',
    onboardingComplete: Boolean(agent.onboardingComplete),
    createdAt: agent.createdAt,
    updatedAt: nowIso(),
    lastLoginAt: nowIso(),
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      userAccounts: SEED_USER_ACCOUNTS,
      sessionUserId: null,

      signup: async (input) => {
        const email = input.email.trim().toLowerCase()

        // ── Supabase (real shared backend) ───────────────────────────────
        if (supabaseEnabled) {
          const res = await sbSignUp(email, input.password)
          if (!res.ok) return { ok: false, error: res.error }
          const agency = useAppStore.getState()
          const agent = agency.createAgent({
            firstName: input.firstName, lastName: input.lastName, email,
            phone: input.phone, location: '', teamId: '',
            role: 'Career Agent', contractLevel: '65%', status: 'Onboarding',
            startDate: nowIso(), sponsor: input.sponsor ?? '', notes: '',
            authUserId: res.authUserId, onboardingComplete: false,
          })
          const account = accountFromAgent(agent, input.password)
          account.inviteCode = input.inviteCode?.trim().toUpperCase() ?? ''
          set((s) => ({ userAccounts: [...s.userAccounts.filter((u) => u.id !== account.id), account], sessionUserId: account.id }))
          return { ok: true, account }
        }

        // ── Local mock ───────────────────────────────────────────────────
        if (get().userAccounts.some((u) => u.email.toLowerCase() === email)) {
          return { ok: false, error: 'An account with this email already exists.' }
        }
        const agency = useAppStore.getState()
        const agent = agency.createAgent({
          firstName: input.firstName, lastName: input.lastName, email,
          phone: input.phone, location: '', teamId: '',
          role: 'Career Agent', contractLevel: '65%', status: 'Onboarding',
          startDate: nowIso(), sponsor: input.sponsor ?? '', notes: '',
        })
        const account: UserAccount = {
          id: uid('acct'), agentId: agent.id, firstName: input.firstName, lastName: input.lastName,
          fullName: `${input.firstName} ${input.lastName}`.trim(), email, phone: input.phone,
          passwordHash: input.password, role: 'agent', accountStatus: 'Pending Onboarding',
          teamId: '', teamName: 'Unassigned', sponsor: input.sponsor ?? '',
          inviteCode: input.inviteCode?.trim().toUpperCase() ?? '', onboardingComplete: false,
          createdAt: nowIso(), updatedAt: nowIso(), lastLoginAt: nowIso(),
        }
        set((s) => ({ userAccounts: [...s.userAccounts, account], sessionUserId: account.id }))
        return { ok: true, account }
      },

      login: async (email, password) => {
        const normalized = email.trim().toLowerCase()

        if (supabaseEnabled) {
          const res = await sbSignIn(normalized, password)
          if (!res.ok) return { ok: false, error: res.error }
          const agents = await fetchAgents()
          if (agents.length) useAppStore.setState({ agents })
          const agent = agents.find((a) => a.authUserId === res.authUserId)
          if (!agent) return { ok: false, error: 'No agent profile is linked to this login. Contact an admin.' }
          const account = accountFromAgent(agent, password)
          set((s) => ({ userAccounts: [...s.userAccounts.filter((u) => u.id !== account.id), account], sessionUserId: account.id }))
          return { ok: true, account }
        }

        const account = get().userAccounts.find((u) => u.email.toLowerCase() === normalized)
        if (!account) return { ok: false, error: 'No account found with this email.' }
        if (account.passwordHash !== password) return { ok: false, error: 'Incorrect password. Please try again.' }
        if (account.accountStatus === 'Disabled') return { ok: false, error: 'This account has been disabled.' }
        set((s) => ({ sessionUserId: account.id, userAccounts: s.userAccounts.map((u) => (u.id === account.id ? { ...u, lastLoginAt: nowIso() } : u)) }))
        return { ok: true, account }
      },

      logout: () => {
        if (supabaseEnabled) void sbSignOut()
        set({ sessionUserId: null })
      },

      setSupabaseSession: (agent) => {
        if (!agent) { set({ sessionUserId: null }); return }
        const account = accountFromAgent(agent)
        set((s) => ({ userAccounts: [...s.userAccounts.filter((u) => u.id !== account.id), account], sessionUserId: account.id }))
      },

      completeOnboarding: async (data) => {
        const state = get()
        const account = state.userAccounts.find((u) => u.id === state.sessionUserId)
        if (!account) return null

        const agency = useAppStore.getState()
        const routing = resolveTeam(
          { inviteCode: data.inviteCode || account.inviteCode, sponsor: data.sponsor, preferredTeamId: data.preferredTeamId },
          agency.teams,
          agency.inviteCodes,
        )

        agency.updateAgent(account.agentId, {
          teamId: routing.teamId,
          teamName: routing.teamName,
          sponsor: routing.resolvedSponsor || account.sponsor,
          phone: data.phone || account.phone,
          email: data.email || account.email,
          location: data.location,
          status: 'Onboarding',
          onboardingComplete: true,
        })
        agency.logActivity(account.agentId, 'connected', `Account created and routed to ${routing.teamName}${routing.needsReview ? ' (needs review)' : ''}`, 'Onboarded')
        if (routing.inviteCodeId) agency.incrementInviteUsage(routing.inviteCodeId)

        set((s) => ({
          userAccounts: s.userAccounts.map((u) =>
            u.id === account.id
              ? { ...u, teamId: routing.teamId, teamName: routing.teamName, sponsor: routing.resolvedSponsor || u.sponsor, phone: data.phone || u.phone, inviteCode: data.inviteCode || u.inviteCode, onboardingComplete: true, accountStatus: routing.needsReview ? 'Needs Review' : 'Active', updatedAt: nowIso() }
              : u,
          ),
        }))
        return routing
      },

      updateAccount: (id, patch) =>
        set((s) => ({ userAccounts: s.userAccounts.map((u) => (u.id === id ? { ...u, ...patch, updatedAt: nowIso() } : u)) })),
    }),
    {
      name: 'zillions-auth-v1',
      // In Supabase mode the session is restored from Supabase on load, not localStorage.
      partialize: (s) => (supabaseEnabled ? { userAccounts: [], sessionUserId: null } : { userAccounts: s.userAccounts, sessionUserId: s.sessionUserId }),
    },
  ),
)
