import { Bar, BarChart, Cell, ResponsiveContainer } from 'recharts'

interface MiniBarChartProps {
  data: number[]
  highlightIndex?: number
  color?: string
}

/** Compact, axis-less bar chart used at the top of leaderboard cards. */
export function MiniBarChart({
  data,
  highlightIndex = 0,
  color = '#2563ff',
}: MiniBarChartProps) {
  const chartData = data.map((value, i) => ({ value, i }))

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barCategoryGap="28%">
          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive>
            {chartData.map((entry) => (
              <Cell
                key={entry.i}
                fill={entry.i === highlightIndex ? color : '#e2e8f0'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
