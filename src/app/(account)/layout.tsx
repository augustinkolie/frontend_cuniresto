import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { SiteHeader } from '@/components/layout/site-header'
import { AccountNav } from './account-nav'

const ChatWidget = dynamic(() => import('@/components/assistant/chat-widget').then((m) => m.ChatWidget))

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 pt-24 lg:grid-cols-[240px_1fr] lg:px-8 lg:pt-32">
        <AccountNav />
        <main id="contenu" className="min-w-0">
          {children}
        </main>
      </div>
      <CartDrawer />
      <ChatWidget />
    </>
  )
}
