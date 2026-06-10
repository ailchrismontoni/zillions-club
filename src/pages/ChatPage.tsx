import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, Hash, Plus, Search, Send, Users, X } from 'lucide-react'
import type { Agent, ChatMessage } from '@/types'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { AGENCY_CHAT_ID, dmId, dmOther, dmParticipants, isDm, isParticipant } from '@/lib/chat'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { agentNameClass } from '@/lib/agentMeta'
import { cn } from '@/lib/utils'
import { relativeTime } from '@/lib/dateRanges'

export function ChatPage() {
  const agents = useAppStore((s) => s.agents)
  const messages = useAppStore((s) => s.chatMessages)
  const reads = useAppStore((s) => s.chatReads)
  const sendChatMessage = useAppStore((s) => s.sendChatMessage)
  const markChatRead = useAppStore((s) => s.markChatRead)
  const { agent: me, isOwner } = useAuth()

  const [activeId, setActiveId] = useState(AGENCY_CHAT_ID)
  const [draft, setDraft] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const [newSearch, setNewSearch] = useState('')

  const agentById = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents])
  const lastReadAt = (conv: string) => reads.find((r) => r.userId === me?.id && r.conversationId === conv)?.readAt

  const convMessages = (conv: string) => messages.filter((m) => m.conversationId === conv)
  const lastMessage = (conv: string): ChatMessage | undefined => {
    const list = convMessages(conv)
    return list[list.length - 1]
  }
  const unreadCount = (conv: string) => {
    if (!me) return 0
    const lr = lastReadAt(conv)
    return convMessages(conv).filter((m) => m.senderId !== me.id && (!lr || new Date(m.createdAt) > new Date(lr))).length
  }

  // My DM conversations (those with at least one message I'm part of), newest first.
  const myDmIds = useMemo(() => {
    if (!me) return []
    const set = new Set<string>()
    for (const m of messages) if (isDm(m.conversationId) && dmParticipants(m.conversationId).includes(me.id)) set.add(m.conversationId)
    if (isDm(activeId) && isParticipant(activeId, me.id)) set.add(activeId)
    return [...set].sort((a, b) => new Date(lastMessage(b)?.createdAt ?? 0).getTime() - new Date(lastMessage(a)?.createdAt ?? 0).getTime())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, me, activeId])

  // Owner oversight: every DM in the system.
  const allDmIds = useMemo(() => {
    const set = new Set<string>()
    for (const m of messages) if (isDm(m.conversationId)) set.add(m.conversationId)
    return [...set].sort((a, b) => new Date(lastMessage(b)?.createdAt ?? 0).getTime() - new Date(lastMessage(a)?.createdAt ?? 0).getTime())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])
  const otherDmIds = allDmIds.filter((id) => !myDmIds.includes(id))

  // Mark the active conversation read whenever it (or its messages) change.
  useEffect(() => {
    if (me) markChatRead(activeId, me.id)
  }, [activeId, messages.length, me, markChatRead])

  // Auto-scroll to bottom.
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [activeId, messages.length])

  if (!me) return null

  const canPost = isParticipant(activeId, me.id)
  const active = convMessages(activeId)

  function send() {
    if (!draft.trim() || !me) return
    sendChatMessage(activeId, { id: me.id, name: me.fullName }, draft)
    setDraft('')
  }

  function dmTitle(conv: string) {
    return agentById.get(dmOther(conv, me!.id))?.fullName ?? 'Unknown'
  }
  function pairTitle(conv: string) {
    const [a, b] = dmParticipants(conv)
    return `${agentById.get(a)?.fullName ?? '?'} ↔ ${agentById.get(b)?.fullName ?? '?'}`
  }

  const headerName = activeId === AGENCY_CHAT_ID ? 'Agency Group' : canPost ? dmTitle(activeId) : pairTitle(activeId)
  const headerSub = activeId === AGENCY_CHAT_ID ? `${agents.length} members` : canPost ? agentById.get(dmOther(activeId, me.id))?.teamName ?? '' : 'Monitoring (read-only)'

  return (
    <div className="flex h-[calc(100vh-150px)] min-h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      {/* Sidebar */}
      <div className="flex w-72 shrink-0 flex-col border-r border-slate-200">
        <div className="flex items-center justify-between px-4 py-3.5">
          <h2 className="text-[15px] font-extrabold tracking-tight text-ink">Messages</h2>
          <button onClick={() => setNewOpen((v) => !v)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-white hover:bg-ink-soft" title="New message"><Plus className="h-4 w-4" /></button>
        </div>

        {newOpen && (
          <div className="border-y border-slate-100 bg-slate-50/60 p-2">
            <div className="relative mb-1.5">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input value={newSearch} onChange={(e) => setNewSearch(e.target.value)} placeholder="Search people…" className="h-8 pl-8 text-[13px]" autoFocus />
            </div>
            <div className="max-h-44 space-y-0.5 overflow-y-auto">
              {agents.filter((a) => a.id !== me.id && a.fullName.toLowerCase().includes(newSearch.trim().toLowerCase())).slice(0, 30).map((a) => (
                <button key={a.id} onClick={() => { setActiveId(dmId(me.id, a.id)); setNewOpen(false); setNewSearch('') }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white">
                  <Avatar name={a.fullName} src={a.avatarUrl} size="xs" />
                  <span className="truncate text-[12.5px] font-medium text-ink">{a.fullName}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {/* Channels */}
          <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Channels</p>
          <ConvRow icon={<Hash className="h-4 w-4" />} title="Agency Group" preview={lastMessage(AGENCY_CHAT_ID)?.body} unread={unreadCount(AGENCY_CHAT_ID)} active={activeId === AGENCY_CHAT_ID} onClick={() => setActiveId(AGENCY_CHAT_ID)} />

          {/* My DMs */}
          <p className="px-2 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Direct Messages</p>
          {myDmIds.length === 0 && <p className="px-2 py-1 text-[12px] text-slate-300">No conversations yet</p>}
          {myDmIds.map((id) => {
            const other = agentById.get(dmOther(id, me.id))
            return <ConvRow key={id} avatar={other?.fullName} avatarSrc={other?.avatarUrl} title={other?.fullName ?? 'Unknown'} preview={lastMessage(id)?.body} unread={unreadCount(id)} active={activeId === id} onClick={() => setActiveId(id)} />
          })}

          {/* Owner oversight */}
          {isOwner && otherDmIds.length > 0 && (
            <>
              <p className="flex items-center gap-1 px-2 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-amber-600"><Eye className="h-3 w-3" /> All conversations</p>
              {otherDmIds.map((id) => (
                <ConvRow key={id} icon={<Users className="h-4 w-4" />} title={pairTitle(id)} preview={lastMessage(id)?.body} active={activeId === id} onClick={() => setActiveId(id)} small />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3">
          {activeId === AGENCY_CHAT_ID ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white"><Hash className="h-4.5 w-4.5" /></span>
          ) : (
            <Avatar name={headerName} size="sm" />
          )}
          <div className="min-w-0">
            <p className="truncate text-[14px] font-bold text-ink">{headerName}</p>
            <p className="truncate text-[11.5px] text-slate-400">{headerSub}</p>
          </div>
          {!canPost && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600"><Eye className="h-3 w-3" /> Owner view</span>}
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/40 px-5 py-5">
          {active.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <Send className="mb-2 h-7 w-7 text-slate-300" />
              <p className="text-[13px] font-medium">No messages yet — say hello 👋</p>
            </div>
          )}
          {active.map((m, i) => {
            const mine = m.senderId === me.id
            const prev = active[i - 1]
            const showMeta = !prev || prev.senderId !== m.senderId
            const sender = agentById.get(m.senderId)
            return (
              <div key={m.id} className={cn('flex items-end gap-2', mine ? 'flex-row-reverse' : '')}>
                {!mine && (showMeta ? <Avatar name={m.senderName} src={sender?.avatarUrl} size="xs" /> : <span className="w-6" />)}
                <div className={cn('max-w-[72%]', mine ? 'items-end' : '')}>
                  {showMeta && !mine && <p className={cn('mb-0.5 ml-1 text-[11px] font-bold', sender ? agentNameClass(sender.role) : 'text-slate-500')}>{m.senderName}</p>}
                  <div className={cn('rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed shadow-sm', mine ? 'rounded-br-md bg-electric text-white' : 'rounded-bl-md bg-white text-ink ring-1 ring-slate-100')}>
                    {m.body}
                  </div>
                  <p className={cn('mt-0.5 text-[10px] text-slate-400', mine ? 'text-right' : 'ml-1')}>{relativeTime(m.createdAt)}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Composer */}
        {canPost ? (
          <div className="flex items-center gap-2 border-t border-slate-200 px-4 py-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={`Message ${activeId === AGENCY_CHAT_ID ? 'the agency' : headerName}…`}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-electric focus:ring-2 focus:ring-electric/20"
            />
            <button onClick={send} disabled={!draft.trim()} className={cn('flex h-11 w-11 items-center justify-center rounded-xl transition-all', draft.trim() ? 'bg-ink text-white hover:bg-ink-soft active:scale-95' : 'bg-slate-100 text-slate-300')}>
              <Send className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-[12.5px] font-medium text-slate-400">
            <Eye className="h-3.5 w-3.5" /> You're viewing this private conversation as the owner. Posting is disabled.
          </div>
        )}
      </div>
    </div>
  )
}

function ConvRow({
  icon, avatar, avatarSrc, title, preview, unread = 0, active, onClick, small,
}: {
  icon?: React.ReactNode
  avatar?: string
  avatarSrc?: string
  title: string
  preview?: string
  unread?: number
  active?: boolean
  onClick: () => void
  small?: boolean
}) {
  return (
    <button onClick={onClick} className={cn('flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors', active ? 'bg-electric-50' : 'hover:bg-slate-50')}>
      {icon ? (
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', active ? 'bg-electric text-white' : 'bg-slate-100 text-slate-500')}>{icon}</span>
      ) : (
        <Avatar name={avatar ?? title} src={avatarSrc} size="md" />
      )}
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-bold text-ink', small ? 'text-[12.5px]' : 'text-[13.5px]')}>{title}</p>
        {preview && <p className="truncate text-[11.5px] text-slate-400">{preview}</p>}
      </div>
      {unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-electric px-1.5 text-[10px] font-bold text-white">{unread}</span>}
    </button>
  )
}
