'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { GoogleButton, googleEnabled, OrDivider } from '@/components/auth/google-button'
import { PasswordInput } from '@/components/auth/password-input'
import { safeNext, useAuthSuccess, withNext } from '@/components/auth/use-auth-success'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { errorMessage, post } from '@/lib/api'
import { loginSchema } from '@/lib/schemas'
import type { User } from '@/lib/types'

const REMEMBER_KEY = 'mb-last-email'

export function LoginForm() {
  const params = useSearchParams()
  const router = useRouter()
  const next = safeNext(params.get('suite'))
  const onSuccess = useAuthSuccess()
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

  // Ancien lien « ?mode=inscription » : redirection vers la page d'inscription.
  useEffect(() => {
    if (params.get('mode') === 'inscription') {
      const code = params.get('parrain')
      router.replace(`/inscription?${new URLSearchParams({ ...(next ? { suite: next } : {}), ...(code ? { parrain: code } : {}) })}`)
    }
  }, [params, next, router])

  const form = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema), mode: 'onTouched' })
  const { errors, isSubmitting } = form.formState

  // L'e-mail de la dernière connexion est prérempli : le curseur va directement au mot de passe.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY)
      if (saved) {
        form.setValue('email', saved)
        form.setFocus('password')
        return
      }
    } catch {
      // Stockage indisponible : sans conséquence.
    }
    form.setFocus('email')
  }, [form])

  const submit = form.handleSubmit(async (values) => {
    setError(null)
    try {
      const { user } = await post<{ user: User }>('/auth/login', values)
      try {
        localStorage.setItem(REMEMBER_KEY, values.email)
      } catch {
        // Stockage indisponible : sans conséquence.
      }
      onSuccess(user)
    } catch (e) {
      setError(errorMessage(e))
      form.setValue('password', '')
      requestAnimationFrame(() => errorRef.current?.focus())
    }
  })

  return (
    <div>
      <h1 className="font-display text-4xl font-bold">Connexion</h1>
      <p className="mt-2 text-sm text-muted">
        Pas de compte ?{' '}
        <Link href={withNext('/inscription', next)} className="font-semibold text-primary hover:underline">
          Inscrivez-vous
        </Link>
      </p>

      <div className="mt-8 space-y-4">
        {googleEnabled && (
          <>
            <GoogleButton onSuccess={onSuccess} />
            <OrDivider />
          </>
        )}

        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && (
            <p ref={errorRef} tabIndex={-1} role="alert" className="rounded-[var(--radius-control)] bg-danger/10 px-3 py-2 text-sm text-danger focus:outline-none">
              {error}
            </p>
          )}
          <Field label="E-mail" error={errors.email?.message}>
            {(p) => <Input {...p} type="email" inputMode="email" autoComplete="username" {...form.register('email')} />}
          </Field>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="login-password" className="text-sm font-semibold">
                Mot de passe
              </label>
              <Link href="/mot-de-passe-oublie" className="text-sm text-primary hover:underline">
                Oublié ?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              {...form.register('password')}
            />
            {errors.password && (
              <p className="mt-1.5 text-sm text-danger" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  )
}
