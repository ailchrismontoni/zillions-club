import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Apple-style month calendar. Selected day = black rounded square. */
export function MiniCalendar({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const [view, setView] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1))
  const today = new Date()

  const year = view.getFullYear()
  const month = view.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()

  // Build 42 cells (6 weeks)
  const cells: { day: number; current: boolean; date: Date }[] = []
  for (let i = 0; i < firstDay; i++) {
    const day = daysInPrev - firstDay + 1 + i
    cells.push({ day, current: false, date: new Date(year, month - 1, day) })
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true, date: new Date(year, month, d) })
  let nextDay = 1
  while (cells.length < 42) {
    cells.push({ day: nextDay, current: false, date: new Date(year, month + 1, nextDay) })
    nextDay++
  }

  return (
    <div className="mx-auto w-full max-w-[360px] rounded-3xl bg-white p-5 shadow-lift ring-1 ring-slate-100">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setView(new Date(year, month - 1, 1))} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink" aria-label="Previous month">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-2xl font-extrabold tracking-tight text-ink">{MONTHS[month]} {year}</h3>
        <button onClick={() => setView(new Date(year, month + 1, 1))} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink" aria-label="Next month">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center text-[13px] font-semibold text-slate-400">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          const selected = sameDay(c.date, value)
          const isToday = sameDay(c.date, today)
          return (
            <button
              key={i}
              onClick={() => onChange(c.date)}
              className={cn(
                'flex h-11 items-center justify-center rounded-2xl text-[16px] font-semibold transition-all',
                selected
                  ? 'bg-ink text-white shadow-sm'
                  : c.current
                    ? 'text-ink hover:bg-slate-100'
                    : 'text-slate-300 hover:bg-slate-50',
                isToday && !selected && 'ring-1 ring-electric/40',
              )}
            >
              {c.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
