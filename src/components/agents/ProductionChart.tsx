import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompactCurrency } from '@/lib/utils'

interface ProductionChartProps {
  data: { label: string; value: number }[]
  height?: number
}

export function ProductionChart({ data, height = 200 }: ProductionChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#cbd5e1' }}
            tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
            width={44}
          />
          <Tooltip
            cursor={{ fill: 'rgba(37,99,255,0.06)' }}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow: '0 12px 32px -8px rgba(16,24,40,0.18)',
              fontSize: 12,
              fontWeight: 600,
            }}
            formatter={(v: number) => [formatCompactCurrency(v), 'ALP']}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive>
            {data.map((d, i) => (
              <Cell key={i} fill={d.value >= max ? '#2563ff' : '#c7d2fe'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
