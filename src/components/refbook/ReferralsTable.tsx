import { useMemo, useState } from 'react'
import { Download, Inbox, Plus, Search } from 'lucide-react'
import type { Referral, ReferralStatus } from '@/types'
import { REFERRAL_STATUSES } from '@/types'
import { useAppStore } from '@/app/store'
import { useToast } from '@/hooks/useToast'
import { useReferralActions } from '@/hooks/useReferralActions'
import { downloadCsv, referralsToCsv } from '@/lib/csv'
import { cn, hoursSince } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { ReferralRow } from './ReferralRow'
import { BulkActionBar } from './BulkActionBar'

const PILLS: ReferralStatus[] = REFERRAL_STATUSES

function isStale(r: Referral): boolean {
  return r.status === 'Stale' || ((r.status === 'New' || r.status === 'Contacted') && (hoursSince(r.createdAt) > 24 || Boolean(r.error)))
}

interface ReferralsTableProps {
  referrals: Referral[]
  showAgent?: boolean
  title?: string
  subtitle?: string
  onAddReferral?: () => void
}

export function ReferralsTable({
  referrals,
  showAgent,
  title = 'All Referrals',
  subtitle,
  onAddReferral,
}: ReferralsTableProps) {
  const updateReferral = useAppStore((s) => s.updateReferral)
  const setReferralStatus = useAppStore((s) => s.setReferralStatus)
  const markContacted = useAppStore((s) => s.markContacted)
  const deleteReferrals = useAppStore((s) => s.deleteReferrals)
  const { toast } = useToast()
  const { sendToAI, sendingIds } = useReferralActions()

  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Set<ReferralStatus>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkSending, setBulkSending] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return referrals.filter((r) => {
      if (q) {
        const hay = [r.name, r.city, r.notes, r.relation, r.occupation, r.sponsor, r.agentName].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (activeFilters.size > 0) {
        const match = [...activeFilters].some((f) => (f === 'Stale' ? isStale(r) : r.status === f))
        if (!match) return false
      }
      return true
    })
  }, [referrals, search, activeFilters])

  const COLUMN_HEADERS = useMemo(
    () => [
      ...(showAgent ? ['Agent'] : []),
      'Name', 'Relation', 'City', 'Occupation', 'Household', 'Spouse', 'Phone', 'Sponsor', 'Notes', 'Status',
    ],
    [showAgent],
  )

  function toggleFilter(p: ReferralStatus) {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }
  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id))
  function toggleAll() {
    setSelected((prev) => {
      if (allSelected) {
        const next = new Set(prev)
        filtered.forEach((r) => next.delete(r.id))
        return next
      }
      return new Set([...prev, ...filtered.map((r) => r.id)])
    })
  }
  function clearSelection() {
    setSelected(new Set())
  }
  function handleExport() {
    downloadCsv(`zillions-referrals-${filtered.length}.csv`, referralsToCsv(filtered))
    toast({ title: 'Export started', description: `${filtered.length} referrals exported.`, variant: 'success' })
  }

  const selectedIds = [...selected]
  function bulkMarkContacted() {
    markContacted(selectedIds)
    toast({ title: `Marked ${selectedIds.length} contacted`, variant: 'success' })
    clearSelection()
  }
  function bulkDelete() {
    deleteReferrals(selectedIds)
    toast({ title: `Deleted ${selectedIds.length} referral(s)`, variant: 'success' })
    clearSelection()
  }
  async function bulkSendAI() {
    setBulkSending(true)
    const targets = referrals.filter((r) => selected.has(r.id))
    for (const r of targets) {
      // eslint-disable-next-line no-await-in-loop
      await sendToAI(r)
    }
    setBulkSending(false)
    clearSelection()
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 px-5 pt-5">
        <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
        <p className="text-[13px] text-slate-500">
          {subtitle ?? 'Click any cell to edit.'}{' '}
          <span className="font-medium text-slate-400">Enter save · Tab next · Esc cancel.</span>
        </p>

        <div className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, city, notes, agent…" className="pl-9" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {PILLS.map((pill) => {
              const active = activeFilters.has(pill)
              return (
                <button
                  key={pill}
                  onClick={() => toggleFilter(pill)}
                  className={cn(
                    'rounded-full border px-2.5 py-1.5 text-[12px] font-semibold transition-all',
                    active ? 'border-ink bg-ink text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  {pill}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pb-3">
          <span className="text-[13px] font-medium text-slate-500">
            <span className="font-bold tabular text-ink">{filtered.length}</span> of {referrals.length} referrals
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            {onAddReferral && (
              <Button variant="primary" size="sm" onClick={onAddReferral}>
                <Plus className="h-3.5 w-3.5" /> Add Referral
              </Button>
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={Inbox} title="No referrals found" description="Try adjusting your search or filters." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur">
              <tr className="border-b border-slate-200">
                <th className="sticky left-0 z-10 bg-slate-50/90 px-3 py-2.5">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-electric" aria-label="Select all" />
                </th>
                {COLUMN_HEADERS.map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((referral) => (
                <ReferralRow
                  key={referral.id}
                  referral={referral}
                  showAgent={showAgent}
                  selected={selected.has(referral.id)}
                  sending={sendingIds.has(referral.id)}
                  onToggle={toggleRow}
                  onUpdate={updateReferral}
                  onStatusChange={setReferralStatus}
                  onSendAI={sendToAI}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BulkActionBar
        count={selected.size}
        sending={bulkSending}
        onMarkContacted={bulkMarkContacted}
        onSendAI={bulkSendAI}
        onDelete={bulkDelete}
        onClear={clearSelection}
      />
    </section>
  )
}
