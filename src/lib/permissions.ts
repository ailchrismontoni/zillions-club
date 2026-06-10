import type { Permission, UserRole } from '@/types'

export const ALL_PERMISSIONS: Permission[] = [
  'view_all_users', 'edit_all_users', 'delete_users', 'create_admins', 'change_roles',
  'view_hierarchy', 'edit_hierarchy', 'move_agents',
  'view_team_numbers', 'edit_own_numbers', 'edit_team_numbers', 'edit_all_numbers',
  'view_roster', 'edit_roster',
  'view_onboarding', 'edit_onboarding',
  'send_announcements', 'manage_notifications',
  'view_reports', 'export_reports',
  'manage_app_settings',
  'view_announcements', 'create_announcements', 'edit_announcements', 'delete_announcements',
  'send_push_notifications', 'schedule_announcements', 'manage_recurring_announcements',
  'view_own_stats', 'view_team_stats', 'view_all_stats', 'edit_user_goals',
]

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_all_users: 'View all users',
  edit_all_users: 'Edit users',
  delete_users: 'Delete users',
  create_admins: 'Create admins',
  change_roles: 'Change roles',
  view_hierarchy: 'View hierarchy',
  edit_hierarchy: 'Edit hierarchy',
  move_agents: 'Move agents between teams',
  view_team_numbers: 'View team numbers',
  edit_own_numbers: 'Edit own numbers',
  edit_team_numbers: 'Edit team numbers',
  edit_all_numbers: 'Edit all numbers',
  view_roster: 'View roster',
  edit_roster: 'Edit roster',
  view_onboarding: 'View onboarding',
  edit_onboarding: 'Edit onboarding',
  send_announcements: 'Send announcements',
  manage_notifications: 'Manage notifications',
  view_reports: 'View reports',
  export_reports: 'Export reports',
  manage_app_settings: 'Manage app settings',
  view_announcements: 'View announcements',
  create_announcements: 'Create announcements',
  edit_announcements: 'Edit announcements',
  delete_announcements: 'Delete announcements',
  send_push_notifications: 'Send push notifications',
  schedule_announcements: 'Schedule announcements',
  manage_recurring_announcements: 'Manage recurring announcements',
  view_own_stats: 'View own stats',
  view_team_stats: 'View team stats',
  view_all_stats: 'View all stats',
  edit_user_goals: 'Edit user goals',
}

export interface PermissionGroup {
  title: string
  permissions: Permission[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  { title: 'User Management', permissions: ['view_all_users', 'edit_all_users', 'delete_users', 'change_roles', 'create_admins'] },
  { title: 'Hierarchy', permissions: ['view_hierarchy', 'edit_hierarchy', 'move_agents'] },
  { title: 'Numbers', permissions: ['view_team_numbers', 'edit_own_numbers', 'edit_team_numbers', 'edit_all_numbers'] },
  { title: 'Onboarding', permissions: ['view_onboarding', 'edit_onboarding'] },
  { title: 'Communication', permissions: ['send_announcements', 'manage_notifications'] },
  { title: 'Reports', permissions: ['view_reports', 'export_reports'] },
  { title: 'Announcements', permissions: ['view_announcements', 'create_announcements', 'edit_announcements', 'delete_announcements', 'send_push_notifications', 'schedule_announcements', 'manage_recurring_announcements'] },
  { title: 'Stats', permissions: ['view_own_stats', 'view_team_stats', 'view_all_stats', 'edit_user_goals'] },
  { title: 'App Settings', permissions: ['manage_app_settings'] },
]

/** Sensible default permission sets per role. Owner is all-powerful regardless. */
export const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [...ALL_PERMISSIONS],
  admin: [
    'view_all_users', 'edit_all_users',
    'view_hierarchy', 'edit_hierarchy', 'move_agents',
    'view_team_numbers', 'edit_own_numbers', 'edit_team_numbers', 'edit_all_numbers',
    'view_roster', 'edit_roster',
    'view_onboarding', 'edit_onboarding',
    'send_announcements', 'manage_notifications',
    'view_reports', 'export_reports',
    'view_announcements', 'create_announcements', 'edit_announcements', 'delete_announcements',
    'send_push_notifications', 'schedule_announcements', 'manage_recurring_announcements',
    'view_own_stats', 'view_team_stats', 'view_all_stats',
  ],
  leader: [
    'view_hierarchy',
    'view_team_numbers', 'edit_own_numbers', 'edit_team_numbers',
    'view_roster',
    'view_onboarding',
    'view_reports',
    'view_announcements',
    'view_own_stats', 'view_team_stats',
  ],
  agent: ['view_hierarchy', 'view_team_numbers', 'edit_own_numbers', 'view_announcements', 'view_own_stats'],
}

export interface PermissionUser {
  platformRole?: UserRole
  permissions?: Permission[]
}

/** The core RBAC check. Owner can do everything. */
export function hasPermission(user: PermissionUser | null | undefined, permission: Permission): boolean {
  if (!user) return false
  if (user.platformRole === 'owner') return true
  return (user.permissions ?? []).includes(permission)
}

// ── Role metadata (badges) ─────────────────────────────────────────────────
export const ROLE_META: Record<UserRole, { label: string; badge: string }> = {
  owner: { label: 'Owner', badge: 'bg-amber-100 text-amber-700 ring-amber-200' },
  admin: { label: 'Admin', badge: 'bg-electric-50 text-electric-600 ring-electric-100' },
  leader: { label: 'Leader', badge: 'bg-violet-100 text-violet-700 ring-violet-200' },
  agent: { label: 'Agent', badge: 'bg-slate-100 text-slate-600 ring-slate-200' },
}

export const ASSIGNABLE_ROLES: UserRole[] = ['admin', 'leader', 'agent']
