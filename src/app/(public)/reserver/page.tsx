import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageLoader } from '@/components/ui/spinner'
import { Booking } from './booking'

export const metadata: Metadata = {
  title: 'Réserver une table',
  description: 'Réservez votre table chez Maison Braise à Conakry : disponibilités en temps réel, confirmation par e-mail.',
}

export default function ReservePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-28 lg:px-8 lg:pt-36">
      <header className="mb-12 max-w-2xl">
        <p className="eyebrow">Réservation</p>
        <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02] lg:text-[64px]">
          Votre table <em className="font-medium text-primary">vous attend.</em>
        </h1>
        <p className="mt-4 text-muted">Au-delà de 20 personnes, contactez-nous directement.</p>
      </header>
      <Suspense fallback={<PageLoader />}>
        <Booking />
      </Suspense>
    </div>
  )
}
