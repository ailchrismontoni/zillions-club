import { useEffect, useState } from 'react'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Field } from '@/components/ui/Input'

export function CreateTeamModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createTeam = useAppStore((s) => s.createTeam)
  const { account } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [leaderName, setLeaderName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(''); setLeaderName(''); setCode(''); setDescription(''); setError('')
    }
  }, [open])

  function handleCreate() {
    if (!name.trim()) {
      setError('Team name is required.')
      return
    }
    const team = createTeam({ name: name.trim(), leaderName: leaderName.trim() || 'Unassigned', code: code.trim(), description } as any)
    void account
    toast({ title: 'Team created', description: code ? `${team.name} · code ${code.toUpperCase()}` : team.name, variant: 'success' })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Team"
      description="Add a new team. New signups can route in via its invite code."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate}>Create Team</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Team name" required error={error}>
          <Input value={name} onChange={(e) => { setName(e.target.value); setError('') }} placeholder="Team Carter" autoFocus />
        </Field>
        <Field label="Team leader">
          <Input value={leaderName} onChange={(e) => setLeaderName(e.target.value)} placeholder="Leader name" />
        </Field>
        <Field label="Invite code">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CARTER25" />
        </Field>
        <Field label="Description">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this team about?" />
        </Field>
      </div>
    </Modal>
  )
}
