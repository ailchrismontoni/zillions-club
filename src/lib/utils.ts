/** Tiny classnames joiner (clsx-lite). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Format a number as compact currency, e.g. 4100 -> "$4.1K". */
export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    const k = value / 1000
    const str = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)
    return `$${str}K`
  }
  return `$${value.toLocaleString('en-US')}`
}

/** Format full currency, e.g. 23904 -> "$23,904.00". */
export function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Initials from a name, max 2 chars. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Deterministic gradient pair from a string seed (for avatars). */
const GRADIENTS: [string, string][] = [
  ['#2563ff', '#5b8cff'],
  ['#0b1224', '#1a2748'],
  ['#7c3aed', '#a78bfa'],
  ['#0891b2', '#22d3ee'],
  ['#db2777', '#f472b6'],
  ['#ea580c', '#fb923c'],
  ['#059669', '#34d399'],
  ['#475569', '#94a3b8'],
]

export function gradientFor(seed: string): [string, string] {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

/** Hours elapsed since an ISO timestamp. */
export function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 36e5
}

/** Human "stale" label: "2h stale" / "26d stale". */
export function staleLabel(iso: string): string {
  const hours = hoursSince(iso)
  if (hours < 24) return `${Math.max(1, Math.round(hours))}h stale`
  return `${Math.round(hours / 24)}d stale`
}

/** US SMS-capable phone validation: 10 digits, or 11 starting with 1. */
export function isSmsCapablePhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return true
  if (digits.length === 11 && digits.startsWith('1')) return true
  return false
}

/** Pretty-print a phone number when it has 10/11 digits. */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  if (ten.length === 10) {
    return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`
  }
  return raw
}

/** Format a 0..1 ratio as a percent string, e.g. 0.732 -> "73%". */
export function formatPercent(ratio: number, digits = 0): string {
  if (!isFinite(ratio)) return '—'
  return `${(ratio * 100).toFixed(digits)}%`
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}
