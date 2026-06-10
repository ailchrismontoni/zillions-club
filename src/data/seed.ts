import type {
  Agent,
  AgentRole,
  AgentStatus,
  AIActivity,
  ContractLevel,
  Household,
  InviteCode,
  ProductionEntry,
  Referral,
  ReferralStatus,
  Team,
  UserAccount,
} from '@/types'
import { DEFAULT_PERMISSIONS } from '@/lib/permissions'

// Deterministic PRNG so the seeded agency looks identical on first load.
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = mulberry32(20260609)
const rand = (min: number, max: number) => min + rng() * (max - min)
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))
const pick = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)]

function isoDaysAgo(days: number, jitterHours = 0): string {
  const d = new Date()
  d.setHours(9 + randInt(0, 8), randInt(0, 59), 0, 0)
  d.setDate(d.getDate() - days)
  if (jitterHours) d.setHours(d.getHours() - jitterHours)
  return d.toISOString()
}

function id(prefix: string, n: number | string): string {
  return `${prefix}_${n}`
}

// ─────────────────────────────────────────────────────────────────────────
// Teams + agent blueprints
// ─────────────────────────────────────────────────────────────────────────
interface AgentSeed {
  first: string
  last: string
  teamKey: string
  role: AgentRole
  contract: ContractLevel
  status: AgentStatus
  location: string
  startDaysAgo: number
  sponsor: string
  weeklyTarget: number // approx weekly ALP this week
  refCount: number
  aiSent: number
  booked: number
  sold: number
}

const TEAM_KEYS = [
  { key: 'montoni', name: 'Team Montoni' },
  { key: 'hogan', name: 'Team Hogan' },
  { key: 'mickovic', name: 'Team Mickovic' },
  { key: 'nixon', name: 'Team Nixon' },
  { key: 'dean', name: 'Team Dean' },
  { key: 'pronschinske', name: 'Team Pronschinske' },
]

const AGENT_SEEDS: AgentSeed[] = [
  { first: 'Chris', last: 'Montoni', teamKey: 'montoni', role: 'Regional General Agent', contract: '95%', status: 'Active', location: 'Cleveland, OH', startDaysAgo: 1180, sponsor: 'Agency', weeklyTarget: 3800, refCount: 24, aiSent: 9, booked: 4, sold: 6 },
  { first: 'Connor', last: 'Hogan', teamKey: 'hogan', role: 'General Agent', contract: '90%', status: 'Active', location: 'Columbus, OH', startDaysAgo: 920, sponsor: 'Chris Montoni', weeklyTarget: 6500, refCount: 40, aiSent: 12, booked: 5, sold: 9 },
  { first: 'Joseph', last: 'Benincaso', teamKey: 'hogan', role: 'Supervising Agent', contract: '80%', status: 'Active', location: 'Akron, OH', startDaysAgo: 540, sponsor: 'Connor Hogan', weeklyTarget: 3500, refCount: 33, aiSent: 14, booked: 6, sold: 14 },
  { first: 'Mitch', last: 'Mickovic', teamKey: 'mickovic', role: 'General Agent', contract: '90%', status: 'Active', location: 'Pittsburgh, PA', startDaysAgo: 870, sponsor: 'Chris Montoni', weeklyTarget: 4100, refCount: 21, aiSent: 7, booked: 3, sold: 5 },
  { first: 'Dane', last: 'Nixon', teamKey: 'nixon', role: 'General Agent', contract: '85%', status: 'Active', location: 'St. Louis, MO', startDaysAgo: 760, sponsor: 'Chris Montoni', weeklyTarget: 3200, refCount: 26, aiSent: 10, booked: 4, sold: 5 },
  { first: 'Santino', last: 'Ciocca', teamKey: 'montoni', role: 'Career Agent', contract: '70%', status: 'Licensed', location: 'Cleveland, OH', startDaysAgo: 210, sponsor: 'Chris Montoni', weeklyTarget: 1700, refCount: 14, aiSent: 5, booked: 2, sold: 2 },
  { first: 'Luke', last: 'Hollingshead', teamKey: 'nixon', role: 'Career Agent', contract: '70%', status: 'Active', location: 'Springfield, MO', startDaysAgo: 300, sponsor: 'Dane Nixon', weeklyTarget: 1500, refCount: 18, aiSent: 6, booked: 2, sold: 3 },
  { first: 'Christian', last: 'Albro', teamKey: 'mickovic', role: 'Career Agent', contract: '65%', status: 'Onboarding', location: 'Pittsburgh, PA', startDaysAgo: 28, sponsor: 'Mitch Mickovic', weeklyTarget: 1200, refCount: 9, aiSent: 3, booked: 1, sold: 1 },
  { first: 'Derex', last: 'Dean', teamKey: 'dean', role: 'General Agent', contract: '85%', status: 'Active', location: 'Indianapolis, IN', startDaysAgo: 640, sponsor: 'Chris Montoni', weeklyTarget: 1000, refCount: 11, aiSent: 4, booked: 1, sold: 2 },
  { first: 'Nicholas', last: 'Stephens', teamKey: 'hogan', role: 'Career Agent', contract: '70%', status: 'Active', location: 'Columbus, OH', startDaysAgo: 160, sponsor: 'Connor Hogan', weeklyTarget: 1900, refCount: 16, aiSent: 5, booked: 2, sold: 3 },
  { first: 'Austin', last: 'Cramey', teamKey: 'pronschinske', role: 'Supervising Agent', contract: '75%', status: 'Active', location: 'Madison, WI', startDaysAgo: 400, sponsor: 'Chris Montoni', weeklyTarget: 2400, refCount: 19, aiSent: 8, booked: 3, sold: 4 },
  { first: 'Steve', last: 'Villanueva', teamKey: 'nixon', role: 'Career Agent', contract: '70%', status: 'Training', location: 'St. Louis, MO', startDaysAgo: 75, sponsor: 'Dane Nixon', weeklyTarget: 2900, refCount: 13, aiSent: 4, booked: 2, sold: 3 },
]

