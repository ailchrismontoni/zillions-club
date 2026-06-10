import { useMemo } from 'react'
import { Bell, CheckCircle2, Circle, Pencil, Repeat } from 'lucide-react'
import type { Announcement } from '@/types'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { PRIORITY_META, audienceLabel, isTargeted, recurrenceSummary } from '@/lib/announcements'
import { cn } from '@/lib/utils'
import { formatShortDate, relativeTime } from '@/lib/dateRanges'

export function AnnouncementDetailModal({ announcement: a, onClose, onEdit }: { announcement: Announcement | null; onClose: () => void; onEdit: (a: Announcement) => void }) {
  const agents = useAppStore((s) => s.agents)
  const teams = useAppStore((s) => s.teams)
  const receipts = useAppStore((s) => s.readReceipts)
  const { can } = useAuth()
  const isAdmin = can('edit_announcements') || can('view_all_users')

  const stats = useMemo(() => {
    if (!a) return null
    const recipients = agents.filter((ag) => isTargeted(a, ag))
    const readSet = new Set(receipts.filter((r) => r.announcementId === a.id).map((r) => r.userId))
    const read = recipients.filter((ag) => readSet.has(ag.id))
    const unread = recipients.filter((ag) => !readSet.has(ag.id))
    return { recipients, read, unread, rate: recipients.length ? Math.round((read.length / recipients.length) * 100) : 0 }
  }, [a, agents, receipts])

  if (!a) return null
  const pri = PRIORITY_META[a.priority]

  return (
    <Modal open={Boolean(a)} onClose={onClose} className="max-w-2xl">
      <div className="-mt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {a.pinned && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">Pinned</span>}
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', pri.badge)}>{pri.label}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{audienceLabel(a, teams)}</span>
          {a.sendPushNotification && <span className="inline-flex items-center gap-1 rounded-full bg-electric-50 px-2 py-0.5 text-[10px] font-bold text-electric-600"><Bell className="h-2.5 w-2.5" /> Push {/* status */}</span>}
        </div>

        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">{a.title}</h2>
        <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-slate-400">
          <Avatar name={a.createdByName} size="xs" />
          <span className="font-semibold text-slate-500">{a.createdByName}</span>
          <span>·</span>
          <span>{relativeTime(a.publishAt ?? a.createdAt)}</span>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-600">{a.body}</p>

        {a.recurring && a.recurrenceRule && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-violet-50 px-3.5 py-2.5 text-[13px] font-semibold text-violet-700">
            <Repeat className="h-4 w-4" /> {recurrenceSummary(a.recurrenceRule)}
            {a.nextSendAt && <span className="ml-auto text-[11.5px] font-medium text-violet-500">Next: {formatShortDate(a.nextSendAt)}</span>}
          </div>
        )}

        {/* Admin read receipts */}
        {isAdmin && stats && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-4 gap-2">
              <Stat label="Recipients" value={stats.recipients.length} />
              <Stat label="Read" value={stats.read.length} tone="green" />
              <Stat label="Unread" value={stats.unread.length} tone="amber" />
              <Stat label="Read rate" value={`${stats.rate}%`} tone="blue" />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${stats.rate}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReceiptList title={`Read (${stats.read.length})`} names={stats.read.map((x) => x.fullName)} icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />} />
              <ReceiptList title={`Not read (${stats.unread.length})`} names={stats.unread.map((x) => x.fullName)} icon={<Circle className="h-3.5 w-3.5 text-slate-300" />} />
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          {can('edit_announcements') && <Button variant="primary" onClick={() => { onEdit(a) }}><Pencil className="h-4 w-4" /> Edit</Button>}
        </div>
      </div>
    </Modal>
  )
}

function Stat({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'green' | 'amber' | 'blue' }) {
  const tones = { default: 'text-ink', green: 'text-emerald-600', amber: 'text-amber-600', blue: 'text-electric-600' }
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
      <p className={cn('text-xl font-extrabold tabular', tones[tone])}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  )
}
function ReceiptList({ title, names, icon }: { title: string; names: string[]; icon: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      <div className="max-h-36 space-y-1 overflow-y-auto">
        {names.length === 0 && <p className="text-[12px] text-slate-300">—</p>}
        {names.map((n) => (
          <p key={n} className="flex items-center gap-1.5 text-[12.5px] text-slate-600">{icon} {n}</p>
        ))}
      </div>
    </div>
  )
}
