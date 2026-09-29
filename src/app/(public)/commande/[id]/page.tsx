import type { Metadata } from 'next'
import { Suspense } from 'react'
import { OrderTracking } from './order-tracking'

export const metadata: Metadata = { title: 'Suivi de commande', robots: { index: false } }

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-28 lg:px-8 lg:pt-36">
      <Suspense>
        <OrderTracking id={id} />
      </Suspense>
    </div>
  )
}
