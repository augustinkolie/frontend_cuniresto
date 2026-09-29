'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Pages à afficher : 1 … 4 5 6 … 12 */
function pageList(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result: Array<number | 'gap'> = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) result.push('gap')
    result.push(p)
  })
  return result
}

export function Pagination({
  page,
  total,
  onChange,
  className,
}: {
  page: number
  total: number
  onChange: (page: number) => void
  className?: string
}) {
  if (total <= 1) return null
  const base = 'inline-flex h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] px-3 text-sm font-semibold transition-colors'
  return (
    <nav aria-label="Pagination" className={cn('flex flex-wrap items-center justify-center gap-1.5', className)}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={cn(base, 'border border-line hover:border-text/40 disabled:pointer-events-none disabled:opacity-40')}
        aria-label="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">Précédent</span>
      </button>
      {pageList(page, total).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-muted" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Page ${p}`}
            className={cn(base, 'tabular', p === page ? 'bg-primary text-on-primary' : 'border border-line hover:border-text/40')}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= total}
        className={cn(base, 'border border-line hover:border-text/40 disabled:pointer-events-none disabled:opacity-40')}
        aria-label="Page suivante"
      >
        <span className="mr-1 hidden sm:inline">Suivant</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}
