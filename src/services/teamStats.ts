import type {
  AgencyTotals,
  AgentWithStats,
  ComputedTeamStats,
  Team,
} from '@/types'

export function computeTeamStats(
  teams: Team[],
  agentsWithStats: AgentWithStats[],
): ComputedTeamStats[] {
  return teams
    .map((team) => {
      const members = agentsWithStats.filter((a) => a.agent.teamId === team.id)
      const sum = (fn: (a: AgentWithStats) => number) =>
        members.reduce((acc, m) => acc + fn(m), 0)

      const weeklyAlp = sum((m) => m.stats.weeklyAlp)
      const activeAgents = members.filter((m) => m.agent.status === 'Active').length

      return {
        teamId: team.id,
        teamName: team.name,
        leaderName: team.leaderName,
        weeklyAlp,
        monthlyAlp: sum((m) => m.stats.monthlyAlp),
        totalAlp: sum((m) => m.stats.totalAlp),
        familiesProtected: sum((m) => m.stats.weeklyFamiliesProtected),
        referralsCollected: sum((m) => m.stats.referralsCollected),
        referralsSentToAI: sum((m) => m.stats.referralsSentToAI),
        appointmentsBooked: sum((m) => m.stats.appointmentsBooked),
        activeAgents,
        agentCount: members.length,
        averageAlpPerAgent: members.length ? weeklyAlp / members.length : 0,
      }
    })
    .sort((a, b) => b.weeklyAlp - a.weeklyAlp)
}

export function computeAgencyTotals(
  agentsWithStats: AgentWithStats[],
  unreadAnnouncements: number,
): AgencyTotals {
  const sum = (fn: (a: AgentWithStats) => number) =>
    agentsWithStats.reduce((acc, m) => acc + fn(m), 0)

  return {
    weeklyAlp: sum((m) => m.stats.weeklyAlp),
    monthlyAlp: sum((m) => m.stats.monthlyAlp),
    familiesProtected: sum((m) => m.stats.weeklyFamiliesProtected),
    referralsCollected: sum((m) => m.stats.referralsCollected),
    referralsSentToAI: sum((m) => m.stats.referralsSentToAI),
    appointmentsBooked: sum((m) => m.stats.appointmentsBooked),
    soldReferrals: sum((m) => m.stats.soldReferrals),
    unreadAnnouncements,
    activeAgents: agentsWithStats.filter((m) => m.agent.status === 'Active').length,
  }
}

/** Producer leaderboard: agents ranked by weekly ALP (only those with production). */
export function producerLeaderboard(agentsWithStats: AgentWithStats[]): AgentWithStats[] {
  return [...agentsWithStats]
    .filter((a) => a.stats.weeklyAlp > 0)
    .sort((a, b) => b.stats.weeklyAlp - a.stats.weeklyAlp)
}

/** The single top producer by weekly ALP. */
export function topProducer(agentsWithStats: AgentWithStats[]): AgentWithStats | null {
  const ranked = producerLeaderboard(agentsWithStats)
  return ranked[0] ?? null
}

/** Ref Sales Champion: most sold referrals (tiebreak: AI-booked appointments). */
export function refSalesChampion(agentsWithStats: AgentWithStats[]): AgentWithStats | null {
  const ranked = [...agentsWithStats].sort((a, b) => {
    if (b.stats.soldReferrals !== a.stats.soldReferrals)
      return b.stats.soldReferrals - a.stats.soldReferrals
    return b.stats.appointmentsBooked - a.stats.appointmentsBooked
  })
  return ranked[0] ?? null
}
