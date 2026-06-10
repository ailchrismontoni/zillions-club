import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import type { AgentRole, AgentStatus, ContractLevel } from '@/types'
import { AGENT_ROLES, AGENT_STATUSES, CONTRACT_LEVELS } from '@/types'
import { useAppStore } from '@/app/store'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Field } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface CreateAgentModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (agentId: string) => void
}

const todayInput = () => new Date().toISOString().slice(0, 10)

interface Draft {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  avatarUrl: string
  teamId: string
  role: AgentRole
  contractLevel: ContractLevel
  status: AgentStatus
  startDate: string
  sponsor: string
  notes: string
}

export function CreateAgentModal({ open, onClose, onCreated }: CreateAgentModalProps) {
  const teams = useAppStore((s) => s.teams)
  const createAgent = useAppStore((s) => s.createAgent)
  const { toast } = useToast()

  const base = (): Draft => ({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    avatarUrl: '',
    teamId: teams[0]?.id ?? '',
    role: 'Career Agent',
    contractLevel: '65%',
    status: 'Onboarding',
    startDate: todayInput(),
    sponsor: '',
    notes: '',
  })

  const [draft, setDraft] = useState<Draft>(base())
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({})

  useEffect(() => {
    if (open) {
      setDraft(base())
      setErrors({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function handleCreate() {
    const next: Partial<Record<keyof Draft, string>> = {}
    if (!draft.firstName.trim()) next.firstName = 'Required'
    if (!draft.lastName.trim()) next.lastName = 'Required'
    if (!draft.email.trim()) next.email = 'Required'
    setErrors(next)
    if (Object.keys(next).length) return

    const agent = createAgent({
      ...draft,
      startDate: new Date(draft.startDate + 'T12:00:00').toISOString(),
      avatarUrl: draft.avatarUrl || undefined,
    })
    toast({
      title: 'Agent created',
      description: `${agent.fullName} added to ${agent.teamName}.`,
      variant: 'success',
    })
    onClose()
    onCreated?.(agent.id)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Agent"
      description="Add a new agent. They get their own profile, ref book, and numbers."
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate}>
            <UserPlus className="h-4 w-4" />
            Create Agent
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First name" required error={errors.firstName}>
          <Input value={draft.firstName} onChange={(e) => set('firstName', e.target.value)} autoFocus />
        </Field>
        <Field label="Last name" required error={errors.lastName}>
          <Input value={draft.lastName} onChange={(e) => set('lastName', e.target.value)} />
        </Field>
        <Field label="Email" required error={errors.email}>
          <Input type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} placeholder="name@zillionsclub.com" />
        </Field>
        <Field label="Phone">
          <Input value={draft.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(440) 555-1234" inputMode="tel" />
        </Field>
        <Field label="Location">
          <Input value={draft.location} onChange={(e) => set('location', e.target.value)} placeholder="Cleveland, OH" />
        </Field>
        <Field label="Avatar URL (optional)">
          <Input value={draft.avatarUrl} onChange={(e) => set('avatarUrl', e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Team">
          <Select
            value={draft.teamId}
            onChange={(e) => set('teamId', e.target.value)}
            options={teams.map((t) => ({ label: t.name, value: t.id }))}
          />
        </Field>
        <Field label="Role">
          <Select
            value={draft.role}
            onChange={(e) => set('role', e.target.value as AgentRole)}
            options={AGENT_ROLES.map((r) => ({ label: r, value: r }))}
          />
        </Field>
        <Field label="Contract level">
          <Select
            value={draft.contractLevel}
            onChange={(e) => set('contractLevel', e.target.value as ContractLevel)}
            options={CONTRACT_LEVELS.map((c) => ({ label: c, value: c }))}
          />
        </Field>
        <Field label="Status">
          <Select
            value={draft.status}
            onChange={(e) => set('status', e.target.value as AgentStatus)}
            options={AGENT_STATUSES.map((s) => ({ label: s, value: s }))}
          />
        </Field>
        <Field label="Start date">
          <Input type="date" value={draft.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </Field>
        <Field label="Sponsor / recruiter">
          <Input value={draft.sponsor} onChange={(e) => set('sponsor', e.target.value)} placeholder="Who recruited them?" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <Textarea rows={2} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  )
}
