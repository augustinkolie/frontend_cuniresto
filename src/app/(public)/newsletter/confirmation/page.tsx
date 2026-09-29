'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { LinkButton } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'

function Confirm() {
  const token = useSearchParams().get('token')
  const [state, setState] = useState<'pending' | 'ok' | 'error'>('pending')

  useEffect(() => {
    if (!token) return setState('error')
    api('/newsletter/confirm', { method: 'POST', query: { token } })
      .then(() => setState('ok'))
      .catch(() => setState('error'))
  }, [token])

  return (
    <Card className="mx-auto max-w-md space-y-4 p-8 text-center">
      {state === 'pending' && <Spinner className="mx-auto h-8 w-8" label="Confirmation…" />}
      {state === 'ok' && (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="text-3xl font-semibold">Inscription confirmée</h1>
          <p className="text-muted">Merci ! Vous recevrez nos nouveautés et offres réservées aux abonnés.</p>
        </>
      )}
      {state === 'error' && (
        <>
          <XCircle className="mx-auto h-12 w-12 text-danger" />
          <h1 className="text-3xl font-semibold">Lien invalide</h1>
          <p className="text-muted">Ce lien a expiré ou a déjà été utilisé. Réinscrivez-vous depuis le bas de page.</p>
        </>
      )}
      {state !== 'pending' && <LinkButton href="/">Retour à l’accueil</LinkButton>}
    </Card>
  )
}

export default function NewsletterConfirmPage() {
  return (
    <div className="px-4 pb-8 pt-32">
      <Suspense>
        <Confirm />
      </Suspense>
    </div>
  )
}
