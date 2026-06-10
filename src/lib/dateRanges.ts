export interface DateRange {
  start: Date
  end: Date
}

/** Start of the week (Sunday 00:00) containing `d`. */
export function startOfWeek(d: Date): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  out.setDate(out.getDate() - out.getDay())
  return out
}

export function endOfWeek(d: Date): Date {
  const start = startOfWeek(d)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return end
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1)
}

export function thisWeek(now = new Date()): DateRange {
  return { start: startOfWeek(now), end: endOfWeek(now) }
}

export function lastWeek(now = new Date()): DateRange {
  const start = startOfWeek(now)
  start.setDate(start.getDate() - 7)
  const end = startOfWeek(now)
  return { start, end }
}

export function thisMonth(now = new Date()): DateRange {
  return { start: startOfMonth(now), end: endOfMonth(now) }
}

export function lastMonth(now = new Date()): DateRange {
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = startOfMonth(now)
  return { start, end }
}

export function thisYear(now = new Date()): DateRange {
  return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) }
}

export function inRange(iso: string, range: DateRange): boolean {
  const t = new Date(iso).getTime()
  return t >= range.start.getTime() && t < range.end.getTime()
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function formatRangeLabel(range: DateRange): string {
  const end = new Date(range.end)
  end.setDate(end.getDate() - 1)
  return `${MONTHS[range.start.getMonth()]} ${range.start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}`
}

/** Last `n` day-buckets ending today, oldest first. Returns {label, start, end}. */
export function lastNDays(n: number, now = new Date()): { label: string; date: Date }[] {
  const out: { label: string; date: Date }[] = []
  const base = new Date(now)
  base.setHours(0, 0, 0, 0)
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    out.push({ label: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()], date: d })
  }
  return out
}

/** Monday 00:00 of the week containing `d` (Mon–Sun weeks). */
export function mondayOf(d: Date): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  const day = out.getDay() // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day
  out.setDate(out.getDate() + diff)
  return out
}

/** The 7 day-start Dates (Mon..Sun) for the week containing `d`, offset by weeks. */
export function weekDays(d: Date, weekOffset = 0): Date[] {
  const start = mondayOf(d)
  start.setDate(start.getDate() + weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start)
    day.setDate(day.getDate() + i)
    return day
  })
}

/** Whole-day difference (0..6) of `iso` from a Monday start, or -1 if outside. */
export function dayIndexInWeek(iso: string, weekStart: Date): number {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - weekStart.getTime()) / 86400000)
  return diff >= 0 && diff <= 6 ? diff : -1
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatShortDate(iso)
}
