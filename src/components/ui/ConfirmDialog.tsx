import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <div className="flex gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${danger ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-slate-500">{message}</p>
          <div className="mt-5 flex justify-end gap-2.5">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose() }}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
