import { cn, gradientFor, initials } from '@/lib/utils'

interface AvatarProps {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  ring?: boolean
}

const SIZES = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-[13px]',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
}

export function Avatar({ name, src, size = 'md', className, ring }: AvatarProps) {
  const [from, to] = gradientFor(name)
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white',
        ring && 'ring-2 ring-white shadow-sm',
        SIZES[size],
        className,
      )}
      style={
        src
          ? undefined
          : { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }
      }
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="tracking-wide">{initials(name)}</span>
      )}
    </div>
  )
}