// ─────────────────────────────────────────────────────────────────────────
// Build agents + teams
// ─────────────────────────────────────────────────────────────────────────
function agentId(seed: AgentSeed): string {
  return id('agent', `${seed.first}_${seed.last}`.toLowerCase())
}

const nowIso = new Date().toISOString()

export const SEED_AGENTS: Agent[] = AGENT_SEEDS.map((s) => {
  const teamName = TEAM_KEYS.find((t) => t.key === s.teamKey)!.name
  return {
    id: agentId(s),
    firstName: s.first,
    lastName: s.last,
    fullName: `${s.first} ${s.last}`,
    email: `${s.first.toLowerCase()}.${s.last.toLowerCase()}@zillionsclub.com`,
    phone: `(${randInt(200, 989)}) ${randInt(200, 989)}-${randInt(1000, 9999)}`,
    location: s.location,
    teamId: id('team', s.teamKey),
    teamName,
    role: s.role,
    contractLevel: s.contract,
    status: s.status,
    startDate: isoDaysAgo(s.startDaysAgo),
    sponsor: s.sponsor,
    notes: '',
    createdAt: isoDaysAgo(s.startDaysAgo),
    updatedAt: nowIso,
  }
})

// Rank seniority for picking the most senior agent as a team's leader.
const RANK_SENIORITY: Record<string, number> = {
  'Regional General Agent': 5,
  'Master General Agent': 4,
  'General Agent': 3,
  'Supervising Agent': 2,
  'Career Agent': 1,
}

