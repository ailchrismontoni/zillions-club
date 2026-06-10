import { useEffect, useState } from 'react'
import type { Agent } from '@/types'
import { useAppStore } from '@/app/store'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

export function ReassignTeamModal({
  open,
  onClose,
  agent,
}: {
  open: boolean
  onClose: () => void
  agent: Agent
}) {
  const teams = useAppStore((s) => s.teams)
  const reassignAgentTeam = useAppStore((s) => s.reassignAgentTeam)
  const { toast } = useToast()
  const [teamId, setTeamId] = useState(agent.teamId)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setTeamId(agent.teamId)
      setNote('')
    }
  }, [open, agent.teamId])

  function handleSave() {
    if (teamId === agent.teamId) {
      onClose()
      return
    }
    const target = teams.find((t) => t.id === teamId)
    reassignAgentTeam(agent.id, teamId, note || undefined)
    toast({ title: 'Agent reassigned', description: `${agent.fullName} → ${target?.name}`, variant: 'success' })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reassign Team"
      description={`Move ${agent.fullName} to a different team. Their referrals follow them.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-[13px]">
          <span className="text-slate-500">Current team: </span>
          <span className="font-bold text-ink">{agent.teamName}</span>
        </div>
        <Field label="New team">
          <Select value={teamId} onChange={(e) => setTeamId(e.target.value)} options={teams.map((t) => ({ label: t.name, value: t.id }))} />
        </Field>
        <Field label="Note (optional)">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for reassignment…" />
        </Field>
      </div>
    </Modal>
  )
}
