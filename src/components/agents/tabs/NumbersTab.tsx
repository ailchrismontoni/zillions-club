import { Fragment, useMemo, useState } from 'react'
import { BarChart3, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Agent, ComputedAgentStats, ProductionEntry } from '@/types'
import { useAppStore } from '@/app/store'
import { useToast } from '@/hooks/useToast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddProductionModal } from '@/components/agents/AddProductionModal'
import { SubmitDailyNumbersModal } from '@/components/agents/SubmitDailyNumbersModal'
import { formatCompactCurrency, formatCurrency } from '@/lib/utils'
import { formatShortDate } from '@/lib/dateRanges'

const COLS = ['Date', 'ALP', 'Families', 'Sales', 'Pres. Sat', 'Appts Set', 'Showed', 'Calls', 'Talk', 'Refs', '']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface MonthGroup {
  key: string
  label: string
  rows: ProductionEntry[]
  total: number
}

export function NumbersTab({ agent, stats }: { agent: Agent; stats: ComputedAgentStats }) {
  const production = useAppStore((s) => s.production)
  const deleteProduction = useAppStore((s) => s.deleteProduction)
  const addDailyNumbers = useAppStore((s) => s.addDailyNumbers)
  const { toast } = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<ProductionEntry | null>(null)

  const entries = useMemo(
    () =>
      production
        .filter((p) => p.agentId === agent.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [production, agent.id],
  )

  // Group by month (newest month first, days descending within each month).
  const groups = useMemo(() => {
    const out: MonthGroup[] = []
    for (const e of entries) {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      let g = out.find((x) => x.key === key)
      if (!g) {
        g = { key, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, rows: [], total: 0 }
        out.push(g)
      }
      g.rows.push(e)
      g.total += e.alp
    }
    return out
  }, [entries])

  function handleDelete(entry: ProductionEntry) {
    deleteProduction(entry.id)
    toast({ title: 'Entry deleted', variant: 'success' })
  }

  const avgPerSale = formatCompactCurrency(Math.round(stats.averageAlpPerSale))

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="text-[15px] font-bold text-ink">Production history</h3>
            <p className="text-[12.5px] text-slate-500">
              {entries.length} entries · avg {avgPerSale}/sale · grouped by month, newest first
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Numbers
          </Button>
        </div>

        {entries.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={BarChart3}
              title="No production logged"
              description="Add the agent's first production entry to power their stats."
              action={
                <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Numbers
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur">
                <tr className="border-y border-slate-100">
                  {COLS.map((c, i) => (
                    <th key={c + i} className="whitespace-nowrap px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <Fragment key={g.key}>
                    <tr className="bg-slate-50/80">
                      <td colSpan={COLS.length} className="border-y border-slate-100 px-3 py-1.5">
                        <span className="text-[12px] font-bold uppercase tracking-wider text-ink">{g.label}</span>
                        <span className="ml-2 text-[11.5px] font-medium text-slate-400">
                          {g.rows.length} {g.rows.length === 1 ? 'day' : 'days'} · {formatCurrency(g.total)} ALP
                        </span>
                      </td>
                    </tr>
                    {g.rows.map((e) => (
                      <tr key={e.id} className="group border-b border-slate-100 text-[13px] transition-colors hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-ink">{formatShortDate(e.date)}</td>
                        <td className="px-3 py-2.5 font-extrabold tabular text-ink">{formatCurrency(e.alp)}</td>
                        <td className="px-3 py-2.5 tabular text-slate-600">{e.familiesProtected}</td>
                        <td className="px-3 py-2.5 tabular text-slate-600">{e.salesCount}</td>
                        <td className="px-3 py-2.5 tabular text-slate-600">{e.presentationsSat}</td>
                        <td className="px-3 py-2.5 tabular text-slate-600">{e.appointmentsSet}</td>
                        <td className="px-3 py-2.5 tabular text-slate-600">{e.appointmentsShowed}</td>
                        <td className="px-3 py-2.5 tabular text-slate-600">{e.callsMade}</td>
                        <td className="px-3 py-2.5 tabular text-slate-600">{e.talkTimeMinutes}m</td>
                        <td className="px-3 py-2.5 tabular text-slate-600">{e.referralsCollected}</td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button onClick={() => setEditing(e)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink" title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDelete(e)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <SubmitDailyNumbersModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(d) => {
          addDailyNumbers(agent.id, d)
          toast({ title: 'Daily numbers submitted', description: agent.fullName, variant: 'success' })
        }}
      />
      <AddProductionModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        agentId={agent.id}
        agentName={agent.fullName}
        editing={editing}
      />
    </div>
  )
}
