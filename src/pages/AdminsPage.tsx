import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  History,
  MoreHorizontal,
  Search,
  ShieldCheck,
  ShieldMinus,
  Sliders,
  Trash2,
  User,
  UserMinus,
} from 'lucide-react'
import type { Agent } from '@/types'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { ROLE_META } from '@/lib/permissions'
import { ROLE_ABBREV } from '@/lib/agentMeta'
import { cn } from '@/lib/utils'
import { relativeTime } from '@/lib/dateRanges'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AGENT_STATUS_TONE } from '@/lib/agentMeta'
import { RoleBadge } from '@/components/admin/RoleBadge'
import { EditPermissionsModal } from '@/components/admin/EditPermissionsModal'
import { AddAdminModal } from '@/components/admin/AddAdminModal'

const HEADERS = ['Name', 'Email', 'Role', 'Rank', 'Team', 'Status', 'Permissions', '']

interface PendingConfirm {
  title: string
  message: string
  danger?: boolean
  confirmLabel: string
  onConfirm: () => void
}

export function AdminsPage() {
  const navigate = useNavigate()
  const agents = useAppStore((s) => s.agents)
  const auditLog = useAppStore((s) => s.auditLog)
  const setAgentRole = useAppStore((s) => s.setAgentRole)
  const updateAgent = useAppStore((s) => s.updateAgent)
  const deleteAgent = useAppStore((s) => s.deleteAgent)
  const addAuditLog = useAppStore((s) => s.addAuditLog)
  const { agent: actor, isOwner, can } = useAuth()
  const { toast } = useToast()

  const canManageRoles = isOwner || can('create_admins')
  const canDelete = isOwner || can('delete_users')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editing, setEditing] = useState<Agent | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...agents]
      .filter((a) => {
        if (q && ![a.fullName, a.email, a.teamName].join(' ').toLowerCase().includes(q)) return false
        if (roleFilter && (a.platformRole ?? 'agent') !== roleFilter) return false
        return true
      })
      .sort((a, b) => rank(b.platformRole) - rank(a.platformRole) || a.fullName.localeCompare(b.fullName))
  }, [agents, search, roleFilter])

  function audit(action: string, target: Agent, oldV?: string, newV?: string) {
    addAuditLog({ actorUserId: actor?.id ?? 'system', actorName: actor?.fullName ?? 'System', action, targetUserId: target.id, targetName: target.fullName, oldValue: oldV, newValue: newV })
  }

  function removeAdmin(a: Agent) {
    const old = a.platformRole ?? 'agent'
    setAgentRole(a.id, 'agent')
    audit('Removed admin access', a, old, 'agent')
    toast({ title: `Admin access removed from ${a.fullName}`, variant: 'success' })
  }
  function deactivate(a: Agent) {
    updateAgent(a.id, { status: 'Inactive' })
    audit('Deactivated user', a, a.status, 'Inactive')
    toast({ title: `${a.fullName} deactivated`, variant: 'success' })
  }
  function remove(a: Agent) {
    deleteAgent(a.id)
    audit('Deleted user', a)
    toast({ title: `${a.fullName} deleted`, variant: 'success' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admins & Permissions"
        description="Control exactly who can view, edit, and manage the agency."
        actions={
          canManageRoles ? (
            <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              <ShieldCheck className="h-3.5 w-3.5" /> Add Admin
            </Button>
          ) : undefined
        }
      />

      {/* Controls */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="h-9 pl-9" />
        </div>
        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-9 sm:w-40" options={[{ label: 'All roles', value: '' }, { label: 'Owner', value: 'owner' }, { label: 'Admin', value: 'admin' }, { label: 'Leader', value: 'leader' }, { label: 'Agent', value: 'agent' }]} />
      </div>

      {/* Table */}
      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-50/80">
            <tr className="border-b border-slate-200">
              {HEADERS.map((h, i) => (
                <th key={i} className="whitespace-nowrap px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const role = a.platformRole ?? 'agent'
              const isTargetOwner = role === 'owner'
              const permCount = a.permissions?.length ?? 0
              return (
                <tr key={a.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={a.fullName} src={a.avatarUrl} size="sm" />
                      <span className="text-[13.5px] font-bold text-ink">{a.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[12.5px] text-slate-500">{a.email}</td>
                  <td className="px-4 py-2.5"><RoleBadge role={role} /></td>
                  <td className="px-4 py-2.5 text-[12.5px] font-semibold text-slate-600">{ROLE_ABBREV[a.role]}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[12.5px] text-slate-600">{a.teamName}</td>
                  <td className="px-4 py-2.5"><Badge tone={AGENT_STATUS_TONE[a.status]} dot>{a.status}</Badge></td>
                  <td className="px-4 py-2.5 text-[12.5px] text-slate-500">{isTargetOwner ? 'Full access' : `${permCount} permission${permCount === 1 ? '' : 's'}`}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Dropdown
                      align="right"
                      trigger={() => (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink">
                          <MoreHorizontal className="h-4 w-4" />
                        </span>
                      )}
                    >
                      {(close) => (
                        <>
                          <DropdownItem onClick={() => { navigate(`/agents/${a.id}`); close() }}>
                            <User className="h-4 w-4" /> View profile
                          </DropdownItem>
                          {!isTargetOwner && canManageRoles && (
                            <DropdownItem onClick={() => { setEditing(a); close() }}>
                              <Sliders className="h-4 w-4" /> Edit permissions
                            </DropdownItem>
                          )}
                          {!isTargetOwner && canManageRoles && role !== 'agent' && (
                            <DropdownItem onClick={() => { close(); setConfirm({ title: 'Remove admin access', message: `Are you sure you want to remove admin access from ${a.fullName}? Their role reverts to Agent and custom permissions are cleared.`, confirmLabel: 'Remove access', danger: true, onConfirm: () => removeAdmin(a) }) }}>
                              <ShieldMinus className="h-4 w-4" /> Remove admin access
                            </DropdownItem>
                          )}
                          {!isTargetOwner && a.status !== 'Inactive' && canManageRoles && (
                            <DropdownItem onClick={() => { close(); setConfirm({ title: 'Deactivate user', message: `Deactivate ${a.fullName}? They will lose access until reactivated.`, confirmLabel: 'Deactivate', danger: true, onConfirm: () => deactivate(a) }) }}>
                              <UserMinus className="h-4 w-4" /> Deactivate user
                            </DropdownItem>
                          )}
                          {!isTargetOwner && canDelete && (
                            <DropdownItem className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => { close(); setConfirm({ title: 'Delete user', message: `Permanently delete ${a.fullName}? This cannot be undone. Their downline will be re-homed to their upline.`, confirmLabel: 'Delete user', danger: true, onConfirm: () => remove(a) }) }}>
                              <Trash2 className="h-4 w-4" /> Delete user
                            </DropdownItem>
                          )}
                          {isTargetOwner && (
                            <div className="px-3 py-2 text-[11.5px] text-slate-400">Owner is protected</div>
                          )}
                        </>
                      )}
                    </Dropdown>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {/* Audit log */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-ink">
          <History className="h-4 w-4 text-slate-400" /> Audit log
        </h3>
        {auditLog.length === 0 ? (
          <p className="text-[13px] text-slate-400">No admin changes yet. Role and permission changes will appear here.</p>
        ) : (
          <ol className="space-y-2.5">
            {auditLog.slice(0, 20).map((l) => (
              <li key={l.id} className="flex items-start gap-3 text-[12.5px]">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-electric" />
                <div className="flex-1">
                  <span className="font-semibold text-ink">{l.actorName}</span>{' '}
                  <span className="text-slate-500">{l.action.toLowerCase()}</span>
                  {l.targetName && <span className="font-semibold text-ink"> · {l.targetName}</span>}
                </div>
                <span className="shrink-0 text-[11px] text-slate-400">{relativeTime(l.createdAt)}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <EditPermissionsModal agent={editing} onClose={() => setEditing(null)} />
      <AddAdminModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onConfirm={() => confirm?.onConfirm()}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}

function rank(role?: string): number {
  return role === 'owner' ? 4 : role === 'admin' ? 3 : role === 'leader' ? 2 : 1
}
