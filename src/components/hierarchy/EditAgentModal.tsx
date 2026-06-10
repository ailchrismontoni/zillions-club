import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Agent, AgentRole, AgentStatus, ContractLevel } from '@/types'
import { AGENT_ROLES, AGENT_STATUSES, CONTRACT_LEVELS } from '@/types'
import { useAppStore } from '@/app/store'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

export function EditAgentModal({
  agent,
  agents,
  disallowedLeaderIds,
  onClose,
}: {
  agent: Agent | null
  agents: Agent[]
  disallowedLeaderIds: string[]
  onClose: () => void
}) {
  const updateAgent = useAppStore((s) => s.updateAgent)
  const assignToLeader = useAppStore((s) => s.assignToLeader)
  const deleteAgent = useAppStore((s) => s.deleteAgent)
  const { toast } = useToast()

  const [role, setRole] = useState<AgentRole>('Career Agent')
  const [contractLevel, setContractLevel] = useState<ContractLevel>('65%')
  const [status, setStatus] = useState<AgentStatus>('Active')
  const [teamName, setTeamName] = useState('')
  const [leaderId, setLeaderId] = useState<string>('')

  useEffect(() => {
    if (agent) {
      setRole(agent.role)
      setContractLevel(agent.contractLevel)
      setStatus(agent.status)
      setTeamName(agent.teamName)
      setLeaderId(agent.leaderId ?? '')
    }
  }, [agent])

  if (!agent) return null

  const leaderOptions = [
    { label: 'Top of agency (no leader)', value: '' },
    ...agents
      .filter((a) => a.id !== agent.id && !disallowedLeaderIds.includes(a.id))
      .map((a) => ({ label: `${a.fullName} · ${a.teamName}`, value: a.id })),
  ]

  function save() {
    updateAgent(agent!.id, { role, contractLevel, status, teamName })
    if (leaderId !== (agent!.leaderId ?? '')) {
      assignToLeader(agent!.id, leaderId || null)
    }
    toast({ title: 'Hierarchy updated', description: agent!.fullName, variant: 'success' })
    onClose()
  }

  function remove() {
    deleteAgent(agent!.id)
    toast({ title: 'Removed from hierarchy', description: agent!.fullName, variant: 'success' })
    onClose()
  }

  return (
    <Modal
      open={Boolean(agent)}
      onClose={onClose}
      title={`Edit ${agent.fullName}`}
      description="Reassign upline, change rank, or update the team."
      footer={
        <>
          <Button variant="ghost" className="mr-auto text-red-500 hover:bg-red-50" onClick={remove}>
            <Trash2 className="h-4 w-4" /> Remove
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Reports to (leader)">
          <Select value={leaderId} onChange={(e) => setLeaderId(e.target.value)} options={leaderOptions} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Rank">
            <Select value={role} onChange={(e) => setRole(e.target.value as AgentRole)} options={AGENT_ROLES.map((r) => ({ label: r, value: r }))} />
          </Field>
          <Field label="Contract level">
            <Select value={contractLevel} onChange={(e) => setContractLevel(e.target.value as ContractLevel)} options={CONTRACT_LEVELS.map((c) => ({ label: c, value: c }))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as AgentStatus)} options={AGENT_STATUSES.map((s) => ({ label: s, value: s }))} />
          </Field>
          <Field label="Team name">
            <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  )
}
