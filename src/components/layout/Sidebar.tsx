import { useNavigate } from 'react-router-dom'
import { ChevronsLeft, ChevronRight, LogOut, Settings, User } from 'lucide-react'
import { navForRole } from '@/lib/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useUnreadAnnouncements } from '@/hooks/useAnnouncements'
import { useUnreadChatCount } from '@/hooks/useChat'
import { useAuthStore } from '@/app/authStore'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { SidebarItem } from './SidebarItem'
import { LogoMark } from './Logo'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onNavigate?: () => void
  mobile?: boolean
}

export function Sidebar({ collapsed, onToggle, onNavigate, mobile }: SidebarProps) {
  const isCollapsed = collapsed && !mobile
  const { account, agent, role } = useAuth()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const unreadAnnouncements = useUnreadAnnouncements()
  const unreadChats = useUnreadChatCount()

  const sections = navForRole(role)
  const name = account?.fullName ?? 'Agent'
  const email = account?.email ?? ''

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-slate-200 bg-white transition-[width] duration-200',
        isCollapsed ? 'w-[76px]' : 'w-[260px]',
      )}
    >
      {/* Brand */}
      <div className={cn('flex items-center gap-3 px-4 py-5', isCollapsed && 'justify-center px-0')}>
        <LogoMark className="h-10 w-10" />
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold tracking-tight text-ink">Zillions Club</p>
            <p className="truncate text-xs font-medium text-slate-400">{name}</p>
          </div>
        )}
        {!mobile && (
          <button
            onClick={onToggle}
            className={cn(
              'rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink focus-ring',
              isCollapsed && 'absolute -right-3 top-7 z-10 border border-slate-200 bg-white shadow-sm',
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.title}>
            {!isCollapsed && (
              <p className="mb-1.5 px-3 text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">{section.title}</p>
            )}
            {isCollapsed && <div className="mx-auto mb-2 h-px w-8 bg-slate-100" />}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.to}
                  {...item}
                  badge={item.to === '/announcements' ? unreadAnnouncements || undefined : item.to === '/chat' ? unreadChats || undefined : item.badge}
                  collapsed={isCollapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User card with menu */}
      <div className="border-t border-slate-100 p-3">
        <Dropdown
          align="left"
          className="w-full"
          menuClassName="bottom-full mb-2 w-[228px]"
          trigger={() => (
            <span
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-slate-100',
                isCollapsed && 'justify-center',
              )}
            >
              <Avatar name={name} src={agent?.avatarUrl} size="sm" ring />
              {!isCollapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-ink">{name}</p>
                    <p className="truncate text-[11px] text-slate-400">{email}</p>
                  </div>
                  <Settings className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-ink" />
                </>
              )}
            </span>
          )}
        >
          {(close) => (
            <>
              {agent && (
                <DropdownItem onClick={() => { navigate(`/agents/${agent.id}`); close(); onNavigate?.() }}>
                  <User className="h-4 w-4" /> My Profile
                </DropdownItem>
              )}
              <DropdownItem onClick={() => { handleLogout(); close() }} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                <LogOut className="h-4 w-4" /> Log out
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>
    </aside>
  )
}
