// ─────────────────────────────────────────────────────────────────────────
// User
// ─────────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: string
  /** The agent record this user is also an agent of (self). */
  agentId: string
}

// ─────────────────────────────────────────────────────────────────────────
// Agent
// ─────────────────────────────────────────────────────────────────────────
export type AgentStatus =
  | 'Active'
  | 'Onboarding'
  | 'Licensed'
  | 'Training'
  | 'Inactive'

export type AgentRole =
  | 'Regional General Agent'
  | 'Master General Agent'
  | 'General Agent'
  | 'Supervising Agent'
  | 'Career Agent'

export const AGENT_STATUSES: AgentStatus[] = [
  'Active',
  'Onboarding',
  'Licensed',
  'Training',
  'Inactive',
]

export const AGENT_ROLES: AgentRole[] = [
  'Regional General Agent',
  'Master General Agent',
  'General Agent',
  'Supervising Agent',
  'Career Agent',
]

export const CONTRACT_LEVELS = [
  '65%',
  '70%',
  '75%',
  '80%',
  '85%',
  '90%',
  '95%',
] as const
export type ContractLevel = (typeof CONTRACT_LEVELS)[number]

export interface Agent {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  location: string
  avatarUrl?: string
  teamId: string
  teamName: string
  role: AgentRole
  contractLevel: ContractLevel
  status: AgentStatus
  startDate: string
  sponsor: string
  notes: string
  /** Upline — the agent this person reports to. null = top of agency. */
  leaderId?: string | null
  /** Platform access role (RBAC). Distinct from `role` which is the sales rank. */
  platformRole?: UserRole
  permissions?: Permission[]
  goals?: UserGoals
  /** Supabase auth linkage (only set when running with a real backend). */
  authUserId?: string
  onboardingComplete?: boolean
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────────────────────────────────────
// Production
// ─────────────────────────────────────────────────────────────────────────
export interface ProductionEntry {
  id: string
  agentId: string
  date: string // ISO date (day-level)
  alp: number
  familiesProtected: number
  salesCount: number
  presentationsSat: number
  appointmentsSet: number
  appointmentsShowed: number
  callsMade: number
  talkTimeMinutes: number
  referralsCollected: number
  notes: string
  createdAt: string
  updatedAt: string
  // Structured daily-numbers fields (optional for backward compat with seed)
  dials?: number
  referralsSat?: number
  referralSales?: number
  referralAlp?: number
  projectedAppointments?: number
}

// ─────────────────────────────────────────────────────────────────────────
// Referral
// ─────────────────────────────────────────────────────────────────────────
export type ReferralStatus =
  | 'New'
  | 'Contacted'
  | 'AI Sent'
  | 'Appointment Booked'
  | 'Sat'
  | 'Sold'
  | 'Not Sold'
  | 'Stale'
  | 'Invalid Phone'

export const REFERRAL_STATUSES: ReferralStatus[] = [
  'New',
  'Contacted',
  'AI Sent',
  'Appointment Booked',
  'Sat',
  'Sold',
  'Not Sold',
  'Stale',
  'Invalid Phone',
]

export type AIStatus =
  | 'none'
  | 'queued'
  | 'messaging'
  | 'booked'
  | 'failed'
  | 'invalid'

export type Household = 'Single' | 'Married' | 'Family' | 'Other' | ''
export const HOUSEHOLD_OPTIONS: Household[] = ['Single', 'Married', 'Family', 'Other']

export interface Referral {
  id: string
  agentId: string
  agentName: string
  teamId: string
  teamName: string
  name: string
  relation: string
  city: string
  occupation: string
  household: Household
  spouse: string
  phone: string
  sponsor: string
  notes: string
  status: ReferralStatus
  aiStatus: AIStatus
  createdAt: string
  updatedAt: string
  lastContactedAt?: string | null
  aiSentAt?: string | null
  appointmentBookedAt?: string | null
  appointmentDate?: string | null
  source: string
  /** Transient inline error (e.g. failed send). */
  error?: string | null
}

// ─────────────────────────────────────────────────────────────────────────
// AI CRM activity
// ─────────────────────────────────────────────────────────────────────────
export type AIActivityType =
  | 'sent'
  | 'message'
  | 'reply'
  | 'booked'
  | 'failed'
  | 'invalid'
  | 'connected'

export interface AIActivity {
  id: string
  agentId: string
  referralId: string | null
  type: AIActivityType
  message: string
  status: string
  createdAt: string
}

// ─────────────────────────────────────────────────────────────────────────
// Teams
// ─────────────────────────────────────────────────────────────────────────
export interface Team {
  id: string
  name: string
  leaderAgentId: string
  leaderName: string
  createdAt: string
}

// ─────────────────────────────────────────────────────────────────────────
// Computed stats (never stored — derived from base data)
// ─────────────────────────────────────────────────────────────────────────
export interface ComputedAgentStats {
  agentId: string
  weeklyAlp: number
  monthlyAlp: number
  totalAlp: number
  totalFamiliesProtected: number
  weeklyFamiliesProtected: number
  salesCount: number
  referralsCollected: number
  referralsSentToAI: number
  appointmentsBooked: number
  appointmentsSet: number
  appointmentsSat: number
  showRate: number // 0..1
  closeRate: number // 0..1
  averageAlpPerSale: number
  callsMade: number
  talkTimeMinutes: number
  soldReferrals: number
  lastActivityAt: string | null
}

export interface AgentWithStats {
  agent: Agent
  stats: ComputedAgentStats
}

export interface ComputedTeamStats {
  teamId: string
  teamName: string
  leaderName: string
  weeklyAlp: number
  monthlyAlp: number
  totalAlp: number
  familiesProtected: number
  referralsCollected: number
  referralsSentToAI: number
  appointmentsBooked: number
  activeAgents: number
  agentCount: number
  averageAlpPerAgent: number
}

export interface AgencyTotals {
  weeklyAlp: number
  monthlyAlp: number
  familiesProtected: number
  referralsCollected: number
  referralsSentToAI: number
  appointmentsBooked: number
  soldReferrals: number
  unreadAnnouncements: number
  activeAgents: number
}

export type DateFilter =
  | 'This Week'
  | 'Last Week'
  | 'This Month'
  | 'Last Month'
  | 'Custom Range'

// ─────────────────────────────────────────────────────────────────────────
// Auth / accounts
// ─────────────────────────────────────────────────────────────────────────
export type UserRole = 'owner' | 'admin' | 'leader' | 'agent'

export type Permission =
  | 'view_all_users'
  | 'edit_all_users'
  | 'delete_users'
  | 'create_admins'
  | 'change_roles'
  | 'view_hierarchy'
  | 'edit_hierarchy'
  | 'move_agents'
  | 'view_team_numbers'
  | 'edit_own_numbers'
  | 'edit_team_numbers'
  | 'edit_all_numbers'
  | 'view_roster'
  | 'edit_roster'
  | 'view_onboarding'
  | 'edit_onboarding'
  | 'send_announcements'
  | 'manage_notifications'
  | 'view_reports'
  | 'export_reports'
  | 'manage_app_settings'
  | 'view_announcements'
  | 'create_announcements'
  | 'edit_announcements'
  | 'delete_announcements'
  | 'send_push_notifications'
  | 'schedule_announcements'
  | 'manage_recurring_announcements'
  | 'view_own_stats'
  | 'view_team_stats'
  | 'view_all_stats'
  | 'edit_user_goals'

export interface UserGoals {
  monthlyAlpGoal: number
  yearlyAlpGoal: number
  monthlySalesGoal: number
  monthlyReferralGoal: number
  monthlyAppointmentsGoal: number
}

export interface AuditLog {
  id: string
  actorUserId: string
  actorName: string
  action: string
  targetUserId?: string
  targetName?: string
  oldValue?: string
  newValue?: string
  createdAt: string
}

// ─────────────────────────────────────────────────────────────────────────
// Announcements
// ─────────────────────────────────────────────────────────────────────────
export type AnnouncementAudience = 'all_agency' | 'specific_teams' | 'specific_users' | 'leaders_only'
export type AnnouncementPriority = 'normal' | 'important' | 'urgent'
export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'archived'
export type RecurrenceFrequency = 'weekly' | 'monthly'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  interval: number
  dayOfWeek?: DayOfWeek
  dayOfMonth?: number
  time: string // "20:00"
  timezone: string
  endDate?: string | null
}

