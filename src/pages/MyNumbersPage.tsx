import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useAgentWithStats } from '@/hooks/useAgencyData'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/app/store'
import { useToast } from '@/hooks/useToast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import { AgentStatCards } from '@/components/agents/AgentStatCards'
import { NumbersTab } from '@/components/agents/tabs/NumbersTab'
import { SubmitDailyNumbersModal } from '@/components/agents/SubmitDailyNumbersModal'

export function MyNumbersPage() {
  const { agent: me } = useAuth()
  const data = useAgentWithStats(me?.id)
  const addDailyNumbers = useAppStore((s) => s.addDailyNumbers)
  const { toast } = useToast()
  const [addOpen, setAddOpen] = useState(false)

  if (!data) return null
  const { agent, stats } = data

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Numbers"
        description="Your personal production, pacing, and goal tracking."
        actions={
          <div className="flex items-center gap-2.5">
            <Link to={`/agents/${agent.id}`}>
              <Button variant="secondary" size="sm">
                My Profile <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Production
            </Button>
          </div>
        }
      />

      <AgentStatCards stats={stats} />
      <NumbersTab agent={agent} stats={stats} />

      <SubmitDailyNumbersModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(d) => {
          addDailyNumbers(agent.id, d)
          toast({ title: 'Daily numbers submitted', variant: 'success' })
        }}
      />
    </div>
  )
}
