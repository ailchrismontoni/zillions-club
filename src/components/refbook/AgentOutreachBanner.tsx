import { useState } from 'react'
import { Check, MessageSquareText, Zap } from 'lucide-react'
import { useAppStore } from '@/app/store'
import { useToast } from '@/hooks/useToast'
import { connectOrganizationToAgentOutreach } from '@/services/agentOutreach'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const CHECKLIST = ['SMS-first outreach', 'On-brand replies', 'Books appointments']

export function AgentOutreachBanner() {
  const connected = useAppStore((s) => s.organizationConnected)
  const { toast } = useToast()
  const [connecting, setConnecting] = useState(false)

  async function handleConnect() {
    setConnecting(true)
    const res = await connectOrganizationToAgentOutreach()
    setConnecting(false)
    if (res.connected) {
      toast({ title: 'AgentOutreach connected', variant: 'success' })
    } else {
      toast({ title: 'Connection failed', description: 'Please try again.', variant: 'error' })
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-navy-700 bg-navy-900 text-white shadow-broadcast">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy-700 via-navy-800 to-navy-900" />
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-electric/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 broadcast-streaks opacity-60" />

      <div className="relative grid gap-6 p-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:p-7">
        {/* Left */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-navy-900 shadow-lg">
              <span className="text-lg font-black tracking-tight">AO</span>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ring-1',
                connected
                  ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30'
                  : 'bg-white/10 text-white/70 ring-white/15',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  connected ? 'bg-emerald-400' : 'bg-white/50',
                )}
              />
              {connected ? 'Connected' : 'Not connected'}
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight">AgentOutreach AI</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">
            Hand referrals off to SMS-first outreach. Stays on-brand, books
            appointments, never picks up the phone.
          </p>
        </div>

        {/* Right — connect panel */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
          <h3 className="flex items-center gap-2 text-[15px] font-bold">
            <Zap className="h-4 w-4 text-electric-400" />
            Connect AgentOutreach
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">
            Authorize this organization so we can hand new referrals off to
            AgentOutreach automatically.
          </p>
          <ul className="mt-4 space-y-2">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-[13px] text-white/80">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-electric/20 text-electric-400">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <Button
            variant="primary"
            size="lg"
            className="mt-5 w-full"
            loading={connecting}
            disabled={connected}
            onClick={handleConnect}
          >
            {connected ? (
              <>
                <Check className="h-4 w-4" strokeWidth={3} />
                Connected
              </>
            ) : (
              <>
                <MessageSquareText className="h-4 w-4" />
                Connect AgentOutreach
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
