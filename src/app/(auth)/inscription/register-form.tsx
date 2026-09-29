'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Gift } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { GoogleButton, googleEnabled, OrDivider } from '@/components/auth/google-button'
import { PasswordInput, PasswordStrength } from '@/components/auth/password-input'
import { safeNext, useAuthSuccess, withNext } from '@/components/auth/use-auth-success'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { errorMessage, post } from '@/lib/api'
import { cn } from '@/lib/cn'
import { registerSchema } from '@/lib/schemas'
import type { User } from '@/lib/types'

const schema = registerSchema.extend({
  acceptTerms: z.literal(true, { error: 'Acceptez les conditions pour continuer' }),
})
type Values = z.infer<typeof schema>

// Fautes de frappe fréquentes dans les domaines e-mail.
const DOMAIN_FIXES: Record<string, string> = {
  'gmail.con': 'gmail.com',
  'gmail.fr': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'yahoo.con': 'yahoo.com',
  'yahou.fr': 'yahoo.fr',
  'outlook.con': 'outlook.com',
}

function emailSuggestion(email: string | undefined): string | null {
  const [local, domain] = (email ?? '').toLowerCase().split('@')
  if (!local || !domain) return null
  const fixed = DOMAIN_FIXES[domain]
  return fixed ? `${local}@${fixed}` : null
}

export function RegisterForm() {
  const params = useSearchParams()
  const next = safeNext(params.get('suite'))
  const invite = params.get('parrain') ?? ''
  const onSuccess = useAuthSuccess()
  const [error, setError] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(!!invite)
  const errorRef = useRef<HTMLDivElement>(null)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { referralCode: invite.toUpperCase() },
  })
  const { errors, isSubmitting } = form.formState
  const [email, password] = useWatch({ control: form.control, name: ['email', 'password'] })
  const suggestion = emailSuggestion(email)

  const submit = form.handleSubmit(async ({ acceptTerms: _accepted, ...values }) => {
    setError(null)
    try {
      const { user } = await post<{ user: User }>('/auth/register', {
        ...values,
        referralCode: values.referralCode?.trim() || undefined,
      })
      onSuccess(user, true)
    } catch (e) {
      setError(errorMessage(e))
      requestAnimationFrame(() => errorRef.current?.focus())
    }
  })

  return (
    <div>
      <h1 className="font-display text-4xl font-bold">Inscription</h1>
      <p className="mt-2 text-sm text-muted">
        Déjà inscrit ?{' '}
        <Link href={withNext('/connexion', next)} className="font-semibold text-primary hover:underline">
          Connectez-vous
        </Link>
      </p>

      {invite && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
          <Gift className="h-4 w-4" /> +300 points offerts
        </p>
      )}

      <div className="mt-7 space-y-4">
        {googleEnabled && (
          <>
            <GoogleButton onSuccess={onSuccess} mode="signup" />
            <OrDivider />
          </>
        )}

        {error && (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="rounded-[var(--radius-control)] bg-danger/10 px-3 py-2 text-sm text-danger focus:outline-none"
          >
            <span>
              {error}
              {error.includes('déjà utilisé') && (
                <>
                  {' '}
                  <Link href={withNext('/connexion', next)} className="font-semibold underline">
                    Se connecter
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom" error={errors.firstName?.message}>
              {(p) => <Input {...p} autoComplete="given-name" autoFocus {...form.register('firstName')} />}
            </Field>
            <Field label="Nom" error={errors.lastName?.message}>
              {(p) => <Input {...p} autoComplete="family-name" {...form.register('lastName')} />}
            </Field>
          </div>

          <Field label="E-mail" error={errors.email?.message}>
            {(p) => (
              <div>
                <Input {...p} type="email" inputMode="email" autoComplete="email" {...form.register('email')} />
                {suggestion && (
                  <button
                    type="button"
                    onClick={() => form.setValue('email', suggestion, { shouldValidate: true })}
                    className="mt-1.5 text-sm text-accent hover:underline"
                  >
                    Vouliez-vous dire <strong>{suggestion}</strong> ?
                  </button>
                )}
              </div>
            )}
          </Field>

          <div>
            <label htmlFor="register-password" className="mb-1.5 block text-sm font-semibold">
              Mot de passe
            </label>
            <PasswordInput
              id="register-password"
              autoComplete="new-password"
              aria-invalid={errors.password ? true : undefined}
              placeholder="8 caractères minimum"
              {...form.register('password')}
            />
            {errors.password && (
              <p className="mt-1.5 text-sm text-danger" role="alert">
                {errors.password.message}
              </p>
            )}
            <PasswordStrength value={password ?? ''} />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowCode((s) => !s)}
              aria-expanded={showCode}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-text"
            >
              <Gift className="h-4 w-4 text-primary" /> Code de parrainage
              <ChevronDown className={cn('h-4 w-4 transition-transform', showCode && 'rotate-180')} />
            </button>
            {showCode && (
              <Field label="Code" className="mt-3" error={errors.referralCode?.message}>
                {(p) => <Input {...p} className="font-mono uppercase tracking-widest" autoComplete="off" {...form.register('referralCode')} />}
              </Field>
            )}
          </div>

          <div>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 shrink-0 rounded accent-[var(--primary)]"
                aria-invalid={errors.acceptTerms ? true : undefined}
                {...form.register('acceptTerms')}
              />
              <span className="text-muted">
                J’accepte les{' '}
                <Link href="/conditions" target="_blank" className="font-semibold text-text underline-offset-2 hover:underline">
                  conditions
                </Link>
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="mt-1.5 text-sm text-danger" role="alert">
                {errors.acceptTerms.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Créer mon compte
          </Button>
        </form>
      </div>
    </div>
  )
}
