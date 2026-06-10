import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Agent,
  AIActivity,
  Announcement,
  AnnouncementReadReceipt,
  AppNotification,
  AuditLog,
  ChatMessage,
  ChatRead,
  DailyNumbers,
  DateFilter,
  InviteCode,
  Permission,
  ProductionEntry,
  Referral,
  ReferralStatus,
  SentInvite,
  Team,
  UserRole,
} from '@/types'
import {
  SEED_AGENTS,
  SEED_AI_ACTIVITY,
  SEED_INVITE_CODES,
  SEED_PRODUCTION,
  SEED_REFERRALS,
  SEED_TEAMS,
} from '@/data/seed'
import { SEED_ANNOUNCEMENTS } from '@/data/seedAnnouncements'
import { SEED_CHAT_MESSAGES } from '@/data/seedChat'
import { DEFAULT_PERMISSIONS } from '@/lib/permissions'
import { computeNextSendAt, defaultPushBody, defaultPushTitle, isTargeted } from '@/lib/announcements'
import { supabaseEnabled } from '@/lib/supabase'
import { pushAgent, pushTeam, removeAgentRow } from '@/services/supabase/data'
import { nowIso, uid } from '@/lib/utils'

/** Mirror an agent change up to the shared backend (no-op without Supabase). */
function syncAgent(agent: Agent | undefined) {
  if (supabaseEnabled && agent) void pushAgent(agent)
}

type NewAnnouncementInput = Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'lastSentAt' | 'nextSendAt' | 'recurringActive'>

/** Build AppNotifications for every agent targeted by an announcement (excluding the author). */
function buildNotifications(a: Announcement, agents: Agent[]): AppNotification[] {
  return agents
    .filter((ag) => ag.id !== a.createdByUserId && isTargeted(a, ag))
    .map((ag) => ({
      id: uid('ntf'),
      userId: ag.id,
      type: 'announcement' as const,
      title: a.pushTitle || defaultPushTitle(a.title),
      message: a.pushBody || defaultPushBody(a.body),
      relatedAnnouncementId: a.id,
      read: false,
      priority: a.priority,
      createdAt: nowIso(),
    }))
}

type NewAgentInput = Pick<
  Agent,
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'location'
  | 'avatarUrl'
  | 'teamId'
  | 'role'
  | 'contractLevel'
  | 'status'
  | 'startDate'
  | 'sponsor'
  | 'notes'
> &
  Partial<Pick<Agent, 'id' | 'authUserId' | 'onboardingComplete'>>

type NewProductionInput = Omit<
  ProductionEntry,
  'id' | 'createdAt' | 'updatedAt'
>

type NewReferralInput = Partial<Referral> &
  Pick<Referral, 'agentId' | 'name'>

interface AppState {
  // Base data (persisted, single source of truth)
  agents: Agent[]
  teams: Team[]
  inviteCodes: InviteCode[]
  sentInvites: SentInvite[]
  referrals: Referral[]
  production: ProductionEntry[]
  aiActivity: AIActivity[]
  auditLog: AuditLog[]
  announcements: Announcement[]
  readReceipts: AnnouncementReadReceipt[]
  notifications: AppNotification[]
  chatMessages: ChatMessage[]
  chatReads: ChatRead[]
  organizationConnected: boolean
  unreadAnnouncements: number

  // App-level UI state
  dateFilter: DateFilter
  sidebarCollapsed: boolean

  // Agents
  createAgent: (input: NewAgentInput) => Agent
  updateAgent: (id: string, patch: Partial<Agent>) => void
  reassignAgentTeam: (agentId: string, teamId: string, note?: string) => void
  assignToLeader: (agentId: string, leaderId: string | null) => void
  deleteAgent: (id: string) => void
  setAgentRole: (agentId: string, role: UserRole) => void
  setAgentPermissions: (agentId: string, permissions: Permission[]) => void
  setAgentGoals: (agentId: string, goals: import('@/types').UserGoals) => void
  addAuditLog: (entry: { actorUserId: string; actorName: string; action: string; targetUserId?: string; targetName?: string; oldValue?: string; newValue?: string }) => void

