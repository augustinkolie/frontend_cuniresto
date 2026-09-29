import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageLoader } from '@/components/ui/spinner'
import { pageContent } from '@/lib/server-api'
import { Booking } from './booking'

export const metadata: Metadata = {
  title: 'Réserver une table',
  description: 'Réservez votre table chez Maison Braise à Conakry : disponibilités en temps réel, confirmation par e-mail.',
}

export default async function ReservePage() {
  const { header } = await pageContent('reservation')
  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-28 lg:px-8 lg:pt-36">
      {header.visible && (
        <header className="mb-12 max-w-2xl">
          {header.eyebrow && <p className="eyebrow">{header.eyebrow}</p>}
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02] lg:text-[64px]">
            {header.title} {header.titleHighlight && <em className="font-medium text-primary">{header.titleHighlight}</em>}
          </h1>
          {header.text && <p className="mt-4 text-muted">{header.text}</p>}
        </header>
      )}
      <Suspense fallback={<PageLoader />}>
        <Booking />
      </Suspense>
    </div>
  )
}
