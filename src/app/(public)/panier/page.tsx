import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Checkout } from './checkout'

export const metadata: Metadata = { title: 'Panier et commande', robots: { index: false } }

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-28 lg:px-8 lg:pt-36">
      <h1 className="mb-10 text-[40px] font-semibold lg:text-[56px]">Votre commande</h1>
      <Suspense>
        <Checkout />
      </Suspense>
    </div>
  )
}
