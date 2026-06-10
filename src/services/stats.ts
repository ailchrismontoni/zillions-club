import type { ProductionEntry, UserGoals } from '@/types'
import { inRange, type DateRange } from '@/lib/dateRanges'

export const DEFAULT_GOALS: UserGoals = {
  monthlyAlpGoal: 25000,
  yearlyAlpGoal: 300000,
  monthlySalesGoal: 12,
  monthlyReferralGoal: 40,
  monthlyAppointmentsGoal: 40,
}

export interface StatTotals {
  totalAlp: number
  totalReferralAlp: number
  appointmentsScheduled: number
  appointmentsSat: number
  dealsSold: number
  refsCollected: number
  refsSeen: number
  refsSold: number
  dials: number
  projectedAppointments: number
  familiesProtected: number
  // Derived
  closingRatio: number
  averageAlpPerDeal: number
  averageRefsPerSit: number
  referralCloseRatio: number
  entryCount: number
}

const num = (v: number | undefined) => v ?? 0

/** Aggregate production entries (optionally within a date range) into stats. */
export function computeStats(entries: ProductionEntry[], range?: DateRange): StatTotals {
  const rows = range ? entries.filter((e) => inRange(e.date, range)) : entries

  const t: StatTotals = {
    totalAlp: 0, totalReferralAlp: 0, appointmentsScheduled: 0, appointmentsSat: 0,
    dealsSold: 0, refsCollected: 0, refsSeen: 0, refsSold: 0, dials: 0, projectedAppointments: 0,
    familiesProtected: 0, closingRatio: 0, averageAlpPerDeal: 0, averageRefsPerSit: 0, referralCloseRatio: 0,
    entryCount: rows.length,
  }

  for (const e of rows) {
    t.totalAlp += num(e.alp)
    t.totalReferralAlp += num(e.referralAlp)
    t.appointmentsScheduled += num(e.appointmentsSet)
    t.appointmentsSat += num(e.presentationsSat)
    t.dealsSold += num(e.salesCount)
    t.refsCollected += num(e.referralsCollected)
    t.refsSeen += num(e.referralsSat)
    t.refsSold += num(e.referralSales)
    t.dials += num(e.dials) || num(e.callsMade)
    t.projectedAppointments += num(e.projectedAppointments)
    t.familiesProtected += num(e.familiesProtected)
  }

  t.closingRatio = t.appointmentsSat > 0 ? t.dealsSold / t.appointmentsSat : 0
  t.averageAlpPerDeal = t.dealsSold > 0 ? t.totalAlp / t.dealsSold : 0
  t.averageRefsPerSit = t.appointmentsSat > 0 ? t.refsCollected / t.appointmentsSat : 0
  t.referralCloseRatio = t.refsSeen > 0 ? t.refsSold / t.refsSeen : 0

  return t
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** 12-month series of a metric for a given year. */
export function monthlySeries(
  entries: ProductionEntry[],
  year: number,
  pick: (e: ProductionEntry) => number,
): { label: string; value: number }[] {
  const buckets = MONTHS.map((label) => ({ label, value: 0 }))
  for (const e of entries) {
    const d = new Date(e.date)
    if (d.getFullYear() === year) buckets[d.getMonth()].value += pick(e)
  }
  return buckets
}
