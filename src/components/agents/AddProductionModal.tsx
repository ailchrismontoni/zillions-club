import { useEffect, useState } from 'react'
import type { ProductionEntry } from '@/types'
import { useAppStore } from '@/app/store'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Field } from '@/components/ui/Input'

interface AddProductionModalProps {
  open: boolean
  onClose: () => void
  agentId: string
  agentName: string
  /** When provided, edits this entry instead of adding a new one. */
  editing?: ProductionEntry | null
}

const todayInput = () => new Date().toISOString().slice(0, 10)

interface Draft {
  date: string
  alp: string
  familiesProtected: string
  salesCount: string
  presentationsSat: string
  appointmentsSet: string
  appointmentsShowed: string
  callsMade: string
  talkTimeMinutes: string
  referralsCollected: string
  notes: string
}

const EMPTY: Draft = {
  date: todayInput(),
  alp: '',
  familiesProtected: '',
  salesCount: '',
  presentationsSat: '',
  appointmentsSet: '',
  appointmentsShowed: '',
  callsMade: '',
  talkTimeMinutes: '',
  referralsCollected: '',
  notes: '',
}

const NUM_FIELDS: { key: keyof Draft; label: string }[] = [
  { key: 'alp', label: 'ALP written ($)' },
  { key: 'familiesProtected', label: 'Families protected' },
  { key: 'salesCount', label: 'Sales count' },
  { key: 'presentationsSat', label: 'Presentations sat' },
  { key: 'appointmentsSet', label: 'Appointments set' },
  { key: 'appointmentsShowed', label: 'Appointments showed' },
  { key: 'callsMade', label: 'Calls made' },
  { key: 'talkTimeMinutes', label: 'Talk time (min)' },
  { key: 'referralsCollected', label: 'Referrals collected' },
]

export function AddProductionModal({
  open,
  onClose,
  agentId,
  agentName,
  editing,
}: AddProductionModalProps) {
  const addProduction = useAppStore((s) => s.addProduction)
  const updateProduction = useAppStore((s) => s.updateProduction)
  const { toast } = useToast()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (editing) {
      setDraft({
        date: editing.date.slice(0, 10),
        alp: String(editing.alp),
        familiesProtected: String(editing.familiesProtected),
        salesCount: String(editing.salesCount),
        presentationsSat: String(editing.presentationsSat),
        appointmentsSet: String(editing.appointmentsSet),
        appointmentsShowed: String(editing.appointmentsShowed),
        callsMade: String(editing.callsMade),
        talkTimeMinutes: String(editing.talkTimeMinutes),
        referralsCollected: String(editing.referralsCollected),
        notes: editing.notes,
      })
    } else {
      setDraft({ ...EMPTY, date: todayInput() })
    }
    setError('')
  }, [open, editing])

  function set<K extends keyof Draft>(key: K, value: string) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const n = (v: string) => Math.max(0, Math.round(Number(v) || 0))

  function handleSave() {
    if (!draft.alp || Number(draft.alp) <= 0) {
      setError('Enter the ALP written for this entry.')
      return
    }
    const payload = {
      agentId,
      date: new Date(draft.date + 'T12:00:00').toISOString(),
      alp: n(draft.alp),
      familiesProtected: n(draft.familiesProtected),
      salesCount: n(draft.salesCount),
      presentationsSat: n(draft.presentationsSat),
      appointmentsSet: n(draft.appointmentsSet),
      appointmentsShowed: n(draft.appointmentsShowed),
      callsMade: n(draft.callsMade),
      talkTimeMinutes: n(draft.talkTimeMinutes),
      referralsCollected: n(draft.referralsCollected),
      notes: draft.notes,
    }
    if (editing) {
      updateProduction(editing.id, payload)
      toast({ title: 'Production updated', variant: 'success' })
    } else {
      addProduction(payload)
      toast({ title: 'Production added', description: agentName, variant: 'success' })
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Production' : 'Add Production'}
      description={`Production numbers for ${agentName}.`}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editing ? 'Save Changes' : 'Add Production'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-3">
          <Field label="Date" required error={error}>
            <Input type="date" value={draft.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
        </div>
        {NUM_FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            <Input
              type="number"
              min="0"
              inputMode="numeric"
              value={draft[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder="0"
            />
          </Field>
        ))}
        <div className="col-span-2 sm:col-span-3">
          <Field label="Notes">
            <Textarea
              rows={2}
              value={draft.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Anything notable about this day…"
            />
          </Field>
        </div>
      </div>
    </Modal>
  )
}
