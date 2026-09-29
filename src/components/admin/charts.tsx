'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// Graphiques de l'administration (thème clair).
// Une série = couleur Braise ; plusieurs séries = ordre catégoriel fixe validé (contraste et daltonisme).
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'] as const
const SINGLE = '#C0392B'
const GRID = '#d9c7b0'
const INK = '#6e5a4b'

const compact = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 })
const full = new Intl.NumberFormat('fr-FR')

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string | number
  unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="tabular flex items-center gap-2">
          {payload.length > 1 && <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />}
          <span className="text-text">
            {full.format(p.value)}
            {unit ? ` ${unit}` : ''}
          </span>
        </p>
      ))}
    </div>
  )
}

/** Évolution dans le temps : aire fine, réticule et info-bulle au survol. */
export function TrendChart({
  data,
  x,
  y,
  unit,
  height = 260,
  label,
}: {
  data: Array<Record<string, string | number>>
  x: string
  y: string
  unit?: string
  height?: number
  label: string
}) {
  return (
    <figure aria-label={label} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SINGLE} stopOpacity={0.25} />
              <stop offset="100%" stopColor={SINGLE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey={x} tick={{ fill: INK, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
          <YAxis tick={{ fill: INK, fontSize: 12 }} tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => compact.format(v)} />
          <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: INK, strokeDasharray: '3 3' }} />
          <Area type="monotone" dataKey={y} stroke={SINGLE} strokeWidth={2} fill="url(#trend-fill)" activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
        </AreaChart>
      </ResponsiveContainer>
    </figure>
  )
}

/** Magnitudes comparées : barres fines, extrémités arrondies ancrées sur la ligne de base. */
export function BarsChart({
  data,
  x,
  y,
  unit,
  height = 240,
  label,
  horizontal = false,
}: {
  data: Array<Record<string, string | number>>
  x: string
  y: string
  unit?: string
  height?: number
  label: string
  horizontal?: boolean
}) {
  return (
    <figure aria-label={label} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={horizontal} horizontal={!horizontal} stroke={GRID} />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fill: INK, fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => compact.format(v)} />
              <YAxis type="category" dataKey={x} tick={{ fill: INK, fontSize: 12 }} tickLine={false} axisLine={false} width={130} />
            </>
          ) : (
            <>
              <XAxis dataKey={x} tick={{ fill: INK, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} />
              <YAxis tick={{ fill: INK, fontSize: 12 }} tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => compact.format(v)} />
            </>
          )}
          <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey={y} fill={SINGLE} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}

/** Répartition en parts : barre empilée horizontale unique + légende avec valeurs (pas de camembert). */
export function ShareBar({ items, unit }: { items: Array<{ label: string; value: number }>; unit?: string }) {
  const total = items.reduce((s, i) => s + i.value, 0)
  if (total === 0) return <p className="text-sm text-muted">Aucune donnée sur la période.</p>
  return (
    <div className="space-y-3">
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={items.map((i) => `${i.label} ${Math.round((i.value / total) * 100)} %`).join(', ')}>
        {items.map((item, i) => (
          <div key={item.label} style={{ width: `${(item.value / total) * 100}%`, background: SERIES[i % SERIES.length] }} title={item.label} />
        ))}
      </div>
      <ul className="space-y-1.5 text-sm">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SERIES[i % SERIES.length] }} aria-hidden />
            <span className="flex-1">{item.label}</span>
            <span className="tabular text-muted">
              {full.format(item.value)}
              {unit ? ` ${unit}` : ''} · {Math.round((item.value / total) * 100)} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
