import Link from 'next/link'
import { cn } from '@/lib/cn'

export function Flame({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path d="M32 6c5 10 16 15 16 30a16 16 0 0 1-32 0c0-8 4-13 7-16 0 6 3 10 6 11-2-9 0-17 3-25z" fill="var(--primary)" />
      <path d="M32 34c2.5 3.5 7 6 7 12a7 7 0 0 1-14 0c0-3.5 2-6 3.5-7 0 2.5 1 3.5 2.5 3.5-1-3.5 0-6 1-8.5z" fill="var(--accent)" />
    </svg>
  )
}

export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2', className)} aria-label="Maison Braise, accueil">
      <Flame className="h-8 w-8 transition-transform group-hover:-rotate-6" />
      <span className="font-display text-xl font-semibold leading-none tracking-tight">
        Maison <span className="text-primary">Braise</span>
      </span>
    </Link>
  )
}
