import { useEffect, useMemo, useState } from 'react'
import { Megaphone, Pin, Search } from 'lucide-react'
import type { Announcement } from '@/types'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { isTargeted } from '@/lib/announcements'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/utils'
import { AnnouncementCard } from '@/components/announcements/AnnouncementCard'
import { AnnouncementComposerModal } from '@/components/announcements/AnnouncementComposerModal'
import { AnnouncementDetailModal } from '@/components/announcements/AnnouncementDetailModal'

export function AnnouncementsPage() {
  const announcements = useAppStore((s) => s.announcements)
  const receipts = useAppStore((s) => s.readReceipts)
  const processScheduled = useAppStore((s) => s.processScheduledAnnouncements)
  const markRead = useAppStore((s) => s.markAnnouncementRead)
  const deleteAnnouncement = useAppStore((s) => s.deleteAnnouncement)
  const stopRecurring = useAppStore((s) => s.stopRecurring)
  const { agent, can } = useAuth()

  const canCreate = can('create_announcements')
  const canSeeAll = can('edit_announcements') || can('create_announcements')

  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('')
  const [readFilter, setReadFilter] = useState('')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [scheduledOnly, setScheduledOnly] = useState(false)
  const [recurringOnly, setRecurringOnly] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [detail, setDetail] = useState<Announcement | null>(null)
  const [confirm, setConfirm] = useState<{ title: string; message: string; confirmLabel: string; onConfirm: () => void } | null>(null)

  // Background scheduler — publish due + advance recurring.
  useEffect(() => {
    processScheduled()
    const t = window.setInterval(processScheduled, 20000)
    return () => window.clearInterval(t)
  }, [processScheduled])

  const readSet = useMemo(() => new Set(receipts.filter((r) => r.userId === agent?.id).map((r) => r.announcementId)), [receipts, agent])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return announcements
      .filter((a) => {
        if (!canSeeAll && !(a.status === 'published' && agent && isTargeted(a, agent))) return false
        if (canSeeAll && a.status === 'archived' && !scheduledOnly) {
          // hide archived from the default feed unless explicitly searched
          if (!q) return false
        }
        if (q && ![a.title, a.body, a.createdByName].join(' ').toLowerCase().includes(q)) return false
        if (priority && a.priority !== priority) return false
        if (pinnedOnly && !a.pinned) return false
        if (scheduledOnly && a.status !== 'scheduled') return false
        if (recurringOnly && !a.recurring) return false
        if (readFilter === 'unread' && readSet.has(a.id)) return false
        if (readFilter === 'read' && !readSet.has(a.id)) return false
        return true
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return new Date(b.publishAt ?? b.createdAt).getTime() - new Date(a.publishAt ?? a.createdAt).getTime()
      })
  }, [announcements, canSeeAll, agent, search, priority, pinnedOnly, scheduledOnly, recurringOnly, readFilter, readSet])

  const pinned = visible.filter((a) => a.pinned)
  const rest = visible.filter((a) => !a.pinned)

  function openDetail(a: Announcement) {
    setDetail(a)
    if (agent && a.status === 'published') markRead(a.id, agent.id)
  }

  function cardProps(a: Announcement) {
    return {
      announcement: a,
      read: readSet.has(a.id),
      onOpen: () => openDetail(a),
      onEdit: () => { setEditing(a); setComposerOpen(true) },
      onReceipts: () => setDetail(a),
      onRequestDelete: () => setConfirm({ title: 'Delete announcement', message: `Are you sure you want to delete "${a.title}"? This cannot be undone.`, confirmLabel: 'Delete', onConfirm: () => deleteAnnouncement(a.id) }),
      onRequestStop: () => setConfirm({ title: 'Stop recurring announcement', message: `Stop the recurring schedule for "${a.title}"? It will no longer auto-post.`, confirmLabel: 'Stop recurring', onConfirm: () => stopRecurring(a.id) }),
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Important updates from your agency."
        actions={
          canCreate ? (
            <Button variant="primary" size="sm" onClick={() => { setEditing(null); setComposerOpen(true) }}>
              <Megaphone className="h-3.5 w-3.5" /> New Announcement
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search announcements…" className="h-9 pl-9" />
        </div>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="h-9 lg:w-36" options={[{ label: 'All priority', value: '' }, { label: 'Normal', value: 'normal' }, { label: 'Important', value: 'important' }, { label: 'Urgent', value: 'urgent' }]} />
        <Select value={readFilter} onChange={(e) => setReadFilter(e.target.value)} className="h-9 lg:w-32" options={[{ label: 'All', value: '' }, { label: 'Unread', value: 'unread' }, { label: 'Read', value: 'read' }]} />
        <div className="flex items-center gap-1.5">
          <FilterPill active={pinnedOnly} onClick={() => setPinnedOnly((v) => !v)}>Pinned</FilterPill>
          <FilterPill active={recurringOnly} onClick={() => setRecurringOnly((v) => !v)}>Recurring</FilterPill>
          {canSeeAll && <FilterPill active={scheduledOnly} onClick={() => setScheduledOnly((v) => !v)}>Scheduled</FilterPill>}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements" description={canCreate ? 'Post your first announcement to reach the team.' : 'Nothing here yet — check back soon.'} />
      ) : (
        <div className="space-y-5">
          {pinned.length > 0 && (
            <div className="space-y-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600"><Pin className="h-3 w-3" /> Pinned</p>
              {pinned.map((a) => <AnnouncementCard key={a.id} {...cardProps(a)} />)}
            </div>
          )}
          <div className="space-y-2.5">
            {pinned.length > 0 && rest.length > 0 && <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">All announcements</p>}
            {rest.map((a) => <AnnouncementCard key={a.id} {...cardProps(a)} />)}
          </div>
        </div>
      )}

      <AnnouncementComposerModal open={composerOpen} onClose={() => { setComposerOpen(false); setEditing(null) }} editing={editing} />
      <AnnouncementDetailModal announcement={detail} onClose={() => setDetail(null)} onEdit={(a) => { setDetail(null); setEditing(a); setComposerOpen(true) }} />
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel}
        danger
        onConfirm={() => confirm?.onConfirm()}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn('rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all', active ? 'border-ink bg-ink text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
      {children}
    </button>
  )
}
