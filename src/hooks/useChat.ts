import { useMemo } from 'react'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { AGENCY_CHAT_ID, dmParticipants, isDm } from '@/lib/chat'

/** Total unread chat messages across the user's group + DM conversations. */
export function useUnreadChatCount(): number {
  const { agent } = useAuth()
  const messages = useAppStore((s) => s.chatMessages)
  const reads = useAppStore((s) => s.chatReads)

  return useMemo(() => {
    if (!agent) return 0
    const lastRead = (conv: string) => reads.find((r) => r.userId === agent.id && r.conversationId === conv)?.readAt
    let count = 0
    for (const m of messages) {
      if (m.senderId === agent.id) continue
      const conv = m.conversationId
      const mine = conv === AGENCY_CHAT_ID || (isDm(conv) && dmParticipants(conv).includes(agent.id))
      if (!mine) continue
      const lr = lastRead(conv)
      if (!lr || new Date(m.createdAt).getTime() > new Date(lr).getTime()) count++
    }
    return count
  }, [agent, messages, reads])
}
