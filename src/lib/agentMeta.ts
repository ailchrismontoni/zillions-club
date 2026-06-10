import type { AgentRole, AgentStatus, ReferralStatus } from '@/types'
import type { Badge } from '@/components/ui/Badge'

/** Short suffix shown after an agent name in the production board. */
export const ROLE_ABBREV: Record<AgentRole, string> = {
  'Regional General Agent': 'RGA',
  'Master General Agent': 'MGA',
  'General Agent': 'GA',
  'Supervising Agent': 'SA',
  'Career Agent': 'CA',
}

/** Hierarchy color for an agent name (spreadsheet style). */
export function agentNameClass(role: AgentRole): string {
  switch (role) {
    case 'Master General Agent':
    case 'Regional General Agent':
      return 'font-bold text-electric-600'
    case 'General Agent':
      return 'font-bold text-red-600'
    case 'Supervising Agent':
      return 'font-semibold text-sky-600'
    default:
      return 'text-ink'
  }
}

export function agentDisplayName(fullName: string, role: AgentRole): string {
  const abbr = ROLE_ABBREV[role]
  return abbr ? `${fullName}, ${abbr}` : fullName
}

/** Pill colors for the rank badge (org-chart style). */
export const RANK_BADGE: Record<AgentRole, string> = {
  'Regional General Agent': 'bg-amber-100 text-amber-700',
  'Master General Agent': 'bg-amber-100 text-amber-700',
  'General Agent': 'bg-violet-100 text-violet-700',
  'Supervising Agent': 'bg-sky-100 text-sky-700',
  'Career Agent': 'bg-slate-100 text-slate-500',
}

type Tone = Parameters<typeof Badge>[0]['tone']

export const AGENT_STATUS_TONE: Record<AgentStatus, Tone> = {
  Active: 'green',
  Onboarding: 'blue',
  Licensed: 'purple',
  Training: 'amber',
  Inactive: 'neutral',
}

export const REFERRAL_STATUS_TONE: Record<ReferralStatus, Tone> = {
  New: 'blue',
  Contacted: 'amber',
  'AI Sent': 'purple',
  'Appointment Booked': 'green',
  Sat: 'blue',
  Sold: 'green',
  'Not Sold': 'red',
  Stale: 'orange',
  'Invalid Phone': 'red',
}
