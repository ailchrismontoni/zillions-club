import type { Announcement } from '@/types'
import { CURRENT_AGENT_ID } from './seed'
import { computeNextSendAt } from '@/lib/announcements'

const now = new Date()
const iso = (d: Date) => d.toISOString()
const daysAgo = (n: number) => iso(new Date(now.getTime() - n * 86400000))

function recurring(
  base: Omit<Announcement, 'nextSendAt' | 'lastSentAt' | 'recurringActive'>,
): Announcement {
  return {
    ...base,
    recurringActive: true,
    lastSentAt: daysAgo(3),
    nextSendAt: base.recurrenceRule ? iso(computeNextSendAt(base.recurrenceRule, now)) : null,
  }
}

const AUTHOR = { createdByUserId: CURRENT_AGENT_ID, createdByName: 'Chris Montoni' }

export const SEED_ANNOUNCEMENTS: Announcement[] = [
  recurring({
    id: 'ann-1',
    title: 'Monday Pipeline Call',
    body: 'Everyone needs to be on the Monday pipeline call at 8PM EST. Come prepared with your updates and numbers.',
    ...AUTHOR,
    audienceType: 'all_agency',
    priority: 'important',
    pinned: true,
    sendPushNotification: true,
    pushTitle: 'New Announcement: Monday Pipeline Call',
    pushBody: 'Be on the Monday pipeline call at 8PM EST. Come ready with your numbers.',
    status: 'published',
    publishAt: daysAgo(7),
    recurring: true,
    recurrenceRule: { frequency: 'weekly', interval: 1, dayOfWeek: 'monday', time: '20:00', timezone: 'America/New_York' },
    createdAt: daysAgo(30),
    updatedAt: daysAgo(3),
  }),
  recurring({
    id: 'ann-2',
    title: 'Submit Your Daily Numbers',
    body: 'Make sure your daily numbers are submitted before the end of the night so leadership can track production accurately.',
    ...AUTHOR,
    audienceType: 'all_agency',
    priority: 'normal',
    pinned: false,
    sendPushNotification: true,
    status: 'published',
    publishAt: daysAgo(5),
    recurring: true,
    recurrenceRule: { frequency: 'weekly', interval: 1, dayOfWeek: 'friday', time: '18:00', timezone: 'America/New_York' },
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  }),
  recurring({
    id: 'ann-3',
    title: 'Monthly Leadership Push',
    body: 'New month, new scoreboard. Leaders should review team goals, onboarding progress, and recruiting targets.',
    ...AUTHOR,
    audienceType: 'leaders_only',
    priority: 'urgent',
    pinned: true,
    sendPushNotification: true,
    status: 'published',
    publishAt: daysAgo(2),
    recurring: true,
    recurrenceRule: { frequency: 'monthly', interval: 1, dayOfMonth: 1, time: '09:00', timezone: 'America/New_York' },
    createdAt: daysAgo(60),
    updatedAt: daysAgo(2),
  }),
  {
    id: 'ann-4',
    title: 'Q3 Convention Registration Is Open',
    body: 'Registration for the Q3 agency convention is now open. Lock in your spot — top producers get front-row seating and a private leadership dinner.',
    ...AUTHOR,
    audienceType: 'all_agency',
    priority: 'important',
    pinned: false,
    sendPushNotification: false,
    status: 'published',
    publishAt: daysAgo(1),
    recurring: false,
    recurrenceRule: null,
    recurringActive: false,
    lastSentAt: daysAgo(1),
    nextSendAt: null,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
]
