import { ChevronDown } from 'lucide-react'
import { type ComponentProps, forwardRef, type ReactNode, useId } from 'react'
import { cn } from '@/lib/cn'

const control =
  'w-full rounded-[var(--radius-control)] border border-line bg-surface px-4 text-base text-text placeholder:text-muted/70 ' +
  'transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-danger disabled:opacity-60'

interface FieldProps {
  label: string
  error?: string
  hint?: string
  className?: string
  children: (props: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => ReactNode
}

/** Libellé + contrôle + message d'erreur reliés pour les lecteurs d'écran. */
export function Field({ label, error, hint, className, children }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(control, 'h-12', className)} {...props} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={cn(control, 'py-3', className)} {...props} />
})

export const Select = forwardRef<HTMLSelectElement, ComponentProps<'select'>>(function Select(
  { className, children, ...props },
  ref,
) {
  // La flèche native est masquée (appearance-none) : on en dessine une, alignée à droite.
  return (
    <div className={cn('relative h-12 w-full', className)}>
      <select ref={ref} className={cn(control, 'h-full cursor-pointer appearance-none pr-10')} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  )
})

export function Checkbox({ label, className, ...props }: ComponentProps<'input'> & { label: ReactNode }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2.5 text-sm', className)}>
      <input type="checkbox" className="h-5 w-5 rounded accent-[var(--primary)]" {...props} />
      <span>{label}</span>
    </label>
  )
}
