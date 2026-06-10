import { useEffect, useState } from 'react'
import { Target } from 'lucide-react'
import type { Agent, UserGoals } from '@/types'
import { useAppStore } from '@/app/store'
import { useToast } from '@/hooks/useToast'
import { DEFAULT_GOALS } from '@/services/stats'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'

const FIELDS: { key: keyof UserGoals; label: string; prefix?: string }[] = [
  { key: 'monthlyAlpGoal', label: 'Monthly ALP goal', prefix: '$' },
  { key: 'yearlyAlpGoal', label: 'Yearly ALP goal', prefix: '$' },
  { key: 'monthlySalesGoal', label: 'Monthly sales goal' },
  { key: 'monthlyReferralGoal', label: 'Monthly referrals goal' },
  { key: 'monthlyAppointmentsGoal', label: 'Monthly appointments goal' },
]

export function GoalsModal({ agent, onClose }: { agent: Agent | null; onClose: () => void }) {
  const setAgentGoals = useAppStore((s) => s.setAgentGoals)
  const { toast } = useToast()
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS)

  useEffect(() => {
    if (agent) setGoals(agent.goals ?? DEFAULT_GOALS)
  }, [agent])

  if (!agent) return null

  function save() {
    setAgentGoals(agent!.id, goals)
    toast({ title: 'Goals updated', description: agent!.fullName, variant: 'success' })
    onClose()
  }

  return (
    <Modal
      open={Boolean(agent)}
      onClose={onClose}
      title="Set Goals"
      description={`Production targets for ${agent.fullName}. Charts show progress toward these.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}><Target className="h-4 w-4" /> Save Goals</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            <div className="relative">
              {f.prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{f.prefix}</span>}
              <Input type="number" min="0" value={goals[f.key]} onChange={(e) => setGoals((g) => ({ ...g, [f.key]: Math.max(0, Number(e.target.value)) }))} className={f.prefix ? 'pl-7' : ''} />
            </div>
          </Field>
        ))}
      </div>
    </Modal>
  )
}
