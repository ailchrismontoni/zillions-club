import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { Household, Referral, ReferralStatus } from '@/types'
import { HOUSEHOLD_OPTIONS, REFERRAL_STATUSES } from '@/types'
import { useAppStore } from '@/app/store'
import { useToast } from '@/hooks/useToast'
import { useReferralActions } from '@/hooks/useReferralActions'
import { isSmsCapablePhone } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Field } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface AddAgentReferralModalProps {
  open: boolean
  onClose: () => void
  agentId: string
  agentName: string
}

interface Draft {
  name: string
  relation: string
  city: string
  occupation: string
  household: Household
  spouse: string
  phone: string
  sponsor: string
  source: string
  notes: string
  status: ReferralStatus
}

const empty = (sponsor: string): Draft => ({
  name: '',
  relation: '',
  city: '',
  occupation: '',
  household: 'Single',
  spouse: '',
  phone: '',
  sponsor,
  source: 'Manual',
  notes: '',
  status: 'New',
})

export function AddAgentReferralModal({
  open,
  onClose,
  agentId,
  agentName,
}: AddAgentReferralModalProps) {
  const addReferral = useAppStore((s) => s.addReferral)
  const { toast } = useToast()
  const { sendToAI } = useReferralActions()
  const [draft, setDraft] = useState<Draft>(empty(agentName))
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({})

  useEffect(() => {
    if (open) {
      setDraft(empty(agentName))
      setErrors({})
    }
  }, [open, agentName])

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(send: boolean): boolean {
    const next: Partial<Record<keyof Draft, string>> = {}
    if (!draft.name.trim()) next.name = 'Name is required.'
    if (send) {
      if (!draft.phone.trim()) next.phone = 'Phone is required to send to AI.'
      else if (!isSmsCapablePhone(draft.phone)) next.phone = 'Use a valid SMS-capable phone number.'
    } else if (draft.phone.trim() && !isSmsCapablePhone(draft.phone)) {
      next.phone = 'Use a valid SMS-capable phone number.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSave(send: boolean) {
    if (!validate(send)) return
    const created: Referral = addReferral({ ...draft, agentId })
    onClose()
    toast({ title: 'Referral added', description: `${draft.name} → ${agentName}`, variant: 'success' })
    if (send) await sendToAI(created)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Referral"
      description={`New referral for ${agentName}'s ref book.`}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="black" onClick={() => handleSave(false)}>
            Save Referral
          </Button>
          <Button variant="primary" onClick={() => handleSave(true)}>
            <Sparkles className="h-4 w-4" />
            Save &amp; Send to AI
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" required error={errors.name}>
          <Input value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Jane Doe" autoFocus />
        </Field>
        <Field label="Relation">
          <Input value={draft.relation} onChange={(e) => set('relation', e.target.value)} placeholder="Brother, Friend…" />
        </Field>
        <Field label="City">
          <Input value={draft.city} onChange={(e) => set('city', e.target.value)} placeholder="Cleveland" />
        </Field>
        <Field label="Occupation">
          <Input value={draft.occupation} onChange={(e) => set('occupation', e.target.value)} placeholder="Firefighter" />
        </Field>
        <Field label="Household">
          <Select
            value={draft.household}
            onChange={(e) => set('household', e.target.value as Household)}
            options={HOUSEHOLD_OPTIONS.map((h) => ({ label: h, value: h }))}
          />
        </Field>
        <Field label="Spouse">
          <Input value={draft.spouse} onChange={(e) => set('spouse', e.target.value)} placeholder="—" />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <Input value={draft.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(440) 867-3640" inputMode="tel" />
        </Field>
        <Field label="Source">
          <Input value={draft.source} onChange={(e) => set('source', e.target.value)} placeholder="Warm market" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <Textarea rows={2} value={draft.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anything worth remembering…" />
          </Field>
        </div>
        <Field label="Status">
          <Select
            value={draft.status}
            onChange={(e) => set('status', e.target.value as ReferralStatus)}
            options={REFERRAL_STATUSES.map((s) => ({ label: s, value: s }))}
          />
        </Field>
      </div>
    </Modal>
  )
}
