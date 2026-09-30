import type { ReactNode } from 'react'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { SiteHeader } from '@/components/layout/site-header'

/**
 * Messagerie en plein écran, comme une application : pas de menu du compte, pas d'assistant
 * flottant, et la page tient exactement dans la hauteur de l'écran (seules les listes défilent).
 */
export default function MessagingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="mx-auto flex h-dvh max-w-7xl flex-col px-4 pb-4 pt-20 lg:px-8 lg:pb-6 lg:pt-24">
        {children}
      </main>
      <CartDrawer />
    </>
  )
}
