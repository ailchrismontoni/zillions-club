import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { LogoMark } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Teams', href: '#teams' },
  { label: 'How It Works', href: '#how' },
]

export function PublicNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'border-b border-white/10 bg-navy-900/80 backdrop-blur-xl' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark className="h-9 w-9" />
          <span className="text-[16px] font-extrabold tracking-tight text-white">Zillions Club</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[14px] font-medium text-white/60 transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link to="/sign-in">
            <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10 hover:text-white">
              Sign In
            </Button>
          </Link>
          <Link to="/sign-up">
            <Button variant="primary" size="sm">Create Account</Button>
          </Link>
        </div>

        <button onClick={() => setOpen((v) => !v)} className="rounded-lg p-2 text-white md:hidden" aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-navy-900/95 px-5 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-[15px] font-medium text-white/70 hover:bg-white/10 hover:text-white">
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link to="/sign-in"><Button variant="secondary" size="md" className="w-full">Sign In</Button></Link>
              <Link to="/sign-up"><Button variant="primary" size="md" className="w-full">Create Account</Button></Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
