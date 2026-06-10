import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl bg-ink text-white shadow-sm',
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="h-[58%] w-[58%]" fill="none">
        <path d="M9 9h14l-9 9h9v5H9l9-9H9z" fill="#2563ff" />
      </svg>
    </div>
  )
}
