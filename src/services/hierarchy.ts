import type { AgentRole, AgentWithStats } from '@/types'

export interface HierNode {
  data: AgentWithStats
  children: HierNode[]
  depth: number
}

export interface TeamAggregate {
  directCount: number
  totalUnder: number
  weeklyAlp: number
  monthlyAlp: number
  weeklySales: number
  weeklyAppointments: number
  weeklyReferrals: number
}

// Rank seniority for sorting (higher = more senior).
const RANK_ORDER: Record<AgentRole, number> = {
  'Regional General Agent': 5,
  'Master General Agent': 4,
  'General Agent': 3,
  'Supervising Agent': 2,
  'Career Agent': 1,
}

function sortNodes(a: AgentWithStats, b: AgentWithStats): number {
  const r = RANK_ORDER[b.agent.role] - RANK_ORDER[a.agent.role]
  if (r !== 0) return r
  return b.stats.weeklyAlp - a.stats.weeklyAlp
}

/** Build the agency forest from agents' leaderId links. */
export function buildForest(agents: AgentWithStats[]): HierNode[] {
  const byId = new Map(agents.map((a) => [a.agent.id, a]))
  const childrenOf = new Map<string, AgentWithStats[]>()
  const roots: AgentWithStats[] = []

  for (const a of agents) {
    const lid = a.agent.leaderId ?? null
    if (lid && byId.has(lid) && lid !== a.agent.id) {
      if (!childrenOf.has(lid)) childrenOf.set(lid, [])
      childrenOf.get(lid)!.push(a)
    } else {
      roots.push(a)
    }
  }

  const build = (a: AgentWithStats, depth: number): HierNode => ({
    data: a,
    depth,
    children: (childrenOf.get(a.agent.id) ?? []).sort(sortNodes).map((c) => build(c, depth + 1)),
  })

  return roots.sort(sortNodes).map((r) => build(r, 0))
}

/** Flatten a node's entire subtree (excluding the node itself). */
export function descendants(node: HierNode): HierNode[] {
  const out: HierNode[] = []
  const walk = (n: HierNode) => {
    for (const c of n.children) {
      out.push(c)
      walk(c)
    }
  }
  walk(node)
  return out
}

/** Aggregate team production for a leader, including the leader + entire downline. */
export function teamAggregate(node: HierNode): TeamAggregate {
  const subtree = [node, ...descendants(node)]
  return {
    directCount: node.children.length,
    totalUnder: subtree.length - 1,
    weeklyAlp: subtree.reduce((s, n) => s + n.data.stats.weeklyAlp, 0),
    monthlyAlp: subtree.reduce((s, n) => s + n.data.stats.monthlyAlp, 0),
    weeklySales: subtree.reduce((s, n) => s + n.data.stats.salesCount, 0),
    weeklyAppointments: subtree.reduce((s, n) => s + n.data.stats.appointmentsSet, 0),
    weeklyReferrals: subtree.reduce((s, n) => s + n.data.stats.referralsCollected, 0),
  }
}

/** All nodes flattened with depth (for list view / search). */
export function flatten(forest: HierNode[]): HierNode[] {
  const out: HierNode[] = []
  const walk = (n: HierNode) => {
    out.push(n)
    n.children.forEach(walk)
  }
  forest.forEach(walk)
  return out
}

/** Leaders = nodes that have at least one child. */
export function leaders(forest: HierNode[]): HierNode[] {
  return flatten(forest).filter((n) => n.children.length > 0)
}
