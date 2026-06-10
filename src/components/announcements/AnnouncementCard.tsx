import {
  CalendarClock,
  Copy,
  Eye,
  MoreVertical,
  Pause,
  Pencil,
  Pin,
  PinOff,
  Play,
  Repeat,
  Bell,
  Archive,
  CircleSlash,
  Trash2,
} from 'lucide-react'
import type { Announcement } from '@/types'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { PRIORITY_META, audienceLabel, recurrenceSummary } from '@/lib/announcements'
import { cn } from '@/lib/utils'
import { formatShortDate, relativeTime } from '@/lib/dateRanges'

interface Props {
  announcement: Announcement
  read: boolean
  onOpen: () => void
  onEdit: () => void
  onRequestDelete: () => void
  onRequestStop: () => void
  onReceipts: () => void
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-500',
  scheduled: 'bg-sky-100 text-sky-700',
  published: '',
  archived: 'bg-slate-100 text-slate-400',
}

export function AnnouncementCard({ announcement: a, read, onOpen, onEdit, onRequestDelete, onRequestStop, onReceipts }: Props) {
  const teams = useAppStore((s) => s.teams)
  const togglePin = useAppStore((s) => s.toggleAnnouncementPin)
  const duplicate = useAppStore((s) => s.duplicateAnnouncement)
  const archive = useAppStore((s) => s.archiveAnnouncement)
  const setRecurringActive = useAppStore((s) => s.setRecurringActive)
  const { can } = useAuth()

  const canEdit = can('edit_announcements')
  const canDelete = can('delete_announcements')
  const canRecur = can('manage_recurring_announcements')
  const isAdmin = canEdit || canDelete || canRecur
  const pri = PRIORITY_META[a.priority]
  const unread = !read && a.status === 'published'

  return (
    <div
      onClick={onOpen}
      className={cn(
        'group relative cursor-pointer rounded-2xl border bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift sm:p-5',
        a.priority === 'urgent' ? 'border-red-200' : 'border-slate-200',
        unread && 'ring-2 ring-electric/30',
      )}
    >
      {/* Left accent for urgent / unread */}
      {(a.priority === 'urgent' || unread) && (
        <span className={cn('absolute left-0 top-4 bottom-4 w-1 rounded-full', a.priority === 'urgent' ? 'bg-red-500' : 'bg-electric')} />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Badges */}
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {a.pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 ring-1 ring-amber-100">
                <Pin className="h-2.5 w-2.5" /> Pinned
              </span>
            )}
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', pri.badge)}>{pri.label}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{audienceLabel(a, teams)}</span>
            {a.recurring && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600 ring-1 ring-violet-100">
                <Repeat className="h-2.5 w-2.5" /> {a.recurrenceRule?.frequency === 'monthly' ? 'Monthly' : 'Weekly'}
              </span>
            )}
            {a.sendPushNotification && (
              <span className="inline-flex items-center gap-1 rounded-full bg-electric-50 px-2 py-0.5 text-[10px] font-bold text-electric-600">
                <Bell className="h-2.5 w-2.5" /> Push
              </span>
            )}
            {a.status !== 'published' && (
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold capitalize', STATUS_BADGE[a.status])}>{a.status}</span>
            )}
            {unread && <span className="rounded-full bg-electric px-2 py-0.5 text-[10px] font-bold text-white">New</span>}
          </div>

          <h3 className={cn('truncate text-[16px] tracking-tight', unread ? 'font-extrabold text-ink' : 'font-bold text-ink')}>{a.title}</h3>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-500">{a.body}</p>

          {a.recurring && a.recurrenceRule && (
            <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium text-violet-600">
              <CalendarClock className="h-3.5 w-3.5" /> {recurrenceSummary(a.recurrenceRule)}
              {a.recurring && a.recurringActive === false && <span className="ml-1 rounded bg-slate-100 px-1.5 text-slate-500">Paused</span>}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2 text-[11.5px] text-slate-400">
            <Avatar name={a.createdByName} size="xs" />
            <span className="font-semibold text-slate-500">{a.createdByName}</span>
            <span>·</span>
            <span>{a.status === 'scheduled' && a.publishAt ? `Scheduled ${formatShortDate(a.publishAt)}` : relativeTime(a.publishAt ?? a.createdAt)}</span>
          </div>
        </div>

        {isAdmin && (
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              align="right"
              trigger={() => (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink">
                  <MoreVertical className="h-4 w-4" />
                </span>
              )}
            >
              {(close) => (
                <>
                  {canEdit && <DropdownItem onClick={() => { onEdit(); close() }}><Pencil className="h-4 w-4" /> Edit</DropdownItem>}
                  {canEdit && <DropdownItem onClick={() => { togglePin(a.id); close() }}>{a.pinned ? <><PinOff className="h-4 w-4" /> Unpin</> : <><Pin className="h-4 w-4" /> Pin</>}</DropdownItem>}
                  {canEdit && <DropdownItem onClick={() => { duplicate(a.id); close() }}><Copy className="h-4 w-4" /> Duplicate</DropdownItem>}
                  <DropdownItem onClick={() => { onReceipts(); close() }}><Eye className="h-4 w-4" /> View read receipts</DropdownItem>
                  {a.recurring && canRecur && (
                    <DropdownItem onClick={() => { setRecurringActive(a.id, !(a.recurringActive ?? true)); close() }}>
                      {a.recurringActive === false ? <><Play className="h-4 w-4" /> Resume recurring</> : <><Pause className="h-4 w-4" /> Pause recurring</>}
                    </DropdownItem>
                  )}
                  {a.recurring && canRecur && (
                    <DropdownItem onClick={() => { close(); onRequestStop() }}><CircleSlash className="h-4 w-4" /> Stop recurring</DropdownItem>
                  )}
                  {canEdit && a.status !== 'archived' && <DropdownItem onClick={() => { archive(a.id); close() }}><Archive className="h-4 w-4" /> Archive</DropdownItem>}
                  {canDelete && (
                    <DropdownItem className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => { close(); onRequestDelete() }}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownItem>
                  )}
                </>
              )}
            </Dropdown>
          </div>
        )}
      </div>
    </div>
  )
}
