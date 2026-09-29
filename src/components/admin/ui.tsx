import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function AdminHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[32px] font-semibold">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
  icon,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'neutral' | 'primary' | 'success' | 'danger'
  icon?: ReactNode
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-muted">{label}</p>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <p
        className={cn(
          'tabular mt-2 font-display text-3xl',
          tone === 'primary' && 'text-primary',
          tone === 'success' && 'text-success',
          tone === 'danger' && 'text-danger',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  )
}

/** Tableau responsive : défilement horizontal sur mobile. */
export function Table({ head, children, className }: { head: ReactNode[]; children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface', className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  )
}

export function Td({ children, className, colSpan }: { children?: ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn("px-4 py-3 align-middle", className)}>
      {children}
    </td>
  )
}

export function PeriodSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex rounded-[var(--radius-control)] border border-line bg-surface p-1" role="group" aria-label="Période">
      {[7, 30, 90, 365].map((d) => (
        <button
          key={d}
          type="button"
          aria-pressed={value === d}
          onClick={() => onChange(d)}
          className={cn('rounded-[9px] px-3 py-1.5 text-sm font-semibold', value === d ? 'bg-primary text-on-primary' : 'text-muted hover:text-text')}
        >
          {d === 365 ? '1 an' : `${d} j`}
        </button>
      ))}
    </div>
  )
}