export const SEED_TEAMS: Team[] = TEAM_KEYS.map((t) => {
  const members = SEED_AGENTS.filter((a) => a.teamId === id('team', t.key))
  const leader = members
    .slice()
    .sort((a, b) => (RANK_SENIORITY[b.role] ?? 0) - (RANK_SENIORITY[a.role] ?? 0))[0]
  return {
    id: id('team', t.key),
    name: t.name,
    leaderAgentId: leader.id,
    leaderName: leader.fullName,
    createdAt: isoDaysAgo(1200),
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Production history — generate per agent across recent weeks
// ─────────────────────────────────────────────────────────────────────────
function buildProductionFor(agent: Agent, seed: AgentSeed): ProductionEntry[] {
  const entries: ProductionEntry[] = []
  const today = new Date()
  const dayOfWeek = today.getDay()

  // 5 weeks of history (week 0 = this week)
  for (let week = 0; week < 5; week++) {
    const weekFactor = week === 0 ? 1 : rand(0.65, 1.05)
    const weekTarget = seed.weeklyTarget * weekFactor
    // Number of producing days this week
    const maxDaysAgoThisWeek = week === 0 ? dayOfWeek : 6
    const producingDays = randInt(2, Math.max(2, Math.min(4, maxDaysAgoThisWeek + 1)))
    let remaining = weekTarget

    for (let i = 0; i < producingDays; i++) {
      const isLast = i === producingDays - 1
      const portion = isLast ? remaining : remaining * rand(0.3, 0.6)
      remaining -= portion
      const alp = Math.round(portion / 10) * 10
      if (alp <= 0) continue

      const dayOffsetInWeek = randInt(0, maxDaysAgoThisWeek)
      const daysAgo = week * 7 + dayOffsetInWeek
      const salesCount = Math.max(1, Math.round(alp / rand(1300, 1900)))
      const appointmentsSet = salesCount + randInt(1, 4)
      const appointmentsShowed = Math.max(salesCount, appointmentsSet - randInt(0, 2))
      const presentationsSat = appointmentsShowed

      entries.push({
        id: id('prod', `${agent.id}_${week}_${i}`),
        agentId: agent.id,
        date: isoDaysAgo(daysAgo),
        alp,
        familiesProtected: salesCount,
        salesCount,
        presentationsSat,
        appointmentsSet,
        appointmentsShowed,
        callsMade: randInt(35, 90),
        talkTimeMinutes: randInt(60, 220),
        referralsCollected: randInt(0, 5),
        notes: '',
        createdAt: isoDaysAgo(daysAgo),
        updatedAt: isoDaysAgo(daysAgo),
      })
    }
  }
  return entries
}

export const SEED_PRODUCTION: ProductionEntry[] = SEED_AGENTS.flatMap((agent) =>
  buildProductionFor(agent, AGENT_SEEDS.find((s) => agentId(s) === agent.id)!),
)

// ─────────────────────────────────────────────────────────────────────────
// Referrals — each tied to an agent, with realistic status distribution
// ─────────────────────────────────────────────────────────────────────────
const FIRST_NAMES = ['Marc', 'Bob', 'Kevin', 'Harold', 'Aaron', 'Spencer', 'Tyler', 'Jordan', 'Dylan', 'Brandon', 'Cole', 'Trevor', 'Mason', 'Caleb', 'Ethan', 'Logan', 'Hunter', 'Gavin', 'Wyatt', 'Brody', 'Drew', 'Shane', 'Cody', 'Blake', 'Reed', 'Tanner', 'Garrett', 'Chase', 'Bryce', 'Colton']
const LAST_NAMES = ['Salvaggi', 'Martinez', 'Reed', 'Walsh', 'Carter', 'Bishop', 'Foster', 'Greer', 'Hale', 'Ingram', 'Jensen', 'Keller', 'Lowe', 'Mercer', 'Novak', 'Pratt', 'Quinn', 'Ramsey', 'Sutton', 'Vance']
const RELATIONS = ['Brother', 'Friend', 'Cousin', 'Coworker', 'Neighbor', 'Brother-in-law', 'Old teammate', 'Gym buddy']
const OCCUPATIONS = ['Firefighter', 'Electrician', 'Police Officer', 'Teacher', 'Plumber', 'Nurse', 'Mechanic', 'Welder', 'Union Worker', 'Sales Rep']
const CITIES = ['Cleveland', 'Columbus', 'Akron', 'Pittsburgh', 'St. Louis', 'Indianapolis', 'Madison', 'Toledo', 'Dayton', 'Cincinnati']
const HOUSEHOLDS: Household[] = ['Single', 'Married', 'Family']
const SOURCES = ['Door knock', 'Warm market', 'Social', 'Event', 'Client referral']

function buildReferralsFor(agent: Agent, seed: AgentSeed): { referrals: Referral[]; activity: AIActivity[] } {
  const referrals: Referral[] = []
  const activity: AIActivity[] = []

  // Plan statuses: sold, booked, aiSent(messaging), contacted, new, stale, invalid
  let remainingAiSent = seed.aiSent
  let remainingBooked = seed.booked
  let remainingSold = seed.sold

  for (let i = 0; i < seed.refCount; i++) {
    const first = pick(FIRST_NAMES)
    const last = pick(LAST_NAMES)
    const married = pick(HOUSEHOLDS)
    const createdDaysAgo = randInt(0, 34)
    const validPhone = rng() > 0.12
    const phone = validPhone
      ? `${randInt(200, 989)}${randInt(200, 989)}${randInt(1000, 9999)}`
      : `${randInt(10, 99)}${randInt(100, 999)}` // too short → invalid

    let status: ReferralStatus = 'New'
    let aiStatus: Referral['aiStatus'] = 'none'
    let aiSentAt: string | null = null
    let appointmentBookedAt: string | null = null
    let appointmentDate: string | null = null
    let lastContactedAt: string | null = null
    let error: string | null = null

    if (!validPhone && remainingAiSent > 0) {
      status = 'Invalid Phone'
      aiStatus = 'invalid'
      error = 'Use a valid SMS-capable phone number.'
    } else if (remainingSold > 0 && i % 3 === 0) {
      status = 'Sold'
      aiStatus = remainingAiSent > 0 ? 'booked' : 'none'
      remainingSold--
      lastContactedAt = isoDaysAgo(randInt(0, createdDaysAgo))
      if (aiStatus === 'booked') {
        aiSentAt = isoDaysAgo(createdDaysAgo - 1)
        appointmentBookedAt = isoDaysAgo(Math.max(0, createdDaysAgo - 3))
        appointmentDate = isoDaysAgo(-randInt(1, 5))
        remainingAiSent = Math.max(0, remainingAiSent - 1)
        remainingBooked = Math.max(0, remainingBooked - 1)
      }
    } else if (remainingBooked > 0) {
      status = 'Appointment Booked'
      aiStatus = 'booked'
      aiSentAt = isoDaysAgo(createdDaysAgo - 1 < 0 ? 0 : createdDaysAgo - 1)
      appointmentBookedAt = isoDaysAgo(Math.max(0, createdDaysAgo - 2))
      appointmentDate = isoDaysAgo(-randInt(1, 6))
      remainingBooked--
      remainingAiSent = Math.max(0, remainingAiSent - 1)
    } else if (remainingAiSent > 0) {
      status = 'AI Sent'
      aiStatus = 'messaging'
      aiSentAt = isoDaysAgo(Math.max(0, createdDaysAgo - 1))
      lastContactedAt = aiSentAt
      remainingAiSent--
    } else {
      const roll = rng()
      if (roll > 0.7 && createdDaysAgo > 2) {
        status = 'Contacted'
        lastContactedAt = isoDaysAgo(randInt(0, createdDaysAgo))
      } else if (roll > 0.5 && createdDaysAgo > 4) {
        status = 'Stale'
      } else {
        status = 'New'
      }
    }

    const ref: Referral = {
      id: id('ref', `${agent.id}_${i}`),
      agentId: agent.id,
      agentName: agent.fullName,
      teamId: agent.teamId,
      teamName: agent.teamName,
      name: `${first} ${last}`,
      relation: pick(RELATIONS),
      city: pick(CITIES),
      occupation: pick(OCCUPATIONS),
      household: married,
      spouse: married === 'Married' ? pick(FIRST_NAMES) : '',
      phone,
      sponsor: agent.fullName,
      notes: rng() > 0.6 ? `${pick(['has 3 kids', 'works overtime', 'wants final expense', 'referred by client', 'union member'])}` : '',
      status,
      aiStatus,
      createdAt: isoDaysAgo(createdDaysAgo),
      updatedAt: isoDaysAgo(Math.max(0, createdDaysAgo - 1)),
      lastContactedAt,
      aiSentAt,
      appointmentBookedAt,
      appointmentDate,
      source: pick(SOURCES),
      error,
    }
    referrals.push(ref)

    if (aiSentAt) {
      activity.push({
        id: id('act', `${ref.id}_sent`),
        agentId: agent.id,
        referralId: ref.id,
        type: 'sent',
        message: `Sent ${ref.name} to AgentOutreach`,
        status: 'AI Sent',
        createdAt: aiSentAt,
      })
    }
    if (appointmentBookedAt) {
      activity.push({
        id: id('act', `${ref.id}_booked`),
        agentId: agent.id,
        referralId: ref.id,
        type: 'booked',
        message: `AgentOutreach booked an appointment with ${ref.name}`,
        status: 'Appointment Booked',
        createdAt: appointmentBookedAt,
      })
    }
    if (error) {
      activity.push({
        id: id('act', `${ref.id}_fail`),
        agentId: agent.id,
        referralId: ref.id,
        type: 'invalid',
        message: `Could not send ${ref.name}: invalid phone`,
        status: 'Invalid Phone',
        createdAt: ref.createdAt,
      })
    }
  }

  return { referrals, activity }
}

const referralBuild = SEED_AGENTS.map((agent) =>
  buildReferralsFor(agent, AGENT_SEEDS.find((s) => agentId(s) === agent.id)!),
)

export const SEED_REFERRALS: Referral[] = referralBuild.flatMap((b) => b.referrals)
export const SEED_AI_ACTIVITY: AIActivity[] = referralBuild
  .flatMap((b) => b.activity)
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

// The default/owner agent is Chris Montoni.
export const CURRENT_AGENT_ID = SEED_AGENTS[0].id

// Derive the upline (leaderId): top owner → null; team leaders → owner; members → their team leader.
for (const a of SEED_AGENTS) {
  const team = SEED_TEAMS.find((t) => t.id === a.teamId)
  const teamLeader = team?.leaderAgentId
  a.leaderId =
    a.id === CURRENT_AGENT_ID
      ? null
      : a.id === teamLeader
        ? CURRENT_AGENT_ID
        : teamLeader ?? CURRENT_AGENT_ID
}

// Assign platform roles + default permissions (RBAC): owner, team leaders, everyone else.
const LEADER_IDS = new Set(SEED_TEAMS.map((t) => t.leaderAgentId))
for (const a of SEED_AGENTS) {
  a.platformRole = a.id === CURRENT_AGENT_ID ? 'owner' : LEADER_IDS.has(a.id) ? 'leader' : 'agent'
  a.permissions = DEFAULT_PERMISSIONS[a.platformRole]
}

// ─────────────────────────────────────────────────────────────────────────
// Invite codes — one per team
// ─────────────────────────────────────────────────────────────────────────
const INVITE_MAP: { code: string; key: string }[] = [
  // Default agency code — routes to Team Montoni.
  { code: 'ZILLIONS', key: 'montoni' },
  { code: 'MONTONI25', key: 'montoni' },
  { code: 'HOGAN25', key: 'hogan' },
  { code: 'MICKOVIC25', key: 'mickovic' },
  { code: 'NIXON25', key: 'nixon' },
  { code: 'DEAN25', key: 'dean' },
  { code: 'PRON25', key: 'pronschinske' },
]

/** The agency-wide default invite code shown during onboarding. */
export const DEFAULT_INVITE_CODE = 'ZILLIONS'

export const SEED_INVITE_CODES: InviteCode[] = INVITE_MAP.map((m) => {
  const team = SEED_TEAMS.find((t) => t.id === id('team', m.key))!
  return {
    id: id('invite', m.code),
    code: m.code,
    teamId: team.id,
    teamName: team.name,
    createdBy: 'Chris Montoni',
    active: true,
    usageCount: 0,
    createdAt: isoDaysAgo(200),
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Seed admin account (linked to Chris Montoni's existing agent)
// ─────────────────────────────────────────────────────────────────────────
export const SEED_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'acct_admin',
    agentId: CURRENT_AGENT_ID,
    firstName: 'Chris',
    lastName: 'Montoni',
    fullName: 'Chris Montoni',
    email: 'admin@zillionsclub.com',
    phone: SEED_AGENTS[0].phone,
    passwordHash: 'password123',
    role: 'owner',
    accountStatus: 'Active',
    teamId: SEED_AGENTS[0].teamId,
    teamName: SEED_AGENTS[0].teamName,
    sponsor: 'Agency',
    inviteCode: '',
    onboardingComplete: true,
    createdAt: isoDaysAgo(1180),
    updatedAt: nowIso,
    lastLoginAt: null,
  },
]
