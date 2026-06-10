import type { Agent, Team, UserGoals, Permission, AgentRole, AgentStatus, ContractLevel, UserRole } from '@/types'

/** DB row → Agent (snake_case → camelCase). */
export function rowToAgent(r: Record<string, any>): Agent {
  return {
    id: r.id,
    firstName: r.first_name ?? '',
    lastName: r.last_name ?? '',
    fullName: r.full_name ?? `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim(),
    email: r.email ?? '',
    phone: r.phone ?? '',
    location: r.location ?? '',
    avatarUrl: r.avatar_url ?? undefined,
    teamId: r.team_id ?? '',
    teamName: r.team_name ?? 'Unassigned',
    role: (r.role ?? 'Career Agent') as AgentRole,
    contractLevel: (r.contract_level ?? '65%') as ContractLevel,
    status: (r.status ?? 'Active') as AgentStatus,
    startDate: r.start_date ?? new Date().toISOString(),
    sponsor: r.sponsor ?? '',
    notes: r.notes ?? '',
    leaderId: r.leader_id ?? null,
    platformRole: (r.platform_role ?? 'agent') as UserRole,
    permissions: (r.permissions ?? []) as Permission[],
    goals: (r.goals ?? undefined) as UserGoals | undefined,
    authUserId: r.auth_user_id ?? undefined,
    onboardingComplete: r.onboarding_complete ?? false,
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? new Date().toISOString(),
  }
}

/** Agent → DB row (camelCase → snake_case). */
export function agentToRow(a: Agent): Record<string, any> {
  return {
    id: a.id,
    auth_user_id: a.authUserId ?? null,
    first_name: a.firstName,
    last_name: a.lastName,
    full_name: a.fullName,
    email: a.email,
    phone: a.phone,
    location: a.location,
    avatar_url: a.avatarUrl ?? null,
    team_id: a.teamId || null,
    team_name: a.teamName,
    role: a.role,
    contract_level: a.contractLevel,
    status: a.status,
    start_date: a.startDate,
    sponsor: a.sponsor,
    notes: a.notes,
    leader_id: a.leaderId ?? null,
    platform_role: a.platformRole ?? 'agent',
    permissions: a.permissions ?? [],
    goals: a.goals ?? null,
    onboarding_complete: a.onboardingComplete ?? false,
    updated_at: new Date().toISOString(),
  }
}

export function rowToTeam(r: Record<string, any>): Team {
  return {
    id: r.id,
    name: r.name,
    leaderAgentId: r.leader_agent_id ?? '',
    leaderName: r.leader_name ?? '',
    createdAt: r.created_at ?? new Date().toISOString(),
  }
}

export function teamToRow(t: Team): Record<string, any> {
  return {
    id: t.id,
    name: t.name,
    leader_agent_id: t.leaderAgentId || null,
    leader_name: t.leaderName,
  }
}
