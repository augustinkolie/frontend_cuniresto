'use client'

import Link from 'next/link'
import { Flame } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'

/** Erreur de rendu (le plus souvent : API momentanément injoignable). */
export default function PublicError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="contenu" className="flex min-h-[70dvh] flex-col items-center justify-center gap-5 px-4 pt-24 text-center">
      <Flame className="h-12 w-12" />
      <h1 className="font-display text-4xl font-bold">Le service fait une pause</h1>
      <p className="max-w-sm text-muted">Nous n’arrivons pas à charger cette page pour le moment. Réessayez dans un instant.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Réessayer</Button>
        <Link href="/carte" className="inline-flex h-12 items-center px-4 font-display text-lg italic hover:text-primary">
          Retour à la carte
        </Link>
      </div>
    </main>
  )
}
