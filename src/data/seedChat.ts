import type { ChatMessage } from '@/types'
import { SEED_AGENTS } from './seed'
import { AGENCY_CHAT_ID, dmId } from '@/lib/chat'

const byName = (name: string) => SEED_AGENTS.find((a) => a.fullName === name) ?? SEED_AGENTS[0]
const chris = byName('Chris Montoni')
const connor = byName('Connor Hogan')
const joseph = byName('Joseph Benincaso')
const mitch = byName('Mitch Mickovic')
const dane = byName('Dane Nixon')

const now = Date.now()
const minsAgo = (m: number) => new Date(now - m * 60000).toISOString()

let n = 0
const msg = (conversationId: string, from: typeof chris, body: string, minutes: number): ChatMessage => ({
  id: `seedmsg_${n++}`,
  conversationId,
  senderId: from.id,
  senderName: from.fullName,
  body,
  createdAt: minsAgo(minutes),
})

export const SEED_CHAT_MESSAGES: ChatMessage[] = [
  // Agency group chat
  msg(AGENCY_CHAT_ID, chris, "Big week ahead team. Let's push hard and finish strong 💪", 600),
  msg(AGENCY_CHAT_ID, connor, 'Team Hogan is locked in. 4 sits already booked for tomorrow.', 560),
  msg(AGENCY_CHAT_ID, joseph, 'Just wrote $2,400 ALP on a referral. The AI outreach is paying off 🔥', 540),
  msg(AGENCY_CHAT_ID, chris, 'Love to see it Joseph. Everyone get your daily numbers in tonight.', 520),
  msg(AGENCY_CHAT_ID, dane, 'Team Nixon reporting in — 3 deals closed today.', 300),
  msg(AGENCY_CHAT_ID, mitch, 'Reminder: Monday pipeline call at 8PM EST. Be ready.', 120),
  msg(AGENCY_CHAT_ID, connor, 'See everyone on the call 👊', 90),

  // DM: Chris ↔ Connor
  msg(dmId(chris.id, connor.id), chris, 'Connor — great job leading the team this week. Can you mentor the new agents?', 480),
  msg(dmId(chris.id, connor.id), connor, "Absolutely. I'll set up onboarding calls with them this week.", 470),
  msg(dmId(chris.id, connor.id), chris, 'Perfect. Let me know if you need anything from me.', 460),

  // DM: Connor ↔ Joseph (visible to the owner under "All conversations")
  msg(dmId(connor.id, joseph.id), connor, 'Joseph, want to run a joint training session this week?', 200),
  msg(dmId(connor.id, joseph.id), joseph, "Yeah let's do it. I'll bring my referral scripts.", 190),
]
