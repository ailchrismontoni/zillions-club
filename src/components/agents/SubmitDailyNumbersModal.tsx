import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { DailyNumbers } from '@/types'
import { cn } from '@/lib/utils'
import { MiniCalendar } from './MiniCalendar'
import { WheelPicker } from './WheelPicker'

interface SubmitDailyNumbersModalProps {
  open: boolean
  onClose: () => void
  onSubmit?: (data: DailyNumbers) => void
}

type StepType = 'date' | 'number' | 'currency'
interface StepDef {
  key: keyof Omit<DailyNumbers, 'date'> | 'date'
  q: string
  type: StepType
}

const STEPS: StepDef[] = [
  { key: 'date', q: 'What date are these numbers for?', type: 'date' },
  { key: 'dials', q: 'How many dials did you make?', type: 'number' },
  { key: 'appointmentsScheduled', q: 'How many appointments did you have scheduled?', type: 'number' },
  { key: 'appointmentsSat', q: 'How many appointments did you sit with?', type: 'number' },
  { key: 'dealsSold', q: 'How many deals did you sell?', type: 'number' },
  { key: 'totalAlp', q: 'What was your total ALP amount?', type: 'currency' },
  { key: 'referralsCollected', q: 'How many referrals did you collect?', type: 'number' },
  { key: 'referralsSat', q: 'How many referrals did you sit with?', type: 'number' },
  { key: 'referralSales', q: 'How many referral sales did you have?', type: 'number' },
  { key: 'referralAlp', q: 'What was your referral ALP amount?', type: 'currency' },
  { key: 'projectedAppointments', q: 'How many projected appointments do you have?', type: 'number' },
]

const NUMBER_DEFAULTS = {
  dials: 0,
  appointmentsScheduled: 0,
  appointmentsSat: 0,
  dealsSold: 0,
  referralsCollected: 0,
  referralsSat: 0,
  referralSales: 0,
  projectedAppointments: 0,
}

function sanitizeCurrency(raw: string): string {
  let v = raw.replace(/[^0-9.]/g, '')
  const parts = v.split('.')
  if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
  // limit to 2 decimals
  const [int, dec] = v.split('.')
  if (dec !== undefined) v = int + '.' + dec.slice(0, 2)
  return v
}

export function SubmitDailyNumbersModal({ open, onClose, onSubmit }: SubmitDailyNumbersModalProps) {
  const [step, setStep] = useState(0)
  const [date, setDate] = useState(() => new Date())
  const [nums, setNums] = useState<Record<string, number>>({ ...NUMBER_DEFAULTS })
  const [alp, setAlp] = useState<Record<string, string>>({ totalAlp: '', referralAlp: '' })

  // Reset whenever the modal opens.
  useEffect(() => {
    if (open) {
      setStep(0)
      setDate(new Date())
      setNums({ ...NUMBER_DEFAULTS })
      setAlp({ totalAlp: '', referralAlp: '' })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0

  const canAdvance =
    current.type === 'date'
      ? Boolean(date)
      : current.type === 'currency'
        ? parseFloat(alp[current.key as string] || '0') > 0
        : true

  function goPrev() {
    if (!isFirst) setStep((s) => s - 1)
  }
  function goNext() {
    if (canAdvance && !isLast) setStep((s) => s + 1)
  }

  function submit() {
    const data: DailyNumbers = {
      date: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12).toISOString(),
      dials: nums.dials,
      appointmentsScheduled: nums.appointmentsScheduled,
      appointmentsSat: nums.appointmentsSat,
      dealsSold: nums.dealsSold,
      totalAlp: parseFloat(alp.totalAlp || '0'),
      referralsCollected: nums.referralsCollected,
      referralsSat: nums.referralsSat,
      referralSales: nums.referralSales,
      referralAlp: parseFloat(alp.referralAlp || '0'),
      projectedAppointments: nums.projectedAppointments,
    }
    onSubmit?.(data)
    onClose()
  }

  function handlePrimary() {
    if (isLast) submit()
    else goNext()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-md animate-fade-in" onClick={onClose} />

      <div className="relative z-10 flex h-[92vh] max-h-[820px] w-full max-w-5xl flex-col rounded-[28px] bg-white shadow-broadcast animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-6 sm:px-10">
          <span className="text-lg font-bold tracking-tight text-ink">Submit Daily Numbers</span>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink" aria-label="Close">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-2">
          <h2 className="mb-10 max-w-2xl text-center text-2xl font-extrabold tracking-tight text-ink sm:text-[34px]">
            {current.q}
          </h2>

          <div className="w-full">
            {current.type === 'date' && <MiniCalendar value={date} onChange={setDate} />}

            {current.type === 'number' && (
              <WheelPicker
                value={nums[current.key as string] ?? 0}
                onChange={(v) => setNums((n) => ({ ...n, [current.key as string]: v }))}
              />
            )}

            {current.type === 'currency' && (
              <CurrencyInput
                value={alp[current.key as string] ?? ''}
                onChange={(v) => setAlp((a) => ({ ...a, [current.key as string]: v }))}
              />
            )}
          </div>

          {/* Edge step arrows */}
          <button
            onClick={goPrev}
            disabled={isFirst}
            aria-label="Previous step"
            className={cn('absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border transition-colors sm:left-2',
              isFirst ? 'border-slate-100 text-slate-200' : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-ink')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goNext}
            disabled={!canAdvance || isLast}
            aria-label="Next step"
            className={cn('absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border transition-colors sm:right-2',
              !canAdvance || isLast ? 'border-slate-100 text-slate-200' : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-ink')}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 py-6 sm:px-10">
          <button
            onClick={goPrev}
            disabled={isFirst}
            className={cn('h-11 rounded-full border px-6 text-[15px] font-semibold transition-all',
              isFirst ? 'border-slate-100 text-slate-300' : 'border-slate-200 text-slate-700 hover:bg-slate-50')}
          >
            Previous
          </button>

          <button
            onClick={handlePrimary}
            disabled={!canAdvance}
            className={cn('h-12 rounded-full px-7 text-[15px] font-bold transition-all active:scale-[0.98]',
              canAdvance ? 'bg-ink text-white shadow-sm hover:bg-ink-soft' : 'cursor-not-allowed bg-slate-200 text-slate-400')}
          >
            {isLast ? 'Submit numbers' : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function CurrencyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-md items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-10">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold text-slate-400 sm:text-5xl">$</span>
        <input
          autoFocus
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(sanitizeCurrency(e.target.value))}
          placeholder="0.00"
          className="w-[260px] bg-transparent text-center text-5xl font-extrabold tabular text-ink outline-none placeholder:text-slate-300 sm:text-6xl"
        />
      </div>
    </div>
  )
}
