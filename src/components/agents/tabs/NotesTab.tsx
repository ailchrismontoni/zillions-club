import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import type { Agent } from '@/types'
import { useAppStore } from '@/app/store'
import { useToast } from '@/hooks/useToast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { relativeTime } from '@/lib/dateRanges'

export function NotesTab({ agent }: { agent: Agent }) {
  const updateAgent = useAppStore((s) => s.updateAgent)
  const { toast } = useToast()
  const [value, setValue] = useState(agent.notes)

  useEffect(() => setValue(agent.notes), [agent.id, agent.notes])

  const dirty = value !== agent.notes

  function save() {
    updateAgent(agent.id, { notes: value })
    toast({ title: 'Notes saved', variant: 'success' })
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-ink">Notes</h3>
          <p className="text-[12.5px] text-slate-500">Private notes about {agent.fullName}.</p>
        </div>
        <Button variant="primary" size="sm" disabled={!dirty} onClick={save}>
          <Save className="h-3.5 w-3.5" /> Save
        </Button>
      </div>
      <Textarea
        rows={10}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add notes about coaching, goals, licensing, personal context…"
      />
      <p className="mt-2 text-[11px] text-slate-400">Last updated {relativeTime(agent.updatedAt)}</p>
    </Card>
  )
}
