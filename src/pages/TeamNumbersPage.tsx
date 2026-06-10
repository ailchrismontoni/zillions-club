import { Fragment, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { SubmitDailyNumbersModal } from '@/components/agents/SubmitDailyNumbersModal'
import { agentDisplayName, agentNameClass } from '@/lib/agentMeta'
import { dayIndexInWeek, weekDays } from '@/lib/dateRanges'
import { cn } from '@/lib/utils'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SUB = ['Dials', 'Appts', 'Pres', 'Sales', 'ALP', 'Ref Got', 'Ref Seen', 'Ref Sold', 'Ref ALP', 'Proj Appts']
const TOTAL_SUB = ['Dials', 'Appts', 'Pres', 'Sales', 'ALP', 'Ref Got', 'Ref Seen', 'Ref Sold', 'Ref ALP']

// Left frozen columns
const LEFT = [
  { key: 'agent', label: 'Agent', w: 178, left: 0 },
  { key: 'hire', label: 'Hire Date', w: 64, left: 178 },
  { key: 'm7', label: '7th Month', w: 64, left: 242 },
  { key: 'f6', label: 'F6', w: 38, left: 306 },
]
const LEFT_WIDTH = 344

function money(v: number): string {
  return `$${Math.round(v).toLocaleString('en-US')}`
}
function mdy(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`
}
function seventhMonth(iso: string): string {
  const d = new Date(iso)
  const s = new Date(d.getFullYear(), d.getMonth() + 6, 1)
  return `${s.getMonth() + 1}/${s.getDate()}/${String(s.getFullYear()).slice(2)}`
}
function f6Flag(iso: string): 'Yes' | 'No' {
  const months = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30.4)
  return months <= 6 ? 'Yes' : 'No'
}
function subWidth(label: string): number {
  if (label === 'ALP' || label === 'Ref ALP') return 58
  if (label === 'Proj Appts') return 48
  if (label.startsWith('Ref')) return 46
  return 42
}

interface Cell {
  has: boolean
  dials: number
  appts: number
  pres: number
  sales: number
  alp: number
  refGot: number
  refSeen: number
  refSold: number
  refAlp: number
  proj: number
}
const emptyCell = (): Cell => ({ has: false, dials: 0, appts: 0, pres: 0, sales: 0, alp: 0, refGot: 0, refSeen: 0, refSold: 0, refAlp: 0, proj: 0 })

export function TeamNumbersPage() {
  const navigate = useNavigate()
  const agents = useAppStore((s) => s.agents)
  const production = useAppStore((s) => s.production)
  const addDailyNumbers = useAppStore((s) => s.addDailyNumbers)
  const { agent: me, role, isOwner, isAdmin, isLeader } = useAuth()
  const { toast } = useToast()

  const [weekOffset, setWeekOffset] = useState(0)
  const [submitOpen, setSubmitOpen] = useState(false)

  const days = useMemo(() => weekDays(new Date(), weekOffset), [weekOffset])
  const weekStart = days[0]
  const weekLabel = `${days[0].getMonth() + 1}/${days[0].getDate()} – ${days[6].getMonth() + 1}/${days[6].getDate()}`

  // Build per-agent, per-day aggregated rows + grand totals.
  const { rows, grand, grandWeek } = useMemo(() => {
    const grand = days.map(emptyCell)
    const grandWeek = emptyCell()

    const rows = agents.map((agent) => {
      const cells = days.map(emptyCell)
      for (const e of production) {
        if (e.agentId !== agent.id) continue
        const di = dayIndexInWeek(e.date, weekStart)
        if (di < 0) continue
        const c = cells[di]
        c.has = true
        c.dials += e.dials ?? e.callsMade ?? 0
        c.appts += e.appointmentsSet
        c.pres += e.presentationsSat
        c.sales += e.salesCount
        c.alp += e.alp
        c.refGot += e.referralsCollected
        c.refSeen += e.referralsSat ?? 0
        c.refSold += e.referralSales ?? 0
        c.refAlp += e.referralAlp ?? 0
        c.proj += e.projectedAppointments ?? 0
      }
      const wt = emptyCell()
      wt.has = cells.some((c) => c.has)
      cells.forEach((c, i) => {
        ;(['dials', 'appts', 'pres', 'sales', 'alp', 'refGot', 'refSeen', 'refSold', 'refAlp', 'proj'] as const).forEach((k) => {
          wt[k] += c[k]
          grand[i][k] += c[k]
          grand[i].has = grand[i].has || c.has
          grandWeek[k] += c[k]
        })
      })
      return { agent, cells, wt }
    })
    return { rows, grand, grandWeek }
  }, [agents, production, days, weekStart])

  const headBase = 'sticky top-0 border border-white/10 bg-navy-800 text-white text-center whitespace-nowrap'
  const subHeadBase = 'sticky border border-white/10 bg-navy-700 text-white text-[10px] font-semibold text-center whitespace-nowrap'

  const canSubmit = Boolean(me) // every user can submit their own

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team Numbers"
        description="The full team production board — everyone's daily numbers, Monday through Sunday."
        actions={
          canSubmit ? (
            <Button variant="primary" size="sm" onClick={() => setSubmitOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Submit My Numbers
            </Button>
          ) : undefined
        }
      />

      {/* Week selector */}
      <div className="flex items-center gap-2">
        <button onClick={() => setWeekOffset((w) => w - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-ink" aria-label="Previous week">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-semibold text-ink">
          <CalendarDays className="h-4 w-4 text-electric" />
          {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : weekOffset === 1 ? 'Next Week' : weekLabel}
          <span className="font-medium text-slate-400">· {weekLabel}</span>
        </div>
        <button onClick={() => setWeekOffset((w) => w + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-ink" aria-label="Next week">
          <ChevronRight className="h-4 w-4" />
        </button>
        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)} className="text-[13px] font-semibold text-electric hover:underline">Today</button>
        )}
        {(isOwner || isAdmin || isLeader) && (
          <span className="ml-auto text-[12px] capitalize text-slate-400">Viewing all {agents.length} agents · {role}</span>
        )}
      </div>

      {/* Spreadsheet */}
      <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-card" style={{ maxHeight: 'calc(100vh - 230px)' }}>
        <table className="border-separate border-spacing-0 text-[11px] tabular">
          <thead>
            {/* Group row */}
            <tr>
              {LEFT.map((col) => (
                <th
                  key={col.key}
                  rowSpan={2}
                  className={cn(headBase, 'z-30 text-left')}
                  style={{ left: col.left, width: col.w, minWidth: col.w, maxWidth: col.w, paddingLeft: 8, paddingRight: 4 }}
                >
                  {col.label}
                </th>
              ))}
              {days.map((d, i) => (
                <th key={i} colSpan={10} className={cn(headBase, 'z-20 py-1.5 text-[11px] font-bold')}>
                  {DAY_NAMES[i]} <span className="font-medium text-white/50">{d.getMonth() + 1}/{d.getDate()}</span>
                </th>
              ))}
              <th colSpan={9} className={cn(headBase, 'z-20 bg-amber-600 py-1.5 text-[11px] font-bold')}>WEEK TOTALS</th>
            </tr>
            {/* Sub row */}
            <tr>
              {days.map((_, di) =>
                DAY_SUB.map((label, ci) => (
                  <th
                    key={`${di}-${ci}`}
                    className={cn(subHeadBase, 'z-20 px-1 py-1')}
                    style={{ top: 29, width: subWidth(label), minWidth: subWidth(label) }}
                  >
                    {label}
                  </th>
                )),
              )}
              {TOTAL_SUB.map((label, ci) => (
                <th key={`t-${ci}`} className={cn(subHeadBase, 'z-20 bg-amber-700 px-1 py-1')} style={{ top: 29, width: subWidth(label), minWidth: subWidth(label) }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map(({ agent, cells, wt }, ri) => (
              <tr key={agent.id} className="group">
                {/* Frozen left */}
                <td
                  className="sticky z-10 cursor-pointer border border-slate-200 bg-white px-2 py-1 text-left group-hover:bg-slate-50"
                  style={{ left: 0, width: LEFT[0].w, minWidth: LEFT[0].w, maxWidth: LEFT[0].w }}
                  onClick={() => navigate(`/agents/${agent.id}`)}
                >
                  <span className={cn('truncate', agentNameClass(agent.role))}>{agentDisplayName(agent.fullName, agent.role)}</span>
                </td>
                <td className="sticky z-10 border border-slate-200 bg-white px-1 py-1 text-center text-[10px] text-slate-500 group-hover:bg-slate-50" style={{ left: LEFT[1].left, width: LEFT[1].w, minWidth: LEFT[1].w }}>{mdy(agent.startDate)}</td>
                <td className="sticky z-10 border border-slate-200 bg-white px-1 py-1 text-center text-[10px] text-slate-500 group-hover:bg-slate-50" style={{ left: LEFT[2].left, width: LEFT[2].w, minWidth: LEFT[2].w }}>{seventhMonth(agent.startDate)}</td>
                <td className="sticky z-10 border border-slate-200 bg-white px-1 py-1 text-center text-[10px] font-semibold text-slate-500 group-hover:bg-slate-50" style={{ left: LEFT[3].left, width: LEFT[3].w, minWidth: LEFT[3].w }}>{f6Flag(agent.startDate)}</td>

                {/* Day cells */}
                {cells.map((c, di) => (
                  <Fragment key={di}>
                    <NumCell v={c.has ? c.dials : null} />
                    <NumCell v={c.has ? c.appts : null} />
                    <NumCell v={c.has ? c.pres : null} />
                    <NumCell v={c.has ? c.sales : null} />
                    <NumCell v={c.has ? money(c.alp) : null} />
                    <NumCell v={c.has ? c.refGot : null} />
                    <NumCell v={c.has ? c.refSeen : null} />
                    <NumCell v={c.has ? c.refSold : null} />
                    <NumCell v={c.has ? money(c.refAlp) : null} />
                    <NumCell v={c.has ? c.proj : null} />
                  </Fragment>
                ))}

                {/* Week totals */}
                <NumCell v={wt.dials} total />
                <NumCell v={wt.appts} total />
                <NumCell v={wt.pres} total />
                <NumCell v={wt.sales} total />
                <NumCell v={money(wt.alp)} total />
                <NumCell v={wt.refGot} total />
                <NumCell v={wt.refSeen} total />
                <NumCell v={wt.refSold} total />
                <NumCell v={money(wt.refAlp)} total />
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td className="sticky bottom-0 z-20 border border-white/10 bg-navy-900 px-2 py-1.5 text-left text-[11px] font-bold text-white" style={{ left: 0, width: LEFT[0].w, minWidth: LEFT[0].w }}>Total</td>
              <td className="sticky bottom-0 z-20 border border-white/10 bg-navy-900" style={{ left: LEFT[1].left, width: LEFT[1].w, minWidth: LEFT[1].w }} />
              <td className="sticky bottom-0 z-20 border border-white/10 bg-navy-900" style={{ left: LEFT[2].left, width: LEFT[2].w, minWidth: LEFT[2].w }} />
              <td className="sticky bottom-0 z-20 border border-white/10 bg-navy-900" style={{ left: LEFT[3].left, width: LEFT[3].w, minWidth: LEFT[3].w }} />
              {grand.map((c, di) => (
                <Fragment key={di}>
                  <FootCell v={c.dials} />
                  <FootCell v={c.appts} />
                  <FootCell v={c.pres} />
                  <FootCell v={c.sales} />
                  <FootCell v={money(c.alp)} />
                  <FootCell v={c.refGot} />
                  <FootCell v={c.refSeen} />
                  <FootCell v={c.refSold} />
                  <FootCell v={money(c.refAlp)} />
                  <FootCell v={c.proj} />
                </Fragment>
              ))}
              <FootCell v={grandWeek.dials} amber />
              <FootCell v={grandWeek.appts} amber />
              <FootCell v={grandWeek.pres} amber />
              <FootCell v={grandWeek.sales} amber />
              <FootCell v={money(grandWeek.alp)} amber />
              <FootCell v={grandWeek.refGot} amber />
              <FootCell v={grandWeek.refSeen} amber />
              <FootCell v={grandWeek.refSold} amber />
              <FootCell v={money(grandWeek.refAlp)} amber />
            </tr>
          </tfoot>
        </table>
      </div>

      {me && (
        <SubmitDailyNumbersModal
          open={submitOpen}
          onClose={() => setSubmitOpen(false)}
          onSubmit={(d) => {
            addDailyNumbers(me.id, d)
            toast({ title: 'Daily numbers submitted', description: 'Your numbers are on the board.', variant: 'success' })
          }}
        />
      )}
    </div>
  )
}

function NumCell({ v, total }: { v: number | string | null; total?: boolean }) {
  return (
    <td
      className={cn(
        'border border-slate-200 px-1 py-1 text-center',
        total ? 'bg-amber-50 font-semibold text-ink' : 'bg-[#eaf7fd] text-slate-700',
      )}
    >
      {v === null || v === undefined ? '' : v}
    </td>
  )
}

function FootCell({ v, amber }: { v: number | string; amber?: boolean }) {
  return (
    <td className={cn('sticky bottom-0 z-10 border border-white/10 px-1 py-1.5 text-center text-[11px] font-bold text-white', amber ? 'bg-amber-700' : 'bg-navy-900')}>
      {v}
    </td>
  )
}
