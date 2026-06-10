import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  MessagesSquare,
  Megaphone,
  Network,
  Ticket,
  ShieldCheck,
  BarChart3,
  Hash,
  User as UserIcon,
  NotebookPen,
  BookUser,
  GitBranch,
} from 'lucide-react'
import type { UserRole } from '@/types'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  badge?: number
  /** Roles allowed to see this item. Undefined = everyone. */
  roles?: UserRole[]
}

export interface NavSection {
  title: string
  items: NavItem[]
}

const LEADERS: UserRole[] = ['owner', 'admin', 'leader']
const MANAGERS: UserRole[] = ['owner', 'admin']

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      { label: 'Chat', to: '/chat', icon: MessagesSquare },
      { label: 'Announcements', to: '/announcements', icon: Megaphone },
    ],
  },
  {
    title: 'Agency',
    items: [
      { label: 'Teams', to: '/teams', icon: GitBranch, roles: LEADERS },
      { label: 'Hierarchy', to: '/hierarchy', icon: Network, roles: LEADERS },
      { label: 'Invites', to: '/invites', icon: Ticket, roles: LEADERS },
      { label: 'Manage Admins', to: '/admins', icon: ShieldCheck, roles: MANAGERS },
    ],
  },
  {
    title: 'Numbers & Journal',
    items: [
      { label: 'Stats', to: '/stats', icon: BarChart3 },
      { label: 'Team Numbers', to: '/team-numbers', icon: Hash },
      { label: 'My Numbers', to: '/my-numbers', icon: UserIcon },
      { label: 'Journal', to: '/journal', icon: NotebookPen },
      { label: 'Ref Book', to: '/ref-book', icon: BookUser },
    ],
  },
]

/** Filter nav sections to those an item-role permits, dropping empty sections. */
export function navForRole(role: UserRole | null): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || (role && item.roles.includes(role))),
  })).filter((section) => section.items.length > 0)
}
