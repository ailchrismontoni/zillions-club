import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItemProps {
  to: string
  label: string
  icon: LucideIcon
  badge?: number
  collapsed: boolean
  onNavigate?: () => void
}

export function SidebarItem({
  to,
  label,
  icon: Icon,
  badge,
  collapsed,
  onNavigate,
}: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-all duration-150',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-ink text-white shadow-sm'
            : 'text-slate-500 hover:bg-slate-100 hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'h-[18px] w-[18px] shrink-0 transition-colors',
              isActive ? 'text-white' : 'text-slate-400 group-hover:text-ink',
            )}
          />
          {!collapsed && <span className="flex-1 truncate">{label}</span>}
          {badge ? (
            collapsed ? (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            ) : (
              <span
                className={cn(
                  'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular',
                  isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white',
                )}
              >
                {badge}
              </span>
            )
          ) : null}
        </>
      )}
    </NavLink>
  )
}
