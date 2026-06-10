import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/app/authStore'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'

export function SignInPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const { isAuthenticated, isOnboardingComplete } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) navigate(isOnboardingComplete ? '/dashboard' : '/onboarding', { replace: true })
  }, [isAuthenticated, isOnboardingComplete, navigate])

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setError('')
    const res = await login(email, password)
    if (!res.ok) {
      setError(res.error ?? 'Unable to sign in.')
      return
    }
    toast({ title: `Welcome back, ${res.account?.firstName}`, variant: 'success' })
    navigate(res.account?.onboardingComplete ? '/dashboard' : '/onboarding', { replace: true })
  }

  function fillDemo() {
    setEmail('admin@zillionsclub.com')
    setPassword('password123')
    setError('')
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your command center."
      footer={<>New to Zillions Club? <Link to="/sign-up" className="font-semibold text-electric hover:underline">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" error={error}>
          <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} placeholder="you@email.com" autoFocus />
        </Field>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-700">Password</span>
            <button type="button" onClick={() => toast({ title: 'Password reset', description: 'Coming soon.', variant: 'info' })} className="text-[12px] font-medium text-electric hover:underline">
              Forgot password?
            </button>
          </div>
          <Input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} placeholder="••••••••" />
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full">
          Sign In <ArrowRight className="h-4 w-4" />
        </Button>
        <button type="button" onClick={fillDemo} className="w-full rounded-xl border border-dashed border-slate-200 py-2.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50">
          Use demo admin account
        </button>
      </form>
    </AuthLayout>
  )
}
