import { useMemo } from 'react'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { isTargeted } from '@/lib/announcements'

/** Count of published announcements targeted to the current user that they haven't read. */
export function useUnreadAnnouncements(): number {
  const { agent } = useAuth()
  const announcements = useAppStore((s) => s.announcements)
  const receipts = useAppStore((s) => s.readReceipts)

  return useMemo(() => {
    if (!agent) return 0
    const read = new Set(receipts.filter((r) => r.userId === agent.id).map((r) => r.announcementId))
    return announcements.filter((a) => a.status === 'published' && isTargeted(a, agent) && !read.has(a.id)).length
  }, [agent, announcements, receipts])
}

/** Unread in-app notifications for the current user. */
export function useUnreadNotifications() {
  const { agent } = useAuth()
  const notifications = useAppStore((s) => s.notifications)
  return useMemo(() => {
    if (!agent) return []
    return notifications.filter((n) => n.userId === agent.id && !n.read)
  }, [agent, notifications])
}
