import type { LucideIcon } from 'lucide-react'
import { Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <div className="space-y-7">
      <PageHeader title={title} description={description} />

      <Card className="card-lift relative overflow-hidden">
        {/* Soft brand wash */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-electric-50/60 via-white to-white" />
        <div className="relative flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="relative mb-6">
            <div className="absolute -inset-3 rounded-3xl bg-electric/10 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-white shadow-lift">
              <Icon className="h-8 w-8" />
            </div>
          </div>
          <Badge tone="blue" className="mb-4">
            <Sparkles className="h-3 w-3" />
            Coming soon
          </Badge>
          <h2 className="text-xl font-extrabold tracking-tight text-ink">
            {title} is on the way
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            We're building this into your command center. {description}
          </p>
        </div>
      </Card>
    </div>
  )
}
