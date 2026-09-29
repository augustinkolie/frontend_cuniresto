import { Star } from 'lucide-react'
import Image from '@/components/ui/photo'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

type Tone = 'neutral' | 'primary' | 'accent' | 'success' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'bg-text/10 text-text',
  primary: 'bg-primary/15 text-primary',
  accent: 'bg-accent/15 text-accent',
  success: 'bg-success/20 text-success',
  danger: 'bg-danger/15 text-danger',
}

export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-[var(--radius-card)] border border-line bg-surface', className)}>{children}</div>
}

export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  const rounded = Math.round(value)
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-accent', className)} aria-label={`${value.toFixed(1)} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} width={size} height={size} fill={i <= rounded ? 'currentColor' : 'none'} strokeWidth={1.5} aria-hidden />
      ))}
    </span>
  )
}

export function Avatar({
  src,
  firstName,
  lastName,
  size = 40,
  className,
}: {
  src?: string | null
  firstName?: string | null
  lastName?: string | null
  size?: number
  className?: string
}) {
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 font-semibold text-muted', className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? (
        <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" unoptimized={src.startsWith('http')} />
      ) : (
        initials(firstName, lastName)
      )}
    </span>
  )
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-12 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <h3 className="text-xl">{title}</h3>
      {children && <div className="max-w-md text-muted">{children}</div>}
      {action}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow?: string
  title: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('max-w-2xl', className)}>
      {eyebrow && <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>}
      <h2 className="text-[28px] font-medium lg:text-[44px]">{title}</h2>
      {children && <p className="mt-3 text-muted">{children}</p>}
    </div>
  )
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 50,
  label,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label: string
}) {
  const btn = 'h-10 w-10 rounded-[10px] text-lg font-semibold hover:bg-text/10 disabled:opacity-40'
  return (
    <div className="inline-flex items-center rounded-[var(--radius-control)] border border-line" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Retirer un">
        −
      </button>
      <span className="tabular w-8 text-center font-semibold" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Ajouter un">
        +
      </button>
    </div>
  )
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T
  onChange: (value: T) => void
  items: Array<{ value: T; label: ReactNode }>
  className?: string
}) {
  return (
    <div role="tablist" className={cn('scrollbar-none flex gap-1 overflow-x-auto border-b border-line', className)}>
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          type="button"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'relative shrink-0 px-4 py-3 text-sm font-semibold text-muted transition-colors hover:text-text',
            value === item.value && 'text-text after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-primary',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
