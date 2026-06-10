import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface WheelPickerProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}

const ROW_OFFSETS = [-2, -1, 0, 1, 2, 3]
const ROW_HEIGHT = 72

/** iOS-style number wheel. Selected value sits in a centered box; neighbors fade. */
export function WheelPicker({ value, onChange, min = 0, max = 999 }: WheelPickerProps) {
  const lastWheel = useRef(0)
  const clamp = (v: number) => Math.max(min, Math.min(max, v))

  function handleWheel(e: React.WheelEvent) {
    const now = Date.now()
    if (now - lastWheel.current < 60) return // throttle
    lastWheel.current = now
    onChange(clamp(value + (e.deltaY > 0 ? 1 : -1)))
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowUp') { e.preventDefault(); onChange(clamp(value - 1)) }
    if (e.key === 'ArrowDown') { e.preventDefault(); onChange(clamp(value + 1)) }
  }

  return (
    <div
      tabIndex={0}
      onWheel={handleWheel}
      onKeyDown={handleKey}
      className="relative mx-auto h-[300px] w-full max-w-sm cursor-ns-resize select-none overflow-hidden outline-none"
      role="spinbutton"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
    >
      {/* Center highlight box */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[68px] w-full max-w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white" />

      {/* Fade masks */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />

      {ROW_OFFSETS.map((off) => {
        const v = value + off
        if (v < min || v > max) return null
        const dist = Math.abs(off)
        const isCenter = off === 0
        return (
          <button
            key={off}
            onClick={() => onChange(clamp(v))}
            className={cn(
              'absolute left-0 right-0 flex items-center justify-center font-bold tabular transition-all duration-150',
              isCenter ? 'text-ink' : 'text-slate-400 hover:text-slate-600',
            )}
            style={{
              top: `calc(50% + ${off * ROW_HEIGHT}px)`,
              transform: 'translateY(-50%)',
              fontSize: `${Math.max(1.4, 3.4 - dist * 0.55)}rem`,
              opacity: isCenter ? 1 : Math.max(0.2, 0.65 - dist * 0.16),
            }}
          >
            {v}
          </button>
        )
      })}
    </div>
  )
}
