import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const clamp = (v: number) => Math.max(0, Math.min(1, v))

export function Ring({
  size = 150,
  stroke = 14,
  progress,
  color = '#2563ff',
  track = '#eef1f6',
  children,
}: {
  size?: number
  stroke?: number
  progress?: number | null
  color?: string
  track?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = clamp(progress ?? 0)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {progress != null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={c * (1 - p)}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

export function CircularProgressStat({
  value,
  label,
  progress,
  sublabel,
  color,
  size = 150,
}: {
  value: string | number
  label: string
  progress?: number | null
  sublabel?: string
  color?: string
  size?: number
}) {
  return (
    <div className="flex flex-col items-center">
      <Ring size={size} progress={progress} color={color}>
        <span className="text-[19px] font-extrabold tracking-tight text-ink">{value}</span>
        {sublabel && <span className="mt-0.5 text-[10.5px] font-bold text-slate-400">{sublabel}</span>}
      </Ring>
      <p className="mt-2.5 text-[12.5px] font-bold text-slate-500">{label}</p>
    </div>
  )
}

export interface RingDef {
  label: string
  value: string
  progress: number
  color: string
}

export function MultiRingChart({
  rings,
  centerTitle,
  centerValue,
  size = 280,
}: {
  rings: RingDef[]
  centerTitle: string
  centerValue: string
  size?: number
}) {
  const stroke = 18
  const gap = 8
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {rings.map((ring, i) => {
          const r = size / 2 - stroke / 2 - i * (stroke + gap)
          const c = 2 * Math.PI * r
          const p = clamp(ring.progress)
          return (
            <g key={i}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef1f6" strokeWidth={stroke} />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={ring.color}
                strokeWidth={stroke}
                strokeDasharray={c}
                strokeDashoffset={c * (1 - p)}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </g>
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{centerTitle}</span>
        <span className="text-[24px] font-black tracking-tight text-ink">{centerValue}</span>
      </div>
    </div>
  )
}

/** Legend row used beside the multi-ring chart. */
export function RingLegend({ rings }: { rings: RingDef[] }) {
  return (
    <div className="space-y-2.5">
      {rings.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-slate-500">{r.label}</p>
          </div>
          <span className="text-[14px] font-extrabold tabular text-ink">{r.value}</span>
          <span className={cn('w-10 text-right text-[12px] font-bold tabular', 'text-slate-400')}>{Math.round(clamp(r.progress) * 100)}%</span>
        </div>
      ))}
    </div>
  )
}
