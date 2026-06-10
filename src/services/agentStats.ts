import type {
  Agent,
  AgentWithStats,
  ComputedAgentStats,
  ProductionEntry,
  Referral,
} from '@/types'
import { inRange, thisMonth, thisWeek } from '@/lib/dateRanges'

/**
 * Pure computation of an agent's stats from base data. This is the heart of
 * the data-correlation system: every surface (profile, dashboard, leaderboards)
 * reads from here, so any new production/referral/AI activity flows everywhere.
 */
export function computeAgentStats(
  agentId: string,
  production: ProductionEntry[],
  referrals: Referral[],
  now = new Date(),
): ComputedAgentStats {
  const week = thisWeek(now)
  const month = thisMonth(now)

  const myProd = production.filter((p) => p.agentId === agentId)
  const myRefs = referrals.filter((r) => r.agentId === agentId)

  let weeklyAlp = 0
  let monthlyAlp = 0
  let totalAlp = 0
  let totalFamilies = 0
  let weeklyFamilies = 0
  let salesCount = 0
  let appointmentsSet = 0
  let appointmentsSat = 0
  let appointmentsShowed = 0
  let presentationsSat = 0
  let callsMade = 0
  let talkTimeMinutes = 0
  let lastActivity = 0

  for (const p of myProd) {
    totalAlp += p.alp
    totalFamilies += p.familiesProtected
    salesCount += p.salesCount
    appointmentsSet += p.appointmentsSet
    appointmentsShowed += p.appointmentsShowed
    presentationsSat += p.presentationsSat
    callsMade += p.callsMade
    talkTimeMinutes += p.talkTimeMinutes
    const t = new Date(p.date).getTime()
    if (t > lastActivity) lastActivity = t
    if (inRange(p.date, week)) {
      weeklyAlp += p.alp
      weeklyFamilies += p.familiesProtected
    }
    if (inRange(p.date, month)) monthlyAlp += p.alp
  }
  appointmentsSat = appointmentsShowed

  // Referral-derived stats
  const referralsCollected = myRefs.length
  const referralsSentToAI = myRefs.filter((r) => Boolean(r.aiSentAt)).length
  const appointmentsBooked = myRefs.filter((r) => Boolean(r.appointmentBookedAt)).length
  const soldReferrals = myRefs.filter((r) => r.status === 'Sold').length

  for (const r of myRefs) {
    const t = new Date(r.updatedAt).getTime()
    if (t > lastActivity) lastActivity = t
  }

  const showRate = appointmentsSet > 0 ? appointmentsShowed / appointmentsSet : 0
  const closeRate = presentationsSat > 0 ? salesCount / presentationsSat : 0
  const averageAlpPerSale = salesCount > 0 ? totalAlp / salesCount : 0

  return {
    agentId,
    weeklyAlp,
    monthlyAlp,
    totalAlp,
    totalFamiliesProtected: totalFamilies,
    weeklyFamiliesProtected: weeklyFamilies,
    salesCount,
    referralsCollected,
    referralsSentToAI,
    appointmentsBooked,
    appointmentsSet,
    appointmentsSat,
    showRate,
    closeRate,
    averageAlpPerSale,
    callsMade,
    talkTimeMinutes,
    soldReferrals,
    lastActivityAt: lastActivity ? new Date(lastActivity).toISOString() : null,
  }
}

export function computeAllAgentStats(
  agents: Agent[],
  production: ProductionEntry[],
  referrals: Referral[],
  now = new Date(),
): AgentWithStats[] {
  return agents.map((agent) => ({
    agent,
    stats: computeAgentStats(agent.id, production, referrals, now),
  }))
}

/** Weekly ALP buckets for the last 7 days, for an agent's overview chart. */
export function weeklyProductionSeries(
  agentId: string,
  production: ProductionEntry[],
  now = new Date(),
): { label: string; value: number }[] {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const base = new Date(now)
  base.setHours(0, 0, 0, 0)
  const buckets: { label: string; value: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    buckets.push({ label: days[d.getDay()], value: 0 })
  }
  const myProd = production.filter((p) => p.agentId === agentId)
  for (const p of myProd) {
    const pd = new Date(p.date)
    pd.setHours(0, 0, 0, 0)
    const diff = Math.round((base.getTime() - pd.getTime()) / 86400000)
    if (diff >= 0 && diff <= 6) {
      buckets[6 - diff].value += p.alp
    }
  }
  return buckets
}
