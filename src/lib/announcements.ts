import type {
  Agent,
  Announcement,
  AnnouncementAudience,
  AnnouncementPriority,
  DayOfWeek,
  RecurrenceRule,
  Team,
} from '@/types'

export const PRIORITY_META: Record<AnnouncementPriority, { label: string; badge: string; tone: 'neutral' | 'amber' | 'red' }> = {
  normal: { label: 'Normal', badge: 'bg-slate-100 text-slate-600', tone: 'neutral' },
  important: { label: 'Important', badge: 'bg-amber-100 text-amber-700', tone: 'amber' },
  urgent: { label: 'Urgent', badge: 'bg-red-100 text-red-700', tone: 'red' },
}

export const DAYS_OF_WEEK: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const DOW_INDEX: Record<DayOfWeek, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }

export function audienceLabel(a: Announcement, teams?: Team[]): string {
  switch (a.audienceType) {
    case 'all_agency':
      return 'All Agency'
    case 'leaders_only':
      return 'Leaders Only'
    case 'specific_teams': {
      const ids = a.targetTeamIds ?? []
      if (teams && ids.length === 1) return teams.find((t) => t.id === ids[0])?.name ?? '1 team'
      return `${ids.length} team${ids.length === 1 ? '' : 's'}`
    }
    case 'specific_users': {
      const n = a.targetUserIds?.length ?? 0
      return `${n} user${n === 1 ? '' : 's'}`
    }
  }
}

export const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string }[] = [
  { value: 'all_agency', label: 'Entire agency' },
  { value: 'specific_teams', label: 'Specific teams' },
  { value: 'specific_users', label: 'Specific users' },
  { value: 'leaders_only', label: 'Leaders only' },
]

export function isLeaderRole(agent: Agent): boolean {
  return ['owner', 'admin', 'leader'].includes(agent.platformRole ?? 'agent')
}

/** Whether an announcement targets a given agent. */
export function isTargeted(a: Announcement, agent: Agent): boolean {
  switch (a.audienceType) {
    case 'all_agency':
      return true
    case 'leaders_only':
      return isLeaderRole(agent)
    case 'specific_teams':
      return (a.targetTeamIds ?? []).includes(agent.teamId)
    case 'specific_users':
      return (a.targetUserIds ?? []).includes(agent.id)
  }
}

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(':').map((n) => parseInt(n, 10))
  return { h: h || 0, m: m || 0 }
}

export function formatTime12(time: string): string {
  const { h, m } = parseTime(time)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

const TZ_SHORT: Record<string, string> = {
  'America/New_York': 'EST',
  'America/Chicago': 'CST',
  'America/Denver': 'MST',
  'America/Los_Angeles': 'PST',
}
export function tzShort(tz: string): string {
  return TZ_SHORT[tz] ?? tz
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

export function recurrenceSummary(rule: RecurrenceRule): string {
  const time = `${formatTime12(rule.time)} ${tzShort(rule.timezone)}`
  if (rule.frequency === 'weekly') {
    const day = (rule.dayOfWeek ?? 'monday')
    const cap = day.charAt(0).toUpperCase() + day.slice(1)
    const every = rule.interval > 1 ? `every ${rule.interval} weeks on ` : 'every '
    return `Repeats ${every}${cap} at ${time}`
  }
  const every = rule.interval > 1 ? `every ${rule.interval} months on the ` : 'every month on the '
  return `Repeats ${every}${ordinal(rule.dayOfMonth ?? 1)} at ${time}`
}

/** Next occurrence strictly after `from`. Timezone is treated as local (demo). */
export function computeNextSendAt(rule: RecurrenceRule, from: Date = new Date()): Date {
  const { h, m } = parseTime(rule.time)
  if (rule.frequency === 'weekly') {
    const target = DOW_INDEX[rule.dayOfWeek ?? 'monday']
    const cur = new Date(from)
    cur.setHours(h, m, 0, 0)
    const diff = (target - cur.getDay() + 7) % 7
    cur.setDate(cur.getDate() + diff)
    if (cur.getTime() <= from.getTime()) cur.setDate(cur.getDate() + 7 * Math.max(1, rule.interval))
    return cur
  }
  const day = rule.dayOfMonth ?? 1
  let cur = new Date(from.getFullYear(), from.getMonth(), day, h, m, 0, 0)
  if (cur.getTime() <= from.getTime()) {
    cur = new Date(from.getFullYear(), from.getMonth() + Math.max(1, rule.interval), day, h, m, 0, 0)
  }
  return cur
}

export function defaultPushTitle(title: string): string {
  return `New Announcement: ${title}`
}
export function defaultPushBody(body: string): string {
  return body.length > 120 ? body.slice(0, 117).trimEnd() + '…' : body
}
