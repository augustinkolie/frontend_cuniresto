'use client'

import { Eye, EyeOff, TriangleAlert } from 'lucide-react'
import { type ComponentProps, forwardRef, useState } from 'react'
import { Input } from '@/components/ui/field'
import { cn } from '@/lib/cn'

/** Champ mot de passe : afficher/masquer et alerte « Verr. Maj » activée. */
export const PasswordInput = forwardRef<HTMLInputElement, ComponentProps<typeof Input>>(function PasswordInput(
  { className, onKeyUp, onKeyDown, onBlur, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const detect = (e: React.KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.('CapsLock') ?? false)

  return (
    <div>
      <div className="relative">
        <Input
          ref={ref}
          {...props}
          type={visible ? 'text' : 'password'}
          className={cn('pr-12', className)}
          onKeyUp={(e) => {
            detect(e)
            onKeyUp?.(e)
          }}
          onKeyDown={(e) => {
            detect(e)
            onKeyDown?.(e)
          }}
          onBlur={(e) => {
            setCapsLock(false)
            onBlur?.(e)
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-2.5 text-muted hover:text-text"
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {capsLock && (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-accent" role="status">
          <TriangleAlert className="h-4 w-4" /> Majuscules verrouillées
        </p>
      )}
    </div>
  )
})

/** Robustesse : longueur, casse mixte, chiffres, symboles. Score de 0 à 4. */
export function passwordScore(value: string): number {
  if (!value) return 0
  let score = 0
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++
  return Math.min(4, score)
}

const LEVELS = [
  { label: 'Trop court', color: 'bg-danger' },
  { label: 'Faible', color: 'bg-danger' },
  { label: 'Moyen', color: 'bg-accent' },
  { label: 'Bon', color: 'bg-success' },
  { label: 'Excellent', color: 'bg-success' },
]

export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null
  const score = value.length < 8 ? 0 : passwordScore(value)
  const level = LEVELS[score]!
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full bg-surface-2 transition-colors', i <= Math.max(1, score) && level.color)} />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">
        Robustesse : <span className="font-semibold text-text">{level.label}</span>
        {score < 3 && value.length >= 8 && ' — ajoutez majuscules, chiffres ou symboles'}
      </p>
    </div>
  )
}
