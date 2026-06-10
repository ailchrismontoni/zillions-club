import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Download,
  Filter,
  Move,
  Network,
  Pencil,
  Search,
  ZoomIn,
} from 'lucide-react'
import type { HierNode } from '@/services/hierarchy'
import { buildForest, descendants, flatten, leaders, teamAggregate } from '@/services/hierarchy'
import { AGENT_ROLES, AGENT_STATUSES } from '@/types'
import { useAppStore } from '@/app/store'
import { useAgentsWithStats } from '@/hooks/useAgencyData'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { downloadCsv } from '@/lib/csv'
import { cn, formatCompactCurrency } from '@/lib/utils'
import { AGENT_STATUS_TONE, RANK_BADGE, ROLE_ABBREV, agentNameClass } from '@/lib/agentMeta'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { HierarchyCard } from '@/components/hierarchy/HierarchyCard'
import { ProfilePanel } from '@/components/hierarchy/ProfilePanel'
import { EditAgentModal } from '@/components/hierarchy/EditAgentModal'

type ViewMode = 'tree' | 'team' | 'list'
const ZOOM_LEVELS = [0.5, 0.65, 0.8, 1, 1.2]

export function HierarchyPage() {
  const agentsRaw = useAppStore((s) => s.agents)
  const teams = useAppStore((s) => s.teams)
  const agents = useAgentsWithStats()
  const assignToLeader = useAppStore((s) => s.assignToLeader)
  const addAuditLog = useAppStore((s) => s.addAuditLog)
  const { agent: actor, can } = useAuth()
  const { toast } = useToast()
  const canEdit = can('edit_hierarchy')
  const canMove = can('move_agents')

  const [view, setView] = useState<ViewMode>('tree')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterRank, setFilterRank] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(1)
  const [editMode, setEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const forest = useMemo(() => buildForest(agents), [agents])
  const allNodes = useMemo(() => flatten(forest), [forest])
  const nodeById = useMemo(() => new Map(allNodes.map((n) => [n.data.agent.id, n])), [allNodes])

  const q = search.trim().toLowerCase()
  const anyFilter = Boolean(q || filterRank || filterTeam || filterStatus)
  const filterCount = [filterRank, filterTeam, filterStatus].filter(Boolean).length
  const matchIds = useMemo(() => {
    const ids = new Set<string>()
    for (const n of allNodes) {
      const a = n.data.agent
      if (q && ![a.fullName, a.email, a.teamName].join(' ').toLowerCase().includes(q)) continue
      if (filterRank && a.role !== filterRank) continue
      if (filterTeam && a.teamId !== filterTeam) continue
      if (filterStatus && a.status !== filterStatus) continue
      ids.add(a.id)
    }
    return ids
  }, [allNodes, q, filterRank, filterTeam, filterStatus])

  const isExpanded = (id: string) => anyFilter || !collapsed.has(id)
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const expandAll = () => setCollapsed(new Set())
  const collapseAll = () => setCollapsed(new Set(leaders(forest).map((n) => n.data.agent.id)))
  const clearFilters = () => { setFilterRank(''); setFilterTeam(''); setFilterStatus(''); setSearch('') }

  function exportCsv() {
    const header = ['Name', 'Rank', 'Team', 'Reports To', 'Status', 'Direct', 'Total Under', 'Week ALP', 'Month ALP']
    const rows = allNodes.map((n) => {
      const a = n.data.agent
      const upline = a.leaderId ? nodeById.get(a.leaderId)?.data.agent.fullName ?? '' : 'Top of agency'
      const agg = teamAggregate(n)
      return [a.fullName, ROLE_ABBREV[a.role] || 'Agent', a.teamName, upline, a.status, agg.directCount, agg.totalUnder, Math.round(n.data.stats.weeklyAlp), Math.round(n.data.stats.monthlyAlp)]
    })
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadCsv(`zillions-hierarchy-${allNodes.length}.csv`, csv)
    toast({ title: 'Hierarchy exported', description: `${allNodes.length} agents`, variant: 'success' })
  }

  const selectedNode = selectedId ? nodeById.get(selectedId) ?? null : null
  const uplineName = selectedNode?.data.agent.leaderId
    ? nodeById.get(selectedNode.data.agent.leaderId)?.data.agent.fullName ?? null
    : null
  const editingAgent = editingId ? agentsRaw.find((a) => a.id === editingId) ?? null : null
  const disallowed = editingId
    ? [editingId, ...descendants(nodeById.get(editingId) ?? ({ children: [] } as unknown as HierNode)).map((n) => n.data.agent.id)]
    : []

  // ── Drag & drop: move an agent under a target leader ──────────────────────
  const draggingDescendants = useMemo(() => {
    if (!draggingId) return new Set<string>()
    const node = nodeById.get(draggingId)
    if (!node) return new Set<string>()
    return new Set(descendants(node).map((n) => n.data.agent.id))
  }, [draggingId, nodeById])

  const canDropOn = (targetId: string) =>
    Boolean(draggingId) && targetId !== draggingId && !draggingDescendants.has(targetId)

  function handleDrop(targetId: string) {
    if (!draggingId || !canDropOn(targetId)) {
      setDraggingId(null)
      setDropTargetId(null)
      return
    }
    const moved = agentsRaw.find((a) => a.id === draggingId)
    const target = agentsRaw.find((a) => a.id === targetId)
    assignToLeader(draggingId, targetId)
    addAuditLog({
      actorUserId: actor?.id ?? 'system',
      actorName: actor?.fullName ?? 'Admin',
      action: `Moved under ${target?.fullName ?? 'leader'} (${target?.teamName ?? ''})`,
      targetUserId: draggingId,
      targetName: moved?.fullName,
      oldValue: moved?.teamName,
      newValue: target?.teamName,
    })
    toast({ title: 'Agent moved', description: `${moved?.fullName} → ${target?.fullName}`, variant: 'success' })
    setDraggingId(null)
    setDropTargetId(null)
  }

  const nodeProps = {
    isExpanded, matchIds, anyFilter, selectedId, editMode,
    canMove, draggingId, dropTargetId,
    onToggle: toggle, onSelect: setSelectedId, onEdit: setEditingId,
    onDragStart: (id: string) => setDraggingId(id),
    onDragEnd: () => { setDraggingId(null); setDropTargetId(null) },
    onDragOver: (id: string, e: React.DragEvent) => {
      if (canDropOn(id)) { e.preventDefault(); setDropTargetId(id) }
    },
    onDragLeave: (id: string) => setDropTargetId((cur) => (cur === id ? null : cur)),
    onDrop: handleDrop,
  }

  // Center the (often wider-than-viewport) org chart horizontally.
  const treeRef = useRef<HTMLDivElement>(null)
  const centerTree = () => {
    const el = treeRef.current
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }
  useLayoutEffect(() => {
    if (view === 'tree') centerTree()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, zoom, collapsed, agents.length])
  useEffect(() => {
    if (view === 'tree') requestAnimationFrame(centerTree)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  return (
    <div className="space-y-5">
      {/* Header + toolbar (mockup style) */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Agency Hierarchy</h1>
          <p className="mt-1 text-sm text-slate-500">Explore your organization structure and team relationships.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agents…" className="h-9 pl-9" />
          </div>

          {/* Filters dropdown */}
          <Dropdown
            align="right"
            menuClassName="w-72 p-3"
            trigger={({ open }) => (
              <span className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-ink hover:bg-slate-50">
                <Filter className="h-4 w-4 text-slate-400" /> Filters
                {filterCount > 0 && <span className="rounded-full bg-electric px-1.5 text-[10px] font-bold text-white">{filterCount}</span>}
                <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
              </span>
            )}
          >
            {() => (
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <FilterField label="Rank">
                  <Select value={filterRank} onChange={(e) => setFilterRank(e.target.value)} options={[{ label: 'All ranks', value: '' }, ...AGENT_ROLES.map((r) => ({ label: r, value: r }))]} />
                </FilterField>
                <FilterField label="Team">
                  <Select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} options={[{ label: 'All teams', value: '' }, ...teams.map((t) => ({ label: t.name, value: t.id }))]} />
                </FilterField>
                <FilterField label="Status">
                  <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} options={[{ label: 'All statuses', value: '' }, ...AGENT_STATUSES.map((s) => ({ label: s, value: s }))]} />
                </FilterField>
                <button onClick={clearFilters} className="w-full rounded-lg border border-slate-200 py-1.5 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50">Clear all</button>
              </div>
            )}
          </Dropdown>

          {/* Zoom */}
          <Dropdown
            align="right"
            menuClassName="w-28"
            trigger={({ open }) => (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-ink hover:bg-slate-50">
                <ZoomIn className="h-4 w-4 text-slate-400" /> {Math.round(zoom * 100)}%
                <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
              </span>
            )}
          >
            {(close) =>
              ZOOM_LEVELS.map((z) => (
                <DropdownItem key={z} active={z === zoom} onClick={() => { setZoom(z); close() }}>
                  {Math.round(z * 100)}%
                </DropdownItem>
              ))
            }
          </Dropdown>

          <button onClick={exportCsv} title="Export" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-ink">
            <Download className="h-4 w-4" />
          </button>

          {canEdit && (
            <Button variant={editMode ? 'primary' : 'secondary'} size="sm" className="h-9" onClick={() => setEditMode((v) => !v)}>
              <Pencil className="h-3.5 w-3.5" /> {editMode ? 'Done' : 'Edit'}
            </Button>
          )}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-card">
          {(['tree', 'team', 'list'] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cn('rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold capitalize transition-colors', view === v ? 'bg-ink text-white shadow-sm' : 'text-slate-500 hover:text-ink')}>
              {v} view
            </button>
          ))}
        </div>
        {view === 'tree' && (
          <div className="flex items-center gap-1.5">
            <button onClick={expandAll} title="Expand all" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-ink">
              <ChevronsUpDown className="h-4 w-4" />
            </button>
            <button onClick={collapseAll} title="Collapse all" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-ink">
              <ChevronsDownUp className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {editMode && canMove && view === 'tree' && (
        <div className="flex items-center gap-2 rounded-xl border border-electric-100 bg-electric-50 px-4 py-2.5 text-[12.5px] font-medium text-electric-700">
          <Move className="h-4 w-4" /> Drag any card onto a leader to move them onto that team. Click the pencil to edit rank, contract level, and more.
        </div>
      )}

      {/* ── Tree (org chart) ── */}
      {view === 'tree' && (
        <Card ref={treeRef} className="relative overflow-auto bg-[radial-gradient(circle_at_1px_1px,#eef1f6_1px,transparent_0)] [background-size:22px_22px]">
          <div className="min-w-fit px-8 py-10" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
            <div className="orgtree flex justify-center">
              <ul>
                {forest.map((root) => (
                  <OrgNode key={root.data.agent.id} node={root} {...nodeProps} />
                ))}
              </ul>
            </div>
          </div>

          {/* Legend */}
          <div className="sticky bottom-0 left-0 flex justify-center pb-4">
            <div className="flex items-center gap-5 rounded-full border border-slate-200 bg-white/90 px-5 py-2 text-[12px] font-semibold shadow-card backdrop-blur">
              <LegendItem className="bg-amber-100 text-amber-700" abbr="RGA" label="Regional General Agent" />
              <LegendItem className="bg-amber-100 text-amber-700" abbr="MGA" label="Master General Agent" />
              <LegendItem className="bg-violet-100 text-violet-700" abbr="GA" label="General Agent" />
              <LegendItem className="bg-sky-100 text-sky-700" abbr="SA" label="Supervising Agent" />
              <LegendItem className="bg-slate-100 text-slate-500" abbr="CA" label="Career Agent" />
            </div>
          </div>
        </Card>
      )}

      {/* ── Team view ── */}
      {view === 'team' && (
        <div className="space-y-4">
          {leaders(forest).map((leader) => {
            const agg = teamAggregate(leader)
            const members = anyFilter ? leader.children.filter((c) => matchIds.has(c.data.agent.id)) : leader.children
            if (anyFilter && members.length === 0 && !matchIds.has(leader.data.agent.id)) return null
            return (
              <Card key={leader.data.agent.id} className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <button onClick={() => setSelectedId(leader.data.agent.id)} className="flex items-center gap-3 text-left">
                    <Avatar name={leader.data.agent.fullName} src={leader.data.agent.avatarUrl} size="md" />
                    <div>
                      <p className={cn('text-[15px]', agentNameClass(leader.data.agent.role))}>{leader.data.agent.teamName}</p>
                      <p className="text-[12px] text-slate-500">Leader: {leader.data.agent.fullName} · {ROLE_ABBREV[leader.data.agent.role] || 'Agent'}</p>
                    </div>
                  </button>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px]">
                    <Metric label="Total" value={String(agg.totalUnder)} />
                    <Metric label="Direct" value={String(agg.directCount)} />
                    <Metric label="Wk ALP" value={formatCompactCurrency(agg.weeklyAlp)} strong />
                    <Metric label="Mo ALP" value={formatCompactCurrency(agg.monthlyAlp)} />
                    <Metric label="Sales" value={String(agg.weeklySales)} />
                    <Metric label="Appts" value={String(agg.weeklyAppointments)} />
                    <Metric label="Refs" value={String(agg.weeklyReferrals)} />
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {members.map((c) => (
                    <button key={c.data.agent.id} onClick={() => setSelectedId(c.data.agent.id)} className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-slate-50">
                      <Avatar name={c.data.agent.fullName} src={c.data.agent.avatarUrl} size="sm" />
                      <div className="min-w-0 flex-1">
                        <span className={cn('truncate text-[13.5px]', agentNameClass(c.data.agent.role))}>{c.data.agent.fullName}</span>
                        {c.children.length > 0 && <span className="ml-2 text-[11px] text-slate-400">leads {c.children.length}</span>}
                      </div>
                      <Badge tone={AGENT_STATUS_TONE[c.data.agent.status]} dot>{c.data.agent.status}</Badge>
                      <span className="w-16 text-right text-[13.5px] font-extrabold tabular text-ink">{formatCompactCurrency(c.data.stats.weeklyAlp)}</span>
                    </button>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── List view ── */}
      {view === 'list' && (
        <Card className="p-3">
          {allNodes
            .filter((n) => !anyFilter || matchIds.has(n.data.agent.id))
            .map((n) => (
              <button key={n.data.agent.id} onClick={() => setSelectedId(n.data.agent.id)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50" style={{ paddingLeft: 8 + n.depth * 24 }}>
                {n.depth > 0 && <span className="text-slate-300">└</span>}
                <Avatar name={n.data.agent.fullName} src={n.data.agent.avatarUrl} size="xs" />
                <span className={cn('text-[13px]', agentNameClass(n.data.agent.role))}>{n.data.agent.fullName}</span>
                {ROLE_ABBREV[n.data.agent.role] && <span className={cn('rounded px-1 py-0.5 text-[9px] font-bold', RANK_BADGE[n.data.agent.role])}>{ROLE_ABBREV[n.data.agent.role]}</span>}
                <span className="text-[11.5px] text-slate-400">{n.data.agent.teamName}</span>
                <span className="ml-auto text-[12.5px] font-bold tabular text-slate-600">{formatCompactCurrency(n.data.stats.weeklyAlp)}</span>
              </button>
            ))}
        </Card>
      )}

      {allNodes.length === 0 && (
        <Card className="flex flex-col items-center py-16 text-center">
          <Network className="mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">No agents in the hierarchy yet.</p>
        </Card>
      )}

      <ProfilePanel node={selectedNode} uplineName={uplineName} onClose={() => setSelectedId(null)} onSelectAgent={setSelectedId} />
      <EditAgentModal agent={editingAgent} agents={agentsRaw} disallowedLeaderIds={disallowed} onClose={() => setEditingId(null)} />
    </div>
  )
}

// ─── Recursive org-chart node (<li>) ──────────────────────────────────────
interface NodeProps {
  node: HierNode
  isExpanded: (id: string) => boolean
  matchIds: Set<string>
  anyFilter: boolean
  selectedId: string | null
  editMode: boolean
  canMove: boolean
  draggingId: string | null
  dropTargetId: string | null
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  onEdit: (id: string) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDragOver: (id: string, e: React.DragEvent) => void
  onDragLeave: (id: string) => void
  onDrop: (id: string) => void
}

function OrgNode({ node, ...p }: NodeProps) {
  const id = node.data.agent.id
  const expanded = p.isExpanded(id)
  const hasChildren = node.children.length > 0

  return (
    <li>
      <HierarchyCard
        node={node}
        expanded={expanded}
        selected={p.selectedId === id}
        highlighted={p.anyFilter && p.matchIds.has(id)}
        dimmed={p.anyFilter && !p.matchIds.has(id)}
        editMode={p.editMode}
        canMove={p.canMove}
        isDragging={p.draggingId === id}
        isDropTarget={p.dropTargetId === id}
        onToggle={() => p.onToggle(id)}
        onSelect={() => p.onSelect(id)}
        onEdit={() => p.onEdit(id)}
        onDragStart={() => p.onDragStart(id)}
        onDragEnd={p.onDragEnd}
        onDragOver={(e) => p.onDragOver(id, e)}
        onDragLeave={() => p.onDragLeave(id)}
        onDrop={() => p.onDrop(id)}
      />
      {hasChildren && expanded && (
        <ul>
          {node.children.map((c) => (
            <OrgNode key={c.data.agent.id} node={c} {...p} />
          ))}
        </ul>
      )}
    </li>
  )
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={strong ? 'text-[14px] font-extrabold tabular text-ink' : 'text-[13px] font-semibold tabular text-slate-600'}>{value}</p>
    </div>
  )
}
function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      {children}
    </label>
  )
}
function LegendItem({ className, abbr, label }: { className: string; abbr: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', className)}>{abbr}</span>
      <span className="text-slate-500">{label}</span>
    </span>
  )
}
