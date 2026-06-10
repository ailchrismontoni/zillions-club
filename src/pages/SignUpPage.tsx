import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Ticket } from 'lucide-react'
import { useAuthStore } from '@/app/authStore'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { lookupInviteCode } from '@/services/teamRouting'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'

interface Draft {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirm: string
  inviteCode: string
  sponsor: string
}

const EMPTY: Draft = {
  firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '', inviteCode: '', sponsor: '',
}

export function SignUpPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const signup = useAuthStore((s) => s.signup)
  const inviteCodes = useAppStore((s) => s.inviteCodes)
  const { isAuthenticated, isOnboardingComplete } = useAuth()
  const { toast } = useToast()

  const [draft, setDraft] = useState<Draft>({ ...EMPTY, inviteCode: params.get('invite')?.toUpperCase() ?? '' })
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({})

  useEffect(() => {
    if (isAuthenticated) navigate(isOnboardingComplete ? '/dashboard' : '/onboarding', { replace: true })
  }, [isAuthenticated, isOnboardingComplete, navigate])

  const matchedTeam = draft.inviteCode ? lookupInviteCode(draft.inviteCode, inviteCodes) : null

  function set<K extends keyof Draft>(key: K, value: string) {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof Draft, string>> = {}
    if (!draft.firstName.trim()) e.firstName = 'Required'
    if (!draft.lastName.trim()) e.lastName = 'Required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) e.email = 'Enter a valid email'
    if (!draft.phone.trim()) e.phone = 'Required'
    if (!draft.password) e.password = 'Required'
    else if (draft.password.length < 6) e.password = 'At least 6 characters'
    if (draft.confirm !== draft.password) e.confirm = 'Passwords must match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    const res = await signup({
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: draft.email,
      phone: draft.phone,
      password: draft.password,
      inviteCode: draft.inviteCode || undefined,
      sponsor: draft.sponsor || undefined,
    })
    if (!res.ok) {
      setErrors((e) => ({ ...e, email: res.error }))
      toast({ title: 'Could not create account', description: res.error, variant: 'error' })
      return
    }
    toast({ title: 'Account created', description: "Let's finish onboarding.", variant: 'success' })
    navigate('/onboarding', { replace: true })
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the agency and get your own command center."
      footer={<>Already have an account? <Link to="/sign-in" className="font-semibold text-electric hover:underline">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" required error={errors.firstName}>
            <Input value={draft.firstName} onChange={(e) => set('firstName', e.target.value)} autoFocus />
          </Field>
          <Field label="Last name" required error={errors.lastName}>
            <Input value={draft.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </Field>
        </div>
        <Field label="Email" required error={errors.email}>
          <Input type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} placeholder="you@email.com" />
        </Field>
        <Field label="Phone" required error={errors.phone}>
          <Input value={draft.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(440) 555-1234" inputMode="tel" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Password" required error={errors.password}>
            <Input type="password" value={draft.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" />
          </Field>
          <Field label="Confirm" required error={errors.confirm}>
            <Input type="password" value={draft.confirm} onChange={(e) => set('confirm', e.target.value)} placeholder="••••••••" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Invite code (optional)">
            <Input value={draft.inviteCode} onChange={(e) => set('inviteCode', e.target.value.toUpperCase())} placeholder="MONTONI25" />
          </Field>
          <Field label="Sponsor (optional)">
            <Input value={draft.sponsor} onChange={(e) => set('sponsor', e.target.value)} placeholder="Who recruited you?" />
          </Field>
        </div>

        {matchedTeam && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[13px] font-semibold text-emerald-700">
            <Ticket className="h-4 w-4" />
            Valid code — you'll be routed to <span className="font-bold">{matchedTeam.teamName}</span>
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full">
          Create Account <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthLayout>
  )
}
