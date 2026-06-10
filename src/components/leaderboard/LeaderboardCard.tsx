import { Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MiniBarChart } from '@/components/dashboard/MiniBarChart'
import { LeaderboardRow } from './LeaderboardRow'

export interface LeaderboardEntry {
  id: string
  rank: number
  name: string
  subtitle: string
  alp: number
  to?: string
}

interface LeaderboardCardProps {
  title: string
  subtitle: string
  entries: LeaderboardEntry[]
  onFullLeaderboard?: () => void
}

export function LeaderboardCard({
  title,
  subtitle,
  entries,
  onFullLeaderboard,
}: LeaderboardCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <div className="px-5 pt-5">
        <h3 className="text-[15px] font-bold tracking-tight text-ink">{title}</h3>
        <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500">{subtitle}</p>
      </div>

      <div className="px-4 pt-3">
        <MiniBarChart data={entries.map((e) => e.alp)} highlightIndex={0} />
      </div>

      <div className="flex-1 space-y-0.5 px-3 py-2">
        {entries.map((entry) => {
          const row = (
            <LeaderboardRow
              rank={entry.rank}
              name={entry.name}
              subtitle={entry.subtitle}
              alp={entry.alp}
            />
          )
          return entry.to ? (
            <Link key={entry.id} to={entry.to} className="block">
              {row}
            </Link>
          ) : (
            <div key={entry.id}>{row}</div>
          )
        })}
      </div>

      <div className="p-4 pt-2">
        <Button variant="black" size="md" className="w-full" onClick={onFullLeaderboard}>
          <Trophy className="h-4 w-4" />
          Full Leaderboard
        </Button>
      </div>
    </Card>
  )
}
