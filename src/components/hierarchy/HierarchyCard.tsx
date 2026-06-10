import { ChevronDown, MoreVertical, Pencil, Users } from 'lucide-react'
import type { HierNode } from '@/services/hierarchy'
import { descendants, teamAggregate } from '@/services/hierarchy'
import { Avatar } from '@/components/ui/Avatar'
import { RANK_BADGE, ROLE_ABBREV } from '@/lib/agentMeta'
import { cn } from '@/lib/utils'

interface HierarchyCardProps {
  node: HierNode
  expanded: boolean
  selected: boolean
  highlighted: boolean
  dimmed: boolean
  editMode: boolean
  canMove?: boolean
  isDragging?: boolean
  isDropTarget?: boolean
  onToggle: () => void
  onSelect: () => void
  onEdit: () => void
  onDragStart?: () => void
  onDragEnd?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: () => void
}

export function HierarchyCard({
  node,
  expanded,
  selected,
  highlighted,
  dimmed,
  editMode,
  canMove,
  isDragging,
  isDropTarget,
  onToggle,
  onSelect,
  onEdit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: HierarchyCardProps) {
  const { agent } = node.data
  const variant = node.depth === 0 ? 'top' : node.children.length > 0 ? 'leader' : 'agent'
  const abbr = ROLE_ABBREV[agent.role] || 'Agent'
  const subtree = descendants(node)
  const totalAgents = subtree.length
  const totalLeaders = subtree.filter((n) => n.children.length > 0).length

  const draggable = Boolean(editMode && canMove)
  const dnd = {
    draggable,
    onDragStart: draggable ? (e: React.DragEvent) => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', agent.id); onDragStart?.() } : undefined,
    onDragEnd: draggable ? () => onDragEnd?.() : undefined,
    onDragOver: (e: React.DragEvent) => onDragOver?.(e),
    onDragLeave: () => onDragLeave?.(),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); onDrop?.() },
  }

  const ring = cn(
    selected && 'ring-2 ring-electric ring-offset-2',
    highlighted && !selected && 'ring-2 ring-amber-400 ring-offset-2',
    isDropTarget && 'ring-2 ring-emerald-400 ring-offset-2',
    isDragging && 'opacity-40',
    draggable && 'cursor-move',
    dimmed && !isDropTarget && 'opacity-40',
  )

  // ── Top leader (premium dark card) ──────────────────────────────────────
  if (variant === 'top') {
    return (
      <div
        onClick={onSelect}
        {...dnd}
        className={cn(
          'relative flex w-[360px] cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-navy-700 bg-navy-900 px-5 py-4 text-white shadow-broadcast transition-all hover:-translate-y-0.5',
          ring,
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy-700 via-navy-800 to-navy-900" />
        <div className="pointer-events-none absolute -right-10 -top-10 select-none text-[160px] font-black leading-none text-white/[0.03]">ZC</div>
        <Avatar name={agent.fullName} src={agent.avatarUrl} size="xl" className="relative h-[68px] w-[68px] ring-2 ring-amber-300/60" />
        <div className="relative min-w-0 flex-1">
          <p className="truncate text-[19px] font-extrabold tracking-tight">{agent.fullName}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-md bg-amber-300 px-1.5 py-0.5 text-[11px] font-extrabold text-navy-900">{abbr}</span>
            <span className="text-[13px] text-white/70">{titleFor(agent.role)}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-white/80">
            <Users className="h-3.5 w-3.5 text-white/50" />
            {totalAgents} Agents <span className="text-white/30">•</span> {totalLeaders} Leaders
          </div>
        </div>
        {editMode && (
          <button onClick={(e) => { e.stopPropagation(); onEdit() }} className="relative rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  // ── Agent (compact vertical card) ───────────────────────────────────────
  if (variant === 'agent') {
    return (
      <div
        onClick={onSelect}
        {...dnd}
        className={cn(
          'group relative flex w-[136px] cursor-pointer flex-col items-center rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift',
          ring,
        )}
      >
        <Avatar name={agent.fullName} src={agent.avatarUrl} size="md" className="h-12 w-12" />
        <p className="mt-2 line-clamp-1 text-[12.5px] font-bold text-ink">{agent.fullName}</p>
        <p className="text-[11px] text-slate-400">{titleFor(agent.role)}</p>
        <span className="mt-1 inline-flex items-center gap-1 text-[10.5px] font-semibold text-slate-400">
          <Users className="h-2.5 w-2.5" /> {totalAgents}
        </span>
        {editMode && (
          <button onClick={(e) => { e.stopPropagation(); onEdit() }} className="absolute right-1.5 top-1.5 rounded-md p-1 text-slate-300 opacity-0 transition-all hover:bg-slate-100 hover:text-ink group-hover:opacity-100" aria-label="Edit">
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>
    )
  }

  // ── Leader (medium horizontal card) ─────────────────────────────────────
  const agg = teamAggregate(node)
  return (
    <div
      onClick={onSelect}
      {...dnd}
      className={cn(
        'group relative flex w-[260px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift',
        ring,
      )}
    >
      <Avatar name={agent.fullName} src={agent.avatarUrl} size="lg" className="h-14 w-14" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-ink">{agent.fullName}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-bold', RANK_BADGE[agent.role])}>{abbr}</span>
          <span className="truncate text-[11.5px] text-slate-400">{titleFor(agent.role)}</span>
        </div>
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-slate-500">
          <Users className="h-3 w-3 text-slate-400" /> {agg.totalUnder} Agents
        </span>
      </div>

      <div className="absolute right-2 top-2 flex items-center gap-0.5">
        {editMode && (
          <button onClick={(e) => { e.stopPropagation(); onEdit() }} className="rounded-md p-1 text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-ink group-hover:opacity-100" aria-label="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onToggle() }} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-ink" aria-label={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <MoreVertical className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 -rotate-90" />}
        </button>
      </div>

      {/* Collapsed indicator */}
      {!expanded && node.children.length > 0 && (
        <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
          +{node.children.length}
        </span>
      )}
    </div>
  )
}

function titleFor(role: HierNode['data']['agent']['role']): string {
  switch (role) {
    case 'Master General Agent':
      return 'Managing General Agent'
    case 'Regional General Agent':
      return 'Regional General Agent'
    case 'General Agent':
      return 'General Agent'
    case 'Supervising Agent':
      return 'Supervising Agent'
    default:
      return 'Career Agent'
  }
}
