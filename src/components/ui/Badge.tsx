import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Tone =
  | 'neutral'
  | 'blue'
  | 'red'
  | 'orange'
  | 'green'
  | 'slate'
  | 'purple'
  | 'amber'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  dot?: boolean
}

const TONES: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  blue: 'bg-electric-50 text-electric-600 border-electric-100',
  red: 'bg-red-50 text-red-600 border-red-100',
  orange: 'bg-orange-50 text-orange-600 border-orange-100',
  green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  slate: 'bg-slate-800 text-white border-slate-800',
  purple: 'bg-violet-50 text-violet-600 border-violet-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
}

const DOT_TONES: Record<Tone, string> = {
  neutral: 'bg-slate-400',
  blue: 'bg-electric',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  green: 'bg-emerald-500',
  slate: 'bg-slate-300',
  purple: 'bg-violet-500',
  amber: 'bg-amber-500',
}

export function Badge({ className, tone = 'neutral', dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT_TONES[tone])} />}
      {children}
    </span>
  )
}
