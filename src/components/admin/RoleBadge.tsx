import { Crown, Shield, ShieldCheck, User } from 'lucide-react'
import type { UserRole } from '@/types'
import { ROLE_META } from '@/lib/permissions'
import { cn } from '@/lib/utils'

const ICONS: Record<UserRole, typeof Crown> = {
  owner: Crown,
  admin: ShieldCheck,
  leader: Shield,
  agent: User,
}

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  const meta = ROLE_META[role]
  const Icon = ICONS[role]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1', meta.badge, className)}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  )
}
