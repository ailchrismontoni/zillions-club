import { useEffect, useMemo, useState } from 'react'
import { Megaphone } from 'lucide-react'
import type {
  Agent,
  Announcement,
  AnnouncementAudience,
  AnnouncementPriority,
  DayOfWeek,
  RecurrenceRule,
} from '@/types'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  AUDIENCE_OPTIONS,
  DAYS_OF_WEEK,
  computeNextSendAt,
  defaultPushBody,
  defaultPushTitle,
  isTargeted,
} from '@/lib/announcements'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Field } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'

const TIMEZONES = [
  { label: 'Eastern (EST)', value: 'America/New_York' },
  { label: 'Central (CST)', value: 'America/Chicago' },
  { label: 'Mountain (MST)', value: 'America/Denver' },
  { label: 'Pacific (PST)', value: 'America/Los_Angeles' },
]

type PublishMode = 'now' | 'schedule' | 'draft'

interface Draft {
  title: string
  body: string
  priority: AnnouncementPriority
  pinned: boolean
  audienceType: AnnouncementAudience
  targetTeamIds: string[]
  targetUserIds: string[]
  publishMode: PublishMode
  publishDate: string
  publishTime: string
  recurring: boolean
  frequency: 'weekly' | 'monthly'
  interval: number
  dayOfWeek: DayOfWeek
  dayOfMonth: number
  recurTime: string
  timezone: string
  endsOnDate: boolean
  endDate: string
  sendPush: boolean
  pushTitle: string
  pushBody: string
}

const todayInput = () => new Date().toISOString().slice(0, 10)

function emptyDraft(): Draft {
  return {
    title: '', body: '', priority: 'normal', pinned: false,
    audienceType: 'all_agency', targetTeamIds: [], targetUserIds: [],
    publishMode: 'now', publishDate: todayInput(), publishTime: '09:00',
    recurring: false, frequency: 'weekly', interval: 1, dayOfWeek: 'monday', dayOfMonth: 1,
    recurTime: '20:00', timezone: 'America/New_York', endsOnDate: false, endDate: '',
    sendPush: true, pushTitle: '', pushBody: '',
  }
}

function Toggle({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(!checked)} className={cn('flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all', disabled ? 'cursor-not-allowed border-slate-100 opacity-50' : checked ? 'border-electric bg-electric-50' : 'border-slate-200 hover:bg-slate-50')}>
      <span>
        <span className="block text-[13.5px] font-bold text-ink">{label}</span>
        {hint && <span className="block text-[12px] text-slate-500">{hint}</span>}
      </span>
      <span className={cn('relative h-6 w-10 shrink-0 rounded-full transition-colors', checked ? 'bg-electric' : 'bg-slate-200')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
      </span>
    </button>
  )
}

