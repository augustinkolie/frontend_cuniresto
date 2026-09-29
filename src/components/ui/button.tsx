import Link from 'next/link'
import { type ComponentProps, forwardRef } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from './spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm' | 'icon'

const variants: Record<Variant, string> = {
  // Texte Charbon sur Braise : contraste ≈ 6:1 (WCAG AA), jamais de blanc.
  primary: 'bg-primary text-on-primary hover:bg-primary-strong',
  secondary: 'border border-text/40 text-text hover:border-text hover:bg-text/5',
  ghost: 'text-text hover:bg-text/8',
  danger: 'bg-danger text-white hover:brightness-110',
}

const sizes: Record<Size, string> = {
  md: 'h-12 px-5 text-base',
  sm: 'h-9 px-3.5 text-sm',
  icon: 'h-11 w-11 p-0',
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition-colors ' +
  'disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap'

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string): string {
  return cn(base, variants[variant], sizes[size], className)
}

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
})

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: Variant
  size?: Size
}

export function LinkButton({ variant = 'primary', size = 'md', className, ...props }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />
}
