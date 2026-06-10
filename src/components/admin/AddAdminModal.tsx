import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import type { UserRole } from '@/types'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { ROLE_META } from '@/lib/permissions'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

export function AddAdminModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const agents = useAppStore((s) => s.agents)
  const setAgentRole = useAppStore((s) => s.setAgentRole)
  const addAuditLog = useAppStore((s) => s.addAuditLog)
  const { agent: actor } = useAuth()
  const { toast } = useToast()

  const candidates = agents.filter((a) => a.platformRole !== 'owner')
  const [agentId, setAgentId] = useState('')
  const [role, setRole] = useState<UserRole>('admin')

  useEffect(() => {
    if (open) {
      setAgentId(candidates[0]?.id ?? '')
      setRole('admin')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function save() {
    const target = agents.find((a) => a.id === agentId)
    if (!target) return
    const oldRole = target.platformRole ?? 'agent'
    setAgentRole(agentId, role)
    addAuditLog({
      actorUserId: actor?.id ?? 'system',
      actorName: actor?.fullName ?? 'System',
      action: `Promoted to ${role}`,
      targetUserId: agentId,
      targetName: target.fullName,
      oldValue: oldRole,
      newValue: role,
    })
    toast({ title: `${target.fullName} is now ${ROLE_META[role].label}`, variant: 'success' })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Admin"
      description="Grant a user admin or leader access. You can fine-tune permissions afterward."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={!agentId}>
            <ShieldCheck className="h-4 w-4" /> Grant access
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="User">
          <Select value={agentId} onChange={(e) => setAgentId(e.target.value)} options={candidates.map((a) => ({ label: `${a.fullName} · ${a.teamName}`, value: a.id }))} />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)} options={[{ label: 'Admin', value: 'admin' }, { label: 'Leader', value: 'leader' }]} />
        </Field>
      </div>
    </Modal>
  )
}
