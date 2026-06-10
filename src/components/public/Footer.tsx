import { Link } from 'react-router-dom'
import { LogoMark } from '@/components/layout/Logo'

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy-900 px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-8" />
          <span className="text-[15px] font-extrabold tracking-tight text-white">Zillions Club</span>
        </div>
        <p className="text-[13px] text-white/40">© 2026 Zillions Club. The virtual sales command center.</p>
        <div className="flex items-center gap-5 text-[13px] font-medium text-white/50">
          <Link to="/sign-in" className="hover:text-white">Sign In</Link>
          <Link to="/sign-up" className="hover:text-white">Create Account</Link>
        </div>
      </div>
    </footer>
  )
}
