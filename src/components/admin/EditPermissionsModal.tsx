import { useEffect, useState } from 'react'
import { Check, Lock } from 'lucide-react'
import type { Agent, Permission, UserRole } from '@/types'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  ASSIGNABLE_ROLES,
  DEFAULT_PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  ROLE_META,
} from '@/lib/permissions'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { RoleBadge } from './RoleBadge'
import { cn } from '@/lib/utils'

// Only the owner can grant these high-authority permissions.
const HIGH_LEVEL: Permission[] = ['create_admins', 'change_roles', 'delete_users', 'manage_app_settings']

export function EditPermissionsModal({ agent, onClose }: { agent: Agent | null; onClose: () => void }) {
  const setAgentRole = useAppStore((s) => s.setAgentRole)
  const setAgentPermissions = useAppStore((s) => s.setAgentPermissions)
  const addAuditLog = useAppStore((s) => s.addAuditLog)
  const { agent: actor, isOwner } = useAuth()
  const { toast } = useToast()

  const [role, setRole] = useState<UserRole>('agent')
  const [perms, setPerms] = useState<Set<Permission>>(new Set())

  useEffect(() => {
    if (agent) {
      setRole(agent.platformRole ?? 'agent')
      setPerms(new Set(agent.permissions ?? []))
    }
  }, [agent])

  if (!agent) return null

  function changeRole(next: UserRole) {
    setRole(next)
    setPerms(new Set(DEFAULT_PERMISSIONS[next]))
  }
  function togglePerm(p: Permission) {
    setPerms((prev) => {
      const n = new Set(prev)
      n.has(p) ? n.delete(p) : n.add(p)
      return n
    })
  }

  function save() {
    const oldRole = agent!.platformRole ?? 'agent'
    setAgentRole(agent!.id, role)
    setAgentPermissions(agent!.id, [...perms])
    addAuditLog({
      actorUserId: actor?.id ?? 'system',
      actorName: actor?.fullName ?? 'System',
      action: oldRole !== role ? `Changed role ${oldRole} → ${role}` : 'Updated permissions',
      targetUserId: agent!.id,
      targetName: agent!.fullName,
      oldValue: oldRole,
      newValue: role,
    })
    toast({ title: 'Permissions saved', description: agent!.fullName, variant: 'success' })
    onClose()
  }

  return (
    <Modal open={Boolean(agent)} onClose={onClose} className="max-w-2xl" title="Edit Permissions" description="Control exactly what this user can access.">
      {/* User summary */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <div>
          <p className="text-[14px] font-bold text-ink">{agent.fullName}</p>
          <p className="text-[12px] text-slate-500">{agent.email} · {agent.teamName}</p>
        </div>
        <RoleBadge role={agent.platformRole ?? 'agent'} />
      </div>

      <Field label="Role">
        <Select value={role} onChange={(e) => changeRole(e.target.value as UserRole)} options={ASSIGNABLE_ROLES.map((r) => ({ label: ROLE_META[r].label, value: r }))} />
      </Field>

      <div className="mt-4 max-h-[44vh] space-y-4 overflow-y-auto pr-1">
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{group.title}</p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {group.permissions.map((p) => {
                const locked = HIGH_LEVEL.includes(p) && !isOwner
                const checked = perms.has(p)
                return (
                  <button
                    key={p}
                    type="button"
                    disabled={locked}
                    onClick={() => togglePerm(p)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border px-3 py-2 text-left text-[12.5px] font-medium transition-all',
                      locked ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300' : checked ? 'border-electric bg-electric-50 text-electric-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    <span>{PERMISSION_LABELS[p]}</span>
                    {locked ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <span className={cn('flex h-4 w-4 items-center justify-center rounded border', checked ? 'border-electric bg-electric text-white' : 'border-slate-300')}>
                        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!isOwner && (
        <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-slate-400">
          <Lock className="h-3 w-3" /> High-authority permissions can only be granted by the owner.
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={save}>Save changes</Button>
      </div>
    </Modal>
  )
}
