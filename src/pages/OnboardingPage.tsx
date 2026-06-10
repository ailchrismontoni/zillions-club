import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Sparkles } from 'lucide-react'
import type { OnboardingData } from '@/types'
import { useAuthStore } from '@/app/authStore'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { resolveTeam } from '@/services/teamRouting'
import { DEFAULT_INVITE_CODE } from '@/data/seed'
import { LogoMark } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const STEPS = ['Personal Info', 'Team Routing', 'Confirm']

export function OnboardingPage() {
  const navigate = useNavigate()
  const { account, isAuthenticated, isOnboardingComplete } = useAuth()
  const teams = useAppStore((s) => s.teams)
  const inviteCodes = useAppStore((s) => s.inviteCodes)
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding)
  const { toast } = useToast()

  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    phone: '', email: '', location: '', soldBefore: '', previousIndustry: '',
    licenseStatus: '', currentlyOnboarding: '', backgroundNotes: '', discovery: '',
    inviteCode: '', sponsor: '', preferredTeamId: '', referralSource: '',
  })

  // Prefill from account once.
  useEffect(() => {
    if (account) {
      setData((d) => ({
        ...d,
        phone: d.phone || account.phone,
        email: d.email || account.email,
        inviteCode: d.inviteCode || account.inviteCode,
        sponsor: d.sponsor || account.sponsor,
      }))
    }
  }, [account])

  useEffect(() => {
    if (!isAuthenticated) navigate('/sign-in', { replace: true })
    else if (isOnboardingComplete) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, isOnboardingComplete, navigate])

  const previewRouting = useMemo(
    () => resolveTeam({ inviteCode: data.inviteCode, sponsor: data.sponsor, preferredTeamId: data.preferredTeamId }, teams, inviteCodes),
    [data.inviteCode, data.sponsor, data.preferredTeamId, teams, inviteCodes],
  )

  function set<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((d) => ({ ...d, [key]: value }))
  }

  async function finish() {
    const routing = await completeOnboarding(data)
    if (routing?.needsReview) {
      toast({ title: 'New agent needs team assignment review.', description: `Routed to ${routing.teamName} by default.`, variant: 'info' })
    } else {
      toast({ title: `Routed to ${routing?.teamName}`, description: 'Welcome to the team!', variant: 'success' })
    }
    navigate('/dashboard', { replace: true })
  }

  if (!account) return null

  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-5 py-4">
          <LogoMark className="h-9 w-9" />
          <span className="text-[16px] font-extrabold tracking-tight text-ink">Zillions Club</span>
          <span className="ml-auto text-[13px] text-slate-400">Onboarding</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 py-10">
        {/* Stepper */}
        <div className="mb-8 flex items-center">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold transition-colors',
                  i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-ink text-white' : 'bg-slate-200 text-slate-400')}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn('mt-1.5 hidden text-[11px] font-semibold sm:block', i === step ? 'text-ink' : 'text-slate-400')}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={cn('mx-2 h-0.5 flex-1 rounded', i < step ? 'bg-emerald-500' : 'bg-slate-200')} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          {step === 0 && (
            <Step title="Let's get your details" subtitle="Confirm your contact info.">
              <Field label="Full name"><Input value={account.fullName} disabled /></Field>
              <Field label="Phone"><Input value={data.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(440) 555-1234" /></Field>
              <Field label="Email"><Input value={data.email} onChange={(e) => set('email', e.target.value)} /></Field>
              <Field label="Location"><Input value={data.location} onChange={(e) => set('location', e.target.value)} placeholder="City, State" /></Field>
            </Step>
          )}

          {step === 1 && (
            <Step title="Enter your invite code" subtitle="Have a team code? Enter it below — or use the default to join Team Montoni.">
              <Field label="Invite code">
                <Input value={data.inviteCode} onChange={(e) => set('inviteCode', e.target.value.toUpperCase())} placeholder={DEFAULT_INVITE_CODE} />
              </Field>
              <button
                type="button"
                onClick={() => set('inviteCode', DEFAULT_INVITE_CODE)}
                className={cn('flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all',
                  data.inviteCode === DEFAULT_INVITE_CODE ? 'border-electric bg-electric-50 ring-2 ring-electric/20' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50')}
              >
                <span>
                  <span className="block text-[13.5px] font-bold text-ink">Use the default code · {DEFAULT_INVITE_CODE}</span>
                  <span className="block text-[12px] text-slate-500">No code? This joins you to Team Montoni.</span>
                </span>
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2',
                  data.inviteCode === DEFAULT_INVITE_CODE ? 'border-electric bg-electric text-white' : 'border-slate-300')}>
                  {data.inviteCode === DEFAULT_INVITE_CODE && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
              </button>
              <div className={cn('flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold',
                previewRouting.needsReview ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700')}>
                <Sparkles className="h-4 w-4" />
                {previewRouting.needsReview
                  ? `Enter a code or use the default to join ${previewRouting.teamName}.`
                  : `You'll be routed to ${previewRouting.teamName}.`}
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step title="You're all set" subtitle="Review and enter your dashboard.">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
                <ConfirmRow label="Name" value={account.fullName} />
                <ConfirmRow label="Email" value={data.email || account.email} />
                <ConfirmRow label="Assigned team" value={previewRouting.teamName} highlight />
                <ConfirmRow label="Sponsor" value={previewRouting.resolvedSponsor || data.sponsor || '—'} />
                <ConfirmRow label="Starting status" value={previewRouting.needsReview ? 'Needs Review' : 'Onboarding'} />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-electric-50 px-3.5 py-3 text-[13px] font-medium text-electric-700">
                <CheckCircle2 className="h-4 w-4" />
                Your agent profile, ref book, and AI CRM are ready.
              </div>
            </Step>
          )}

          {/* Nav buttons */}
          <div className="mt-7 flex items-center justify-between">
            <Button variant="ghost" size="md" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button variant="primary" size="md" onClick={() => setStep((s) => s + 1)}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={finish}>
                Enter Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-extrabold tracking-tight text-ink">{title}</h2>
      <p className="mt-1 text-[13.5px] text-slate-500">{subtitle}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  )
}

function ConfirmRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200/70 py-2.5 last:border-0">
      <span className="text-[13px] font-medium text-slate-500">{label}</span>
      <span className={cn('text-[13.5px] font-bold', highlight ? 'text-electric' : 'text-ink')}>{value}</span>
    </div>
  )
}
