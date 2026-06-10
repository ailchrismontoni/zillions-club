import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { cn } from '@/lib/utils'

export interface CellHandle {
  edit: () => void
}

interface InlineEditableCellProps {
  value: string
  onCommit: (value: string) => void
  onTabNext?: () => void
  placeholder?: string
  className?: string
  align?: 'left' | 'right'
  /** When set, edits via a <select> instead of a text input. */
  options?: readonly string[]
}

/**
 * A table cell that turns into an input on click (or via the imperative
 * `edit()` handle, used for Tab navigation).
 * Enter saves · Tab saves + moves next · Esc cancels.
 */
export const InlineEditableCell = forwardRef<CellHandle, InlineEditableCellProps>(
  function InlineEditableCell(
    { value, onCommit, onTabNext, placeholder = '—', className, align = 'left', options },
    ref,
  ) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(value)
    const inputRef = useRef<HTMLInputElement>(null)
    const selectRef = useRef<HTMLSelectElement>(null)

    useImperativeHandle(ref, () => ({ edit: () => setEditing(true) }))

    useEffect(() => {
      if (!editing) setDraft(value)
    }, [value, editing])

    useLayoutEffect(() => {
      if (editing) {
        const el = options ? selectRef.current : inputRef.current
        el?.focus()
        if (!options) inputRef.current?.select()
      }
    }, [editing, options])

    function commit(next: string) {
      setEditing(false)
      if (next !== value) onCommit(next)
    }

    function cancel() {
      setDraft(value)
      setEditing(false)
    }

    if (editing) {
      if (options) {
        return (
          <select
            ref={selectRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              commit(e.target.value)
            }}
            onBlur={() => commit(draft)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') cancel()
            }}
            className="w-full rounded-md border border-electric bg-white px-1.5 py-1 text-[13px] text-ink outline-none ring-2 ring-electric/20"
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {o || '—'}
              </option>
            ))}
          </select>
        )
      }
      return (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit(draft)
            } else if (e.key === 'Escape') {
              e.preventDefault()
              cancel()
            } else if (e.key === 'Tab') {
              e.preventDefault()
              commit(draft)
              onTabNext?.()
            }
          }}
          className={cn(
            'w-full rounded-md border border-electric bg-white px-1.5 py-1 text-[13px] text-ink outline-none ring-2 ring-electric/20',
            align === 'right' && 'text-right',
          )}
        />
      )
    }

    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          'block w-full truncate rounded-md px-1.5 py-1 text-left text-[13px] transition-colors hover:bg-electric-50/70 hover:ring-1 hover:ring-electric/20',
          value ? 'text-ink' : 'text-slate-300',
          align === 'right' && 'text-right',
          className,
        )}
        title={value || placeholder}
      >
        {value || placeholder}
      </button>
    )
  },
)
