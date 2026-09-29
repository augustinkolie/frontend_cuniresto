'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { errorMessage, post } from '@/lib/api'

type Step = 'email' | 'code' | 'password'

/** Réinitialisation en 3 étapes : e-mail → code à 6 chiffres (15 min, 5 essais) → nouveau mot de passe. */
export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async (action: () => Promise<void>) => {
    setLoading(true)
    try {
      await action()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Link href="/connexion" className="mb-6 flex items-center justify-center gap-2 text-sm font-semibold text-muted hover:text-text">
        <ArrowLeft className="h-4 w-4" /> Retour à la connexion
      </Link>
      <h1 className="text-center font-display text-4xl font-bold">Mot de passe oublié</h1>
      <ol className="mt-4 flex gap-2" aria-label="Étapes">
        {(['email', 'code', 'password'] as Step[]).map((s, i) => (
          <li
            key={s}
            className={`h-1.5 flex-1 rounded-full ${['email', 'code', 'password'].indexOf(step) >= i ? 'bg-primary' : 'bg-surface-2'}`}
            aria-current={step === s ? 'step' : undefined}
          />
        ))}
      </ol>

      {step === 'email' && (
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void run(async () => {
              await post('/auth/forgot-password', { email })
              toast.success('Si un compte existe, un code vient d’être envoyé.')
              setStep('code')
            })
          }}
        >
          <p className="text-muted">Saisissez votre e-mail : nous vous envoyons un code de vérification.</p>
          <Field label="E-mail">
            {(p) => <Input {...p} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Button type="submit" className="w-full" loading={loading}>
            Recevoir un code
          </Button>
        </form>
      )}

      {step === 'code' && (
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void run(async () => {
              await post('/auth/verify-code', { email, code })
              setStep('password')
            })
          }}
        >
          <p className="text-muted">
            Entrez le code à 6 chiffres reçu à <strong className="text-text">{email}</strong>. Il expire dans 15 minutes.
          </p>
          <Field label="Code de vérification">
            {(p) => (
              <Input
                {...p}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="tabular text-center text-2xl tracking-[0.5em]"
              />
            )}
          </Field>
          <Button type="submit" className="w-full" loading={loading} disabled={code.length !== 6}>
            Vérifier
          </Button>
          <button type="button" onClick={() => setStep('email')} className="w-full text-sm font-semibold text-accent hover:underline">
            Renvoyer un code
          </button>
        </form>
      )}

      {step === 'password' && (
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (password !== confirm) return toast.error('Les mots de passe ne correspondent pas')
            void run(async () => {
              await post('/auth/reset-password', { email, code, password })
              toast.success('Mot de passe modifié. Vous pouvez vous connecter.')
              router.push('/connexion')
            })
          }}
        >
          <Field label="Nouveau mot de passe" hint="8 caractères minimum">
            {(p) => <Input {...p} type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>
          <Field label="Confirmer le mot de passe">
            {(p) => <Input {...p} type="password" minLength={8} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
          </Field>
          <Button type="submit" className="w-full" loading={loading}>
            Enregistrer
          </Button>
        </form>
      )}
    </div>
  )
}
