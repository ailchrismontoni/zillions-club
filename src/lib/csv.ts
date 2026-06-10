import type { Referral } from '@/types'

const COLUMNS: { key: keyof Referral; label: string }[] = [
  { key: 'agentName', label: 'Agent' },
  { key: 'teamName', label: 'Team' },
  { key: 'name', label: 'Name' },
  { key: 'relation', label: 'Relation' },
  { key: 'city', label: 'City' },
  { key: 'occupation', label: 'Occupation' },
  { key: 'household', label: 'Household' },
  { key: 'spouse', label: 'Spouse' },
  { key: 'phone', label: 'Phone' },
  { key: 'sponsor', label: 'Sponsor' },
  { key: 'notes', label: 'Notes' },
  { key: 'status', label: 'Status' },
  { key: 'source', label: 'Source' },
]

function escapeCell(value: unknown): string {
  const str = value == null ? '' : String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function referralsToCsv(referrals: Referral[]): string {
  const header = COLUMNS.map((c) => c.label).join(',')
  const rows = referrals.map((r) =>
    COLUMNS.map((c) => escapeCell(r[c.key])).join(','),
  )
  return [header, ...rows].join('\n')
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
