import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  BookUser,
  Bot,
  GraduationCap,
  LayoutDashboard,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PublicNav } from '@/components/public/PublicNav'
import { Footer } from '@/components/public/Footer'
import { DashboardPreview } from '@/components/public/DashboardPreview'

const STATS = [
  { value: '100+', label: 'Agents tracked' },
  { value: '$5M+', label: 'Annualized production' },
  { value: 'AI', label: 'Referral outreach' },
  { value: 'Weekly', label: 'Leaderboards' },
  { value: 'Team', label: 'Accountability' },
]

const STEPS = [
  { icon: UserPlus, title: 'Create your agent profile', desc: 'Sign up in seconds and get your own profile, ref book, and AI CRM access.' },
  { icon: RouteIcon, title: 'Get routed to your team', desc: 'Invite codes and sponsor matching place you on the right team from day one.' },
  { icon: BarChart3, title: 'Track numbers, referrals & AI', desc: 'Log production, manage referrals, and hand them off to AI outreach automatically.' },
]

const FEATURES = [
  { icon: LayoutDashboard, title: 'Personal agent dashboard', desc: 'Your ALP, families protected, and pacing — all in one command center.' },
  { icon: BookUser, title: 'Private ref book', desc: 'A referral CRM that belongs to you, editable inline and SMS-ready.' },
  { icon: Trophy, title: 'Team leaderboards', desc: 'ESPN-style standings that update live as your team produces.' },
  { icon: Bot, title: 'AI CRM integration', desc: 'Hand referrals to AgentOutreach — it books appointments, you close.' },
  { icon: BarChart3, title: 'Production tracking', desc: 'Daily numbers roll up into weekly and monthly stats automatically.' },
  { icon: GraduationCap, title: 'Onboarding system', desc: 'A guided flow that routes new agents and gets them producing fast.' },
  { icon: ShieldCheck, title: 'Manager visibility', desc: 'Leaders see production, referrals, and follow-ups across their team.' },
  { icon: RouteIcon, title: 'Team routing', desc: 'Every account lands on the right team via invite codes and sponsors.' },
]

export function HomePage() {
  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-800 via-navy-900 to-navy-900" />
        <div className="pointer-events-none absolute -left-40 top-0 h-[480px] w-[480px] rounded-full bg-electric/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-[400px] w-[400px] rounded-full bg-electric/10 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 broadcast-streaks opacity-40" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-electric-400 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              The virtual sales operating system
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-[56px]">
              Build Your Virtual Sales Empire With{' '}
              <span className="bg-gradient-to-r from-electric-400 to-electric bg-clip-text text-transparent">Zillions Club</span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/60">
              Track your production, manage referrals, plug into AI outreach, and grow inside a
              high-performance virtual sales organization.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/sign-up">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Create Account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/sign-in">
                <Button variant="secondary" size="lg" className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/25 sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-[13px] text-white/35">Demo admin · admin@zillionsclub.com · password123</p>
          </div>

          <div className="lg:pl-6">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 px-5 sm:px-8 md:grid-cols-5">
          {STATS.map((s) => (
            <div key={s.label} className="px-3 py-7 text-center">
              <p className="text-2xl font-black tracking-tight text-white sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-[12px] font-medium uppercase tracking-wider text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <SectionHeading eyebrow="How it works" title="From sign-up to producing in minutes" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-all hover:border-electric/40 hover:bg-white/[0.05]">
              <span className="absolute right-6 top-6 text-5xl font-black text-white/5">{i + 1}</span>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric/15 text-electric-400 ring-1 ring-electric/20">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/55">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <SectionHeading eyebrow="Features" title="Everything a sales organization needs" subtitle="One command center for agents, leaders, and the whole agency." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-navy-800/60 p-6 transition-all hover:-translate-y-1 hover:border-electric/40">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-electric-400 ring-1 ring-white/10">
                  <f.icon className="h-[22px] w-[22px]" />
                </div>
                <h3 className="mt-4 text-[15px] font-bold text-white">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team system */}
      <section id="teams" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-navy-700 via-navy-800 to-navy-900 p-10 sm:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-electric/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 broadcast-streaks opacity-50" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-electric/15 px-3 py-1 text-[12px] font-bold uppercase tracking-wider text-electric-400">
              <Users className="h-3.5 w-3.5" /> Team-based by design
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              Every account is routed to a team
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-white/60">
              So leaders can track production, referrals, and onboarding from day one. Invite codes and
              sponsor matching place every new agent on the right team automatically — no spreadsheets,
              no guesswork.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {['Team Montoni', 'Team Hogan', 'Team Mickovic', 'Team Nixon', 'Team Dean', 'Team Pronschinske'].map((t) => (
                <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[13px] font-semibold text-white/80">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-28 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight sm:text-[40px]">Ready to join the command center?</h2>
          <p className="mt-4 text-[16px] text-white/55">Create your account and get routed to your team in minutes.</p>
          <div className="mt-8 flex justify-center">
            <Link to="/sign-up">
              <Button variant="primary" size="lg" className="px-8 text-base">
                Create Your Account <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-electric-400">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-[16px] text-white/55">{subtitle}</p>}
    </div>
  )
}
