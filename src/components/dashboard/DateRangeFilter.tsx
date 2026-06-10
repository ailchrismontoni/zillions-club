import { Calendar, Check, ChevronDown } from 'lucide-react'
import type { DateFilter } from '@/types'
import { useAppStore } from '@/app/store'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'

const OPTIONS: DateFilter[] = [
  'This Week',
  'Last Week',
  'This Month',
  'Last Month',
  'Custom Range',
]

export function DateRangeFilter() {
  const filter = useAppStore((s) => s.dateFilter)
  const setFilter = useAppStore((s) => s.setDateFilter)

  return (
    <Dropdown
      trigger={({ open }) => (
        <span className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50">
          <Calendar className="h-4 w-4 text-electric" />
          {filter}
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      )}
    >
      {(close) =>
        OPTIONS.map((option) => (
          <DropdownItem
            key={option}
            active={option === filter}
            onClick={() => {
              setFilter(option)
              close()
            }}
          >
            <span className="flex-1">{option}</span>
            {option === filter && <Check className="h-4 w-4" />}
          </DropdownItem>
        ))
      }
    </Dropdown>
  )
}