export interface Announcement {
  id: string
  title: string
  body: string
  createdByUserId: string
  createdByName: string
  audienceType: AnnouncementAudience
  targetTeamIds?: string[]
  targetUserIds?: string[]
  priority: AnnouncementPriority
  pinned: boolean
  sendPushNotification: boolean
  pushTitle?: string
  pushBody?: string
  status: AnnouncementStatus
  publishAt?: string | null
  recurring: boolean
  recurrenceRule?: RecurrenceRule | null
  recurringActive?: boolean
  lastSentAt?: string | null
  nextSendAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface AnnouncementReadReceipt {
  id: string
  announcementId: string
  userId: string
  readAt: string
}

export interface AppNotification {
  id: string
  userId: string
  type: 'announcement'
  title: string
  message: string
  relatedAnnouncementId: string
  read: boolean
  priority?: AnnouncementPriority
  createdAt: string
}

// ─────────────────────────────────────────────────────────────────────────
// Chat
// ─────────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  body: string
  createdAt: string
}

export interface ChatRead {
  userId: string
  conversationId: string
  readAt: string
}

export type AccountStatus =
  | 'Pending Onboarding'
  | 'Active'
  | 'Needs Review'
  | 'Disabled'

export interface UserAccount {
  id: string
  agentId: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  /** Placeholder for a real hash — never store plaintext in production. */
  passwordHash: string
  role: UserRole
  accountStatus: AccountStatus
  teamId: string
  teamName: string
  sponsor: string
  inviteCode: string
  onboardingComplete: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string | null
}

export interface InviteCode {
  id: string
  code: string
  teamId: string
  teamName: string
  createdBy: string
  active: boolean
  usageCount: number
  createdAt: string
}

export interface SentInvite {
  id: string
  email: string
  teamId: string
  teamName: string
  code: string
  link: string
  sentBy: string
  sentAt: string
}

/** Output of the Submit Daily Numbers wizard. */
export interface DailyNumbers {
  date: string
  dials: number
  appointmentsScheduled: number
  appointmentsSat: number
  dealsSold: number
  totalAlp: number
  referralsCollected: number
  referralsSat: number
  referralSales: number
  referralAlp: number
  projectedAppointments: number
}

export interface OnboardingData {
  phone: string
  email: string
  location: string
  soldBefore: 'Yes' | 'No' | ''
  previousIndustry: string
  licenseStatus: string
  currentlyOnboarding: 'Yes' | 'No' | ''
  backgroundNotes: string
  discovery: string
  inviteCode: string
  sponsor: string
  preferredTeamId: string
  referralSource: string
}