  // Teams + invites
  createTeam: (input: { name: string; leaderName: string; code: string; description?: string }) => Team
  createInviteCode: (input: { code: string; teamId: string; createdBy: string }) => InviteCode | null
  updateInviteCode: (id: string, patch: { code?: string; teamId?: string; active?: boolean }) => void
  deactivateInviteCode: (id: string) => void
  deleteInviteCode: (id: string) => void
  incrementInviteUsage: (id: string) => void
  recordSentInvite: (input: { email: string; teamId: string; code: string; link: string; sentBy: string }) => void

  // Production
  addProduction: (input: NewProductionInput) => ProductionEntry
  addDailyNumbers: (agentId: string, data: DailyNumbers) => ProductionEntry
  updateProduction: (id: string, patch: Partial<ProductionEntry>) => void
  deleteProduction: (id: string) => void

  // Referrals
  addReferral: (input: NewReferralInput) => Referral
  updateReferral: (id: string, patch: Partial<Referral>) => void
  deleteReferral: (id: string) => void
  deleteReferrals: (ids: string[]) => void
  setReferralStatus: (id: string, status: ReferralStatus) => void
  markContacted: (ids: string[]) => void

  // AI CRM
  setOrganizationConnected: (connected: boolean) => void
  addAIActivity: (activity: Omit<AIActivity, 'id' | 'createdAt'> & Partial<Pick<AIActivity, 'id' | 'createdAt'>>) => void

