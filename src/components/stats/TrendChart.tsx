import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function TrendChart({
  data,
  color = '#2563ff',
  format = (v: number) => String(v),
  height = 180,
}: {
  data: { label: string; value: number }[]
  color?: string
  format?: (v: number) => string
  height?: number
}) {
  const id = `grad-${color.replace('#', '')}`
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 6, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10.5, fill: '#94a3b8', fontWeight: 600 }} interval={0} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10.5, fill: '#cbd5e1' }} width={42} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)} />
          <Tooltip
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 12px 32px -8px rgba(16,24,40,0.18)', fontSize: 12, fontWeight: 600 }}
            formatter={(v: number) => [format(v), '']}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${id})`} dot={false} activeDot={{ r: 4 }} isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