export function AnnouncementComposerModal({ open, onClose, editing }: { open: boolean; onClose: () => void; editing?: Announcement | null }) {
  const teams = useAppStore((s) => s.teams)
  const agents = useAppStore((s) => s.agents)
  const createAnnouncement = useAppStore((s) => s.createAnnouncement)
  const updateAnnouncement = useAppStore((s) => s.updateAnnouncement)
  const publishAnnouncement = useAppStore((s) => s.publishAnnouncement)
  const { agent: actor, can } = useAuth()
  const { toast } = useToast()

  const [d, setD] = useState<Draft>(emptyDraft())
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (editing) {
      const r = editing.recurrenceRule
      setD({
        title: editing.title, body: editing.body, priority: editing.priority, pinned: editing.pinned,
        audienceType: editing.audienceType, targetTeamIds: editing.targetTeamIds ?? [], targetUserIds: editing.targetUserIds ?? [],
        publishMode: editing.status === 'scheduled' ? 'schedule' : editing.status === 'draft' ? 'draft' : 'now',
        publishDate: editing.publishAt ? editing.publishAt.slice(0, 10) : todayInput(),
        publishTime: editing.publishAt ? editing.publishAt.slice(11, 16) : '09:00',
        recurring: editing.recurring, frequency: r?.frequency ?? 'weekly', interval: r?.interval ?? 1,
        dayOfWeek: r?.dayOfWeek ?? 'monday', dayOfMonth: r?.dayOfMonth ?? 1, recurTime: r?.time ?? '20:00',
        timezone: r?.timezone ?? 'America/New_York', endsOnDate: Boolean(r?.endDate), endDate: r?.endDate?.slice(0, 10) ?? '',
        sendPush: editing.sendPushNotification, pushTitle: editing.pushTitle ?? '', pushBody: editing.pushBody ?? '',
      })
    } else {
      setD(emptyDraft())
    }
    setError('')
  }, [open, editing])

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setD((p) => ({ ...p, [k]: v }))
  }
  function toggleId(list: 'targetTeamIds' | 'targetUserIds', id: string) {
    setD((p) => ({ ...p, [list]: p[list].includes(id) ? p[list].filter((x) => x !== id) : [...p[list], id] }))
  }

  // Estimate recipients for the push-confirmation hint.
  const recipientCount = useMemo(() => {
    const preview: Announcement = { ...(editing ?? ({} as Announcement)), audienceType: d.audienceType, targetTeamIds: d.targetTeamIds, targetUserIds: d.targetUserIds } as Announcement
    return agents.filter((ag: Agent) => isTargeted(preview, ag)).length
  }, [agents, d.audienceType, d.targetTeamIds, d.targetUserIds, editing])

  function save() {
    if (!d.title.trim()) { setError('Title is required.'); return }
    if (!d.body.trim()) { setError('Message is required.'); return }

    const status: Announcement['status'] = d.publishMode === 'now' ? 'published' : d.publishMode === 'schedule' ? 'scheduled' : 'draft'
    const publishAt = d.publishMode === 'schedule' ? new Date(`${d.publishDate}T${d.publishTime}:00`).toISOString() : d.publishMode === 'now' ? new Date().toISOString() : null
    const recurrenceRule: RecurrenceRule | null = d.recurring
      ? {
          frequency: d.frequency, interval: Math.max(1, d.interval),
          dayOfWeek: d.frequency === 'weekly' ? d.dayOfWeek : undefined,
          dayOfMonth: d.frequency === 'monthly' ? d.dayOfMonth : undefined,
          time: d.recurTime, timezone: d.timezone,
          endDate: d.endsOnDate && d.endDate ? new Date(`${d.endDate}T23:59:00`).toISOString() : null,
        }
      : null

    const base = {
      title: d.title.trim(), body: d.body.trim(), priority: d.priority, pinned: d.pinned,
      createdByUserId: actor?.id ?? 'system', createdByName: actor?.fullName ?? 'Admin',
      audienceType: d.audienceType,
      targetTeamIds: d.audienceType === 'specific_teams' ? d.targetTeamIds : undefined,
      targetUserIds: d.audienceType === 'specific_users' ? d.targetUserIds : undefined,
      sendPushNotification: d.sendPush,
      pushTitle: d.sendPush ? (d.pushTitle.trim() || defaultPushTitle(d.title)) : undefined,
      pushBody: d.sendPush ? (d.pushBody.trim() || defaultPushBody(d.body)) : undefined,
      status, publishAt, recurring: d.recurring, recurrenceRule,
    }

    if (editing) {
      updateAnnouncement(editing.id, {
        ...base,
        recurringActive: d.recurring,
        nextSendAt: recurrenceRule ? computeNextSendAt(recurrenceRule).toISOString() : null,
      })
      if (status === 'published' && editing.status !== 'published') publishAnnouncement(editing.id)
      toast({ title: 'Announcement updated', variant: 'success' })
    } else {
      createAnnouncement(base)
      toast({
        title: status === 'published' ? 'Announcement posted' : status === 'scheduled' ? 'Announcement scheduled' : 'Draft saved',
        description: d.sendPush && status === 'published' ? `Notified ${recipientCount} users` : undefined,
        variant: 'success',
      })
    }
    onClose()
  }

  const canSchedule = can('schedule_announcements')
  const canRecur = can('manage_recurring_announcements')
  const canPush = can('send_push_notifications')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Announcement' : 'New Announcement'}
      description="Post an important message to your agency."
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            <Megaphone className="h-4 w-4" />
            {d.publishMode === 'now' ? 'Publish' : d.publishMode === 'schedule' ? 'Schedule' : 'Save draft'}
          </Button>
        </>
      }
    >
      <div className="max-h-[64vh] space-y-5 overflow-y-auto pr-1">
        {/* Content */}
        <Section title="Content">
          <Field label="Title" required error={error.includes('Title') ? error : undefined}>
            <Input value={d.title} onChange={(e) => { set('title', e.target.value); setError('') }} placeholder="Monday Pipeline Call" autoFocus />
          </Field>
          <Field label="Message" required error={error.includes('Message') ? error : undefined}>
            <Textarea rows={4} value={d.body} onChange={(e) => { set('body', e.target.value); setError('') }} placeholder="What do you need the team to know?" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <Select value={d.priority} onChange={(e) => set('priority', e.target.value as AnnouncementPriority)} options={[{ label: 'Normal', value: 'normal' }, { label: 'Important', value: 'important' }, { label: 'Urgent', value: 'urgent' }]} />
            </Field>
            <div className="flex items-end">
              <Toggle checked={d.pinned} onChange={(v) => set('pinned', v)} label="Pin announcement" />
            </div>
          </div>
        </Section>

        {/* Audience */}
        <Section title="Audience">
          <Field label="Who should see this?">
            <Select value={d.audienceType} onChange={(e) => set('audienceType', e.target.value as AnnouncementAudience)} options={AUDIENCE_OPTIONS} />
          </Field>
          {d.audienceType === 'specific_teams' && (
            <div className="grid grid-cols-2 gap-1.5">
              {teams.map((t) => (
                <CheckRow key={t.id} checked={d.targetTeamIds.includes(t.id)} onChange={() => toggleId('targetTeamIds', t.id)} label={t.name} />
              ))}
            </div>
          )}
          {d.audienceType === 'specific_users' && (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {agents.map((ag) => (
                <CheckRow key={ag.id} checked={d.targetUserIds.includes(ag.id)} onChange={() => toggleId('targetUserIds', ag.id)} label={`${ag.fullName} · ${ag.teamName}`} />
              ))}
            </div>
          )}
          <p className="text-[12px] text-slate-400">Will reach <span className="font-bold text-slate-600">{recipientCount}</span> users.</p>
        </Section>

        {/* Publish */}
        <Section title="Publish">
          <div className="grid grid-cols-3 gap-2">
            {(['now', 'schedule', 'draft'] as PublishMode[]).map((m) => (
              <button key={m} type="button" disabled={m === 'schedule' && !canSchedule} onClick={() => set('publishMode', m)} className={cn('rounded-xl border px-3 py-2.5 text-[12.5px] font-semibold capitalize transition-all', m === 'schedule' && !canSchedule ? 'cursor-not-allowed opacity-40' : d.publishMode === m ? 'border-electric bg-electric-50 text-electric-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>
                {m === 'now' ? 'Publish now' : m === 'schedule' ? 'Schedule' : 'Save draft'}
              </button>
            ))}
          </div>
          {d.publishMode === 'schedule' && (
            <div className="grid grid-cols-3 gap-3">
              <Field label="Date"><Input type="date" value={d.publishDate} onChange={(e) => set('publishDate', e.target.value)} /></Field>
              <Field label="Time"><Input type="time" value={d.publishTime} onChange={(e) => set('publishTime', e.target.value)} /></Field>
              <Field label="Timezone"><Select value={d.timezone} onChange={(e) => set('timezone', e.target.value)} options={TIMEZONES} /></Field>
            </div>
          )}
        </Section>

        {/* Recurring */}
        <Section title="Recurring">
          <Toggle checked={d.recurring} onChange={(v) => set('recurring', v)} label="Repeat this announcement" hint="Automatically re-post and notify on a schedule" disabled={!canRecur} />
          {d.recurring && (
            <div className="space-y-3 rounded-xl bg-slate-50 p-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Frequency"><Select value={d.frequency} onChange={(e) => set('frequency', e.target.value as 'weekly' | 'monthly')} options={[{ label: 'Weekly', value: 'weekly' }, { label: 'Monthly', value: 'monthly' }]} /></Field>
                <Field label="Every"><Input type="number" min="1" value={d.interval} onChange={(e) => set('interval', Math.max(1, Number(e.target.value)))} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {d.frequency === 'weekly' ? (
                  <Field label="On day"><Select value={d.dayOfWeek} onChange={(e) => set('dayOfWeek', e.target.value as DayOfWeek)} options={DAYS_OF_WEEK.map((dd) => ({ label: dd.charAt(0).toUpperCase() + dd.slice(1), value: dd }))} /></Field>
                ) : (
                  <Field label="On day of month"><Input type="number" min="1" max="28" value={d.dayOfMonth} onChange={(e) => set('dayOfMonth', Math.min(28, Math.max(1, Number(e.target.value))))} /></Field>
                )}
                <Field label="At time"><Input type="time" value={d.recurTime} onChange={(e) => set('recurTime', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Timezone"><Select value={d.timezone} onChange={(e) => set('timezone', e.target.value)} options={TIMEZONES} /></Field>
                <Field label="End date (optional)"><Input type="date" value={d.endDate} onChange={(e) => { set('endDate', e.target.value); set('endsOnDate', Boolean(e.target.value)) }} /></Field>
              </div>
            </div>
          )}
        </Section>

        {/* Push */}
        <Section title="Push Notification">
          <Toggle checked={d.sendPush} onChange={(v) => set('sendPush', v)} label="Send push notification" hint={`Notify ${recipientCount} targeted users`} disabled={!canPush} />
          {d.sendPush && (
            <div className="space-y-3 rounded-xl bg-slate-50 p-3">
              <Field label="Push title"><Input value={d.pushTitle} onChange={(e) => set('pushTitle', e.target.value)} placeholder={defaultPushTitle(d.title || 'Announcement')} /></Field>
              <Field label="Push body"><Textarea rows={2} value={d.pushBody} onChange={(e) => set('pushBody', e.target.value)} placeholder={defaultPushBody(d.body || 'Tap to read the latest announcement.')} /></Field>
            </div>
          )}
        </Section>
      </div>
    </Modal>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" onClick={onChange} className={cn('flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[12.5px] font-medium transition-all', checked ? 'border-electric bg-electric-50 text-electric-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>
      <span className={cn('flex h-4 w-4 items-center justify-center rounded border text-white', checked ? 'border-electric bg-electric' : 'border-slate-300')}>{checked && '✓'}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}
