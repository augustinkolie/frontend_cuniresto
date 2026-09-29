import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'

// Chargé après l'affichage : n'alourdit pas le JavaScript initial des pages publiques.
const ChatWidget = dynamic(() => import('@/components/assistant/chat-widget').then((m) => m.ChatWidget))

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="contenu">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <ChatWidget />
    </>
  )
}