  // Announcements
  createAnnouncement: (input: NewAnnouncementInput) => Announcement
  updateAnnouncement: (id: string, patch: Partial<Announcement>) => void
  deleteAnnouncement: (id: string) => void
  archiveAnnouncement: (id: string) => void
  toggleAnnouncementPin: (id: string) => void
  duplicateAnnouncement: (id: string) => void
  setRecurringActive: (id: string, active: boolean) => void
  stopRecurring: (id: string) => void
  publishAnnouncement: (id: string) => void
  markAnnouncementRead: (announcementId: string, userId: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (userId: string) => void
  processScheduledAnnouncements: () => void

  // Chat
  sendChatMessage: (conversationId: string, sender: { id: string; name: string }, body: string) => void
  markChatRead: (conversationId: string, userId: string) => void

  // App
  setDateFilter: (filter: DateFilter) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  resetDemo: () => void
  logActivity: (agentId: string, type: AIActivity['type'], message: string, status: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      agents: SEED_AGENTS,
      teams: SEED_TEAMS,
      inviteCodes: SEED_INVITE_CODES,
      sentInvites: [],
      referrals: SEED_REFERRALS,
      production: SEED_PRODUCTION,
      aiActivity: SEED_AI_ACTIVITY,
      auditLog: [],
      announcements: SEED_ANNOUNCEMENTS,
      readReceipts: [],
      notifications: [],
      chatMessages: SEED_CHAT_MESSAGES,
      chatReads: [],
      organizationConnected: false,
      unreadAnnouncements: 38,

      dateFilter: 'This Week',
      sidebarCollapsed: false,

      // ── Agents ──────────────────────────────────────────────────────────
      createAgent: (input) => {
        const team = get().teams.find((t) => t.id === input.teamId)
        const agent: Agent = {
          id: input.id ?? uid('agent'),
          authUserId: input.authUserId,
          onboardingComplete: input.onboardingComplete ?? false,
          firstName: input.firstName,
          lastName: input.lastName,
          fullName: `${input.firstName} ${input.lastName}`.trim(),
          email: input.email,
          phone: input.phone,
          location: input.location,
          avatarUrl: input.avatarUrl,
          teamId: input.teamId,
          teamName: team?.name ?? 'Unassigned',
          role: input.role,
          contractLevel: input.contractLevel,
          status: input.status,
          startDate: input.startDate,
          sponsor: input.sponsor,
          notes: input.notes,
          // New agents report to their team's leader (or top owner if none).
          leaderId: team && team.leaderAgentId !== '' ? team.leaderAgentId : null,
          platformRole: 'agent',
          permissions: DEFAULT_PERMISSIONS.agent,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({ agents: [...s.agents, agent] }))
        get().logActivity(agent.id, 'connected', `${agent.fullName} joined ${agent.teamName}`, 'Created')
        syncAgent(agent)
        return agent
      },

      updateAgent: (id, patch) => {
        set((s) => ({
          agents: s.agents.map((a) => {
            if (a.id !== id) return a
            const next = { ...a, ...patch, updatedAt: nowIso() }
            next.fullName = `${next.firstName} ${next.lastName}`.trim()
            if (patch.teamId) {
              const team = s.teams.find((t) => t.id === patch.teamId)
              next.teamName = team?.name ?? a.teamName
              // Re-home under the new team's leader unless explicitly set.
              if (patch.leaderId === undefined && team) {
                next.leaderId = team.leaderAgentId !== id ? team.leaderAgentId : null
              }
            }
            return next
          }),
        }))
        syncAgent(get().agents.find((a) => a.id === id))
      },

      reassignAgentTeam: (agentId, teamId, note) => {
        const state = get()
        const agent = state.agents.find((a) => a.id === agentId)
        const team = state.teams.find((t) => t.id === teamId)
        if (!agent || !team) return
        const fromName = agent.teamName
        const newLeader = team.leaderAgentId !== agentId ? team.leaderAgentId : null
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === agentId ? { ...a, teamId, teamName: team.name, leaderId: newLeader, updatedAt: nowIso() } : a,
          ),
          referrals: s.referrals.map((r) =>
            r.agentId === agentId ? { ...r, teamId, teamName: team.name, updatedAt: nowIso() } : r,
          ),
        }))
        get().logActivity(
          agentId,
          'connected',
          `Agent reassigned from ${fromName} to ${team.name}${note ? ` — ${note}` : ''}`,
          'Reassigned',
        )
        syncAgent(get().agents.find((a) => a.id === agentId))
      },

      assignToLeader: (agentId, leaderId) => {
        const state = get()
        const agent = state.agents.find((a) => a.id === agentId)
        if (!agent) return
        const leader = leaderId ? state.agents.find((a) => a.id === leaderId) : null
        const teamId = leader?.teamId ?? agent.teamId
        const teamName = leader?.teamName ?? agent.teamName
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === agentId ? { ...a, leaderId, teamId, teamName, updatedAt: nowIso() } : a,
          ),
          referrals: s.referrals.map((r) =>
            r.agentId === agentId ? { ...r, teamId, teamName, updatedAt: nowIso() } : r,
          ),
        }))
        get().logActivity(agentId, 'connected', leader ? `${agent.fullName} moved under ${leader.fullName} (${leader.teamName})` : `${agent.fullName} moved to top of agency`, 'Hierarchy')
        syncAgent(get().agents.find((a) => a.id === agentId))
      },

      deleteAgent: (id) => {
        const removed = get().agents.find((a) => a.id === id)
        if (removed?.platformRole === 'owner') return // never delete the owner
        const newLeader = removed?.leaderId ?? null
        const reparentedIds = get().agents.filter((a) => a.leaderId === id).map((a) => a.id)
        set((s) => ({
          agents: s.agents
            .filter((a) => a.id !== id)
            .map((a) => (a.leaderId === id ? { ...a, leaderId: newLeader, updatedAt: nowIso() } : a)),
        }))
        if (supabaseEnabled) {
          void removeAgentRow(id)
          reparentedIds.forEach((rid) => syncAgent(get().agents.find((a) => a.id === rid)))
        }
      },

      setAgentRole: (agentId, role) => {
        set((s) => ({
          agents: s.agents.map((a) =>
            // Owner role is protected — never reassign it here.
            a.id === agentId && a.platformRole !== 'owner' && role !== 'owner'
              ? { ...a, platformRole: role, permissions: DEFAULT_PERMISSIONS[role], updatedAt: nowIso() }
              : a,
          ),
        }))
        syncAgent(get().agents.find((a) => a.id === agentId))
      },

      setAgentPermissions: (agentId, permissions) => {
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === agentId && a.platformRole !== 'owner'
              ? { ...a, permissions, updatedAt: nowIso() }
              : a,
          ),
        }))
        syncAgent(get().agents.find((a) => a.id === agentId))
      },

      setAgentGoals: (agentId, goals) => {
        set((s) => ({
          agents: s.agents.map((a) => (a.id === agentId ? { ...a, goals, updatedAt: nowIso() } : a)),
        }))
        syncAgent(get().agents.find((a) => a.id === agentId))
      },

      addAuditLog: (entry) =>
        set((s) => ({
          auditLog: [{ id: uid('audit'), createdAt: nowIso(), ...entry }, ...s.auditLog].slice(0, 200),
        })),

      createTeam: ({ name, leaderName, code, createdBy = 'Admin', description }: any) => {
        const team: Team = {
          id: uid('team'),
          name: name.startsWith('Team ') ? name : `Team ${name}`,
          leaderAgentId: '',
          leaderName,
          createdAt: nowIso(),
        }
        set((s) => ({ teams: [...s.teams, team] }))
        if (code?.trim()) {
          get().createInviteCode({ code: code.trim().toUpperCase(), teamId: team.id, createdBy })
        }
        if (supabaseEnabled) void pushTeam(team)
        void description
        return team
      },

      createInviteCode: ({ code, teamId, createdBy }) => {
        const state = get()
        const team = state.teams.find((t) => t.id === teamId)
        if (!team) return null
        const normalized = code.trim().toUpperCase()
        if (state.inviteCodes.some((c) => c.code.toUpperCase() === normalized && c.active)) {
          return state.inviteCodes.find((c) => c.code.toUpperCase() === normalized) ?? null
        }
        const invite: InviteCode = {
          id: uid('invite'),
          code: normalized,
          teamId: team.id,
          teamName: team.name,
          createdBy,
          active: true,
          usageCount: 0,
          createdAt: nowIso(),
        }
        set((s) => ({ inviteCodes: [invite, ...s.inviteCodes] }))
        return invite
      },

      updateInviteCode: (id, patch) =>
        set((s) => ({
          inviteCodes: s.inviteCodes.map((c) => {
            if (c.id !== id) return c
            const team = patch.teamId ? s.teams.find((t) => t.id === patch.teamId) : undefined
            return {
              ...c,
              code: patch.code !== undefined ? patch.code.trim().toUpperCase() : c.code,
              teamId: patch.teamId ?? c.teamId,
              teamName: team?.name ?? c.teamName,
              active: patch.active ?? c.active,
            }
          }),
        })),

      deactivateInviteCode: (id) =>
        set((s) => ({
          inviteCodes: s.inviteCodes.map((c) => (c.id === id ? { ...c, active: false } : c)),
        })),

      deleteInviteCode: (id) =>
        set((s) => ({ inviteCodes: s.inviteCodes.filter((c) => c.id !== id) })),

      incrementInviteUsage: (id) =>
        set((s) => ({
          inviteCodes: s.inviteCodes.map((c) => (c.id === id ? { ...c, usageCount: c.usageCount + 1 } : c)),
        })),

      recordSentInvite: (input) => {
        const team = get().teams.find((t) => t.id === input.teamId)
        const invite: SentInvite = {
          id: uid('sent'),
          email: input.email.trim(),
          teamId: input.teamId,
          teamName: team?.name ?? 'Unassigned',
          code: input.code,
          link: input.link,
          sentBy: input.sentBy,
          sentAt: nowIso(),
        }
        set((s) => ({ sentInvites: [invite, ...s.sentInvites].slice(0, 50) }))
      },

      // ── Production ──────────────────────────────────────────────────────
      addProduction: (input) => {
        const entry: ProductionEntry = {
          ...input,
          id: uid('prod'),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({ production: [entry, ...s.production] }))
        const agent = get().agents.find((a) => a.id === input.agentId)
        get().logActivity(
          input.agentId,
          'message',
          `Logged ${input.alp.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} ALP · ${input.familiesProtected} families`,
          'Production',
        )
        void agent
        return entry
      },

      addDailyNumbers: (agentId, data) =>
        get().addProduction({
          agentId,
          date: data.date,
          alp: data.totalAlp,
          familiesProtected: data.dealsSold,
          salesCount: data.dealsSold,
          presentationsSat: data.appointmentsSat,
          appointmentsSet: data.appointmentsScheduled,
          appointmentsShowed: data.appointmentsSat,
          callsMade: data.dials,
          talkTimeMinutes: 0,
          referralsCollected: data.referralsCollected,
          notes: '',
          dials: data.dials,
          referralsSat: data.referralsSat,
          referralSales: data.referralSales,
          referralAlp: data.referralAlp,
          projectedAppointments: data.projectedAppointments,
        }),

      updateProduction: (id, patch) =>
        set((s) => ({
          production: s.production.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: nowIso() } : p,
          ),
        })),

      deleteProduction: (id) =>
        set((s) => ({ production: s.production.filter((p) => p.id !== id) })),

      // ── Referrals ───────────────────────────────────────────────────────
      addReferral: (input) => {
        const agent = get().agents.find((a) => a.id === input.agentId)
        const referral: Referral = {
          id: input.id ?? uid('ref'),
          agentId: input.agentId,
          agentName: agent?.fullName ?? input.agentName ?? 'Unknown',
          teamId: agent?.teamId ?? input.teamId ?? '',
          teamName: agent?.teamName ?? input.teamName ?? '',
          name: input.name,
          relation: input.relation ?? '',
          city: input.city ?? '',
          occupation: input.occupation ?? '',
          household: input.household ?? '',
          spouse: input.spouse ?? '',
          phone: input.phone ?? '',
          sponsor: input.sponsor ?? agent?.fullName ?? '',
          notes: input.notes ?? '',
          status: input.status ?? 'New',
          aiStatus: input.aiStatus ?? 'none',
          createdAt: input.createdAt ?? nowIso(),
          updatedAt: nowIso(),
          lastContactedAt: input.lastContactedAt ?? null,
          aiSentAt: input.aiSentAt ?? null,
          appointmentBookedAt: input.appointmentBookedAt ?? null,
          appointmentDate: input.appointmentDate ?? null,
          source: input.source ?? 'Manual',
          error: input.error ?? null,
        }
        set((s) => ({ referrals: [referral, ...s.referrals] }))
        get().logActivity(referral.agentId, 'message', `Added referral ${referral.name}`, 'Referral')
        return referral
      },

      updateReferral: (id, patch) =>
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r,
          ),
        })),

      deleteReferral: (id) =>
        set((s) => ({ referrals: s.referrals.filter((r) => r.id !== id) })),

      deleteReferrals: (ids) =>
        set((s) => ({ referrals: s.referrals.filter((r) => !ids.includes(r.id)) })),

      setReferralStatus: (id, status) =>
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id ? { ...r, status, updatedAt: nowIso() } : r,
          ),
        })),

      markContacted: (ids) =>
        set((s) => ({
          referrals: s.referrals.map((r) =>
            ids.includes(r.id)
              ? {
                  ...r,
                  status: r.status === 'New' || r.status === 'Stale' ? 'Contacted' : r.status,
                  lastContactedAt: nowIso(),
                  error: null,
                  updatedAt: nowIso(),
                }
              : r,
          ),
        })),

      // ── AI CRM ──────────────────────────────────────────────────────────
      setOrganizationConnected: (organizationConnected) => set({ organizationConnected }),

      addAIActivity: (activity) =>
        set((s) => ({
          aiActivity: [
            {
              id: activity.id ?? uid('act'),
              createdAt: activity.createdAt ?? nowIso(),
              agentId: activity.agentId,
              referralId: activity.referralId,
              type: activity.type,
              message: activity.message,
              status: activity.status,
            },
            ...s.aiActivity,
          ],
        })),

      logActivity: (agentId, type, message, status) =>
        set((s) => ({
          aiActivity: [
            { id: uid('act'), createdAt: nowIso(), agentId, referralId: null, type, message, status },
            ...s.aiActivity,
          ],
        })),

      // ── Announcements ───────────────────────────────────────────────────
      createAnnouncement: (input) => {
        const a: Announcement = {
          ...input,
          id: uid('ann'),
          recurringActive: input.recurring,
          lastSentAt: null,
          nextSendAt: input.recurring && input.recurrenceRule ? computeNextSendAt(input.recurrenceRule).toISOString() : null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({ announcements: [a, ...s.announcements] }))
        if (a.status === 'published') get().publishAnnouncement(a.id)
        return a
      },

      updateAnnouncement: (id, patch) =>
        set((s) => ({
          announcements: s.announcements.map((a) =>
            a.id === id ? { ...a, ...patch, updatedAt: nowIso() } : a,
          ),
        })),

      deleteAnnouncement: (id) =>
        set((s) => ({
          announcements: s.announcements.filter((a) => a.id !== id),
          readReceipts: s.readReceipts.filter((r) => r.announcementId !== id),
          notifications: s.notifications.filter((n) => n.relatedAnnouncementId !== id),
        })),

      archiveAnnouncement: (id) =>
        set((s) => ({
          announcements: s.announcements.map((a) => (a.id === id ? { ...a, status: 'archived', recurringActive: false, updatedAt: nowIso() } : a)),
        })),

      toggleAnnouncementPin: (id) =>
        set((s) => ({
          announcements: s.announcements.map((a) => (a.id === id ? { ...a, pinned: !a.pinned, updatedAt: nowIso() } : a)),
        })),

      duplicateAnnouncement: (id) => {
        const orig = get().announcements.find((a) => a.id === id)
        if (!orig) return
        const copy: Announcement = {
          ...orig,
          id: uid('ann'),
          title: `${orig.title} (copy)`,
          status: 'draft',
          pinned: false,
          lastSentAt: null,
          nextSendAt: null,
          recurringActive: orig.recurring,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({ announcements: [copy, ...s.announcements] }))
      },

      setRecurringActive: (id, active) =>
        set((s) => ({
          announcements: s.announcements.map((a) =>
            a.id === id
              ? { ...a, recurringActive: active, nextSendAt: active && a.recurrenceRule ? computeNextSendAt(a.recurrenceRule).toISOString() : a.nextSendAt, updatedAt: nowIso() }
              : a,
          ),
        })),

      stopRecurring: (id) =>
        set((s) => ({
          announcements: s.announcements.map((a) => (a.id === id ? { ...a, recurring: false, recurringActive: false, nextSendAt: null, updatedAt: nowIso() } : a)),
        })),

      publishAnnouncement: (id) => {
        const state = get()
        const a = state.announcements.find((x) => x.id === id)
        if (!a) return
        const notifs = a.sendPushNotification ? buildNotifications(a, state.agents) : []
        set((s) => {
          const hasAuthorReceipt = s.readReceipts.some((r) => r.announcementId === id && r.userId === a.createdByUserId)
          return {
            announcements: s.announcements.map((x) =>
              x.id === id ? { ...x, status: 'published', lastSentAt: nowIso(), publishAt: x.publishAt ?? nowIso(), updatedAt: nowIso() } : x,
            ),
            notifications: [...notifs, ...s.notifications],
            // The author has implicitly "read" their own announcement.
            readReceipts: hasAuthorReceipt ? s.readReceipts : [{ id: uid('rcpt'), announcementId: id, userId: a.createdByUserId, readAt: nowIso() }, ...s.readReceipts],
          }
        })
      },

      markAnnouncementRead: (announcementId, userId) =>
        set((s) => {
          if (s.readReceipts.some((r) => r.announcementId === announcementId && r.userId === userId)) {
            return {
              notifications: s.notifications.map((n) => (n.relatedAnnouncementId === announcementId && n.userId === userId ? { ...n, read: true } : n)),
            }
          }
          return {
            readReceipts: [{ id: uid('rcpt'), announcementId, userId, readAt: nowIso() }, ...s.readReceipts],
            notifications: s.notifications.map((n) => (n.relatedAnnouncementId === announcementId && n.userId === userId ? { ...n, read: true } : n)),
          }
        }),

      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

      markAllNotificationsRead: (userId) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)) })),

      processScheduledAnnouncements: () => {
        const state = get()
        const now = Date.now()
        let changed = false
        const newNotifs: AppNotification[] = []
        const clearedReceiptAnnIds: string[] = []

        const announcements = state.announcements.map((a) => {
          // 1) Publish due scheduled (one-time) announcements
          if (a.status === 'scheduled' && a.publishAt && new Date(a.publishAt).getTime() <= now) {
            changed = true
            if (a.sendPushNotification) newNotifs.push(...buildNotifications(a, state.agents))
            return { ...a, status: 'published' as const, lastSentAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          }
          // 2) Advance recurring series whose next occurrence is due
          if (a.recurring && a.recurringActive && a.recurrenceRule && a.nextSendAt && new Date(a.nextSendAt).getTime() <= now) {
            const ended = a.recurrenceRule.endDate && new Date(a.recurrenceRule.endDate).getTime() < now
            if (ended) {
              changed = true
              return { ...a, recurringActive: false, updatedAt: new Date().toISOString() }
            }
            changed = true
            clearedReceiptAnnIds.push(a.id)
            if (a.sendPushNotification) newNotifs.push(...buildNotifications(a, state.agents))
            return {
              ...a,
              status: 'published' as const,
              lastSentAt: new Date().toISOString(),
              nextSendAt: computeNextSendAt(a.recurrenceRule, new Date()).toISOString(),
              updatedAt: new Date().toISOString(),
            }
          }
          return a
        })

        if (!changed) return
        set((s) => ({
          announcements,
          // Each new recurring occurrence resets read state for that announcement.
          readReceipts: s.readReceipts.filter((r) => !clearedReceiptAnnIds.includes(r.announcementId)),
          notifications: [...newNotifs, ...s.notifications],
        }))
      },

      // ── Chat ────────────────────────────────────────────────────────────
      sendChatMessage: (conversationId, sender, body) => {
        const text = body.trim()
        if (!text) return
        const message: ChatMessage = {
          id: uid('msg'),
          conversationId,
          senderId: sender.id,
          senderName: sender.name,
          body: text,
          createdAt: nowIso(),
        }
        set((s) => ({
          chatMessages: [...s.chatMessages, message],
          // Sending implicitly marks the conversation read for the sender.
          chatReads: [
            ...s.chatReads.filter((r) => !(r.userId === sender.id && r.conversationId === conversationId)),
            { userId: sender.id, conversationId, readAt: nowIso() },
          ],
        }))
      },

      markChatRead: (conversationId, userId) =>
        set((s) => ({
          chatReads: [
            ...s.chatReads.filter((r) => !(r.userId === userId && r.conversationId === conversationId)),
            { userId, conversationId, readAt: nowIso() },
          ],
        })),

      // ── App ─────────────────────────────────────────────────────────────
      setDateFilter: (dateFilter) => set({ dateFilter }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      resetDemo: () =>
        set({
          agents: SEED_AGENTS,
          teams: SEED_TEAMS,
          inviteCodes: SEED_INVITE_CODES,
          sentInvites: [],
          referrals: SEED_REFERRALS,
          production: SEED_PRODUCTION,
          aiActivity: SEED_AI_ACTIVITY,
          auditLog: [],
          announcements: SEED_ANNOUNCEMENTS,
          readReceipts: [],
          notifications: [],
          chatMessages: SEED_CHAT_MESSAGES,
          chatReads: [],
          organizationConnected: false,
          dateFilter: 'This Week',
        }),
    }),
    {
      name: 'zillions-club-v11',
      partialize: (s) => ({
        agents: s.agents,
        teams: s.teams,
        inviteCodes: s.inviteCodes,
        sentInvites: s.sentInvites,
        referrals: s.referrals,
        production: s.production,
        aiActivity: s.aiActivity,
        auditLog: s.auditLog,
        announcements: s.announcements,
        readReceipts: s.readReceipts,
        notifications: s.notifications,
        chatMessages: s.chatMessages,
        chatReads: s.chatReads,
        organizationConnected: s.organizationConnected,
        unreadAnnouncements: s.unreadAnnouncements,
        dateFilter: s.dateFilter,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    },
  ),
)
