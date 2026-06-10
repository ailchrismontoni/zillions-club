import { useMemo } from 'react'
import { useAppStore } from '@/app/store'
import {
  computeAgentStats,
  computeAllAgentStats,
} from '@/services/agentStats'
import {
  computeAgencyTotals,
  computeTeamStats,
  producerLeaderboard,
  refSalesChampion,
  topProducer,
} from '@/services/teamStats'
import type { AgentWithStats } from '@/types'

/** All agents with their computed stats (memoized off base data). */
export function useAgentsWithStats(): AgentWithStats[] {
  const agents = useAppStore((s) => s.agents)
  const production = useAppStore((s) => s.production)
  const referrals = useAppStore((s) => s.referrals)
  return useMemo(
    () => computeAllAgentStats(agents, production, referrals),
    [agents, production, referrals],
  )
}

/** A single agent + stats by id. */
export function useAgentWithStats(agentId: string | undefined) {
  const agents = useAppStore((s) => s.agents)
  const production = useAppStore((s) => s.production)
  const referrals = useAppStore((s) => s.referrals)
  return useMemo(() => {
    if (!agentId) return null
    const agent = agents.find((a) => a.id === agentId)
    if (!agent) return null
    return { agent, stats: computeAgentStats(agentId, production, referrals) }
  }, [agentId, agents, production, referrals])
}

/** Dashboard-level derived data. */
export function useDashboardData() {
  const agentsWithStats = useAgentsWithStats()
  const teams = useAppStore((s) => s.teams)
  const unread = useAppStore((s) => s.unreadAnnouncements)

  return useMemo(() => {
    const teamStats = computeTeamStats(teams, agentsWithStats)
    return {
      totals: computeAgencyTotals(agentsWithStats, unread),
      producers: producerLeaderboard(agentsWithStats),
      teams: teamStats,
      topProducer: topProducer(agentsWithStats),
      champion: refSalesChampion(agentsWithStats),
    }
  }, [agentsWithStats, teams, unread])
}

export function useTeamStats() {
  const agentsWithStats = useAgentsWithStats()
  const teams = useAppStore((s) => s.teams)
  return useMemo(() => computeTeamStats(teams, agentsWithStats), [teams, agentsWithStats])
}
