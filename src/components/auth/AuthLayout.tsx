import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { LogoMark } from '@/components/layout/Logo'

const POINTS = [
  'Your own agent profile & dashboard',
  'Private ref book with AI outreach',
  'Live team leaderboards',
  'Production tracking that rolls up automatically',
]

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-paper">
      {/* Brand panel */}
      <div className="relative hidden w-[44%] overflow-hidden bg-navy-900 lg:block">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy-700 via-navy-800 to-navy-900" />
        <div className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-electric/25 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 broadcast-streaks opacity-50" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark className="h-10 w-10" />
            <span className="text-[17px] font-extrabold tracking-tight text-white">Zillions Club</span>
          </Link>
          <div>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-white">
              The command center for your virtual sales empire.
            </h2>
            <ul className="mt-8 space-y-3.5">
              {POINTS.map((p) => (
                <li key={p} className="flex items-center gap-3 text-[15px] text-white/75">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-electric-400" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[13px] text-white/40">© 2026 Zillions Club</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <LogoMark className="h-9 w-9" />
            <span className="text-[16px] font-extrabold tracking-tight text-ink">Zillions Club</span>
          </Link>
          <h1 className="text-[26px] font-extrabold tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-[14px] text-slate-500">{subtitle}</p>
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-[14px] text-slate-500">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
