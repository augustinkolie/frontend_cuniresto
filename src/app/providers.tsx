'use client'

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { useSession } from '@/hooks/use-session'
import { useSocketEvent } from '@/hooks/use-socket-event'
import { ApiError, get, put } from '@/lib/api'
import { reconnectSocket } from '@/lib/socket'
import type { Notification } from '@/lib/types'
import { type CartLine, useCart } from '@/stores/cart'

// Appels audio/vidéo : chargés seulement pour les utilisateurs connectés.
const CallManager = dynamic(() => import('@/components/calls/call-manager').then((m) => m.CallManager), { ssr: false })

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
          },
        },
      }),
  )
  return (
    <QueryClientProvider client={client}>
      <SessionEffects />
      {children}
      <Toaster position="top-center" richColors closeButton toastOptions={{ className: 'font-sans' }} />
    </QueryClientProvider>
  )
}

interface ServerCart {
  items: Array<{ dishId: string; quantity: number; dish: Omit<CartLine, 'quantity' | 'dishId'> & { id: string } }>
}

/**
 * Effets liés à la session : reconnexion temps réel, fusion du panier local avec
 * le panier serveur à la connexion, puis synchronisation à chaque modification.
 */
function SessionEffects() {
  const { user } = useSession()
  const client = useQueryClient()
  const lines = useCart((s) => s.lines)
  const synced = useRef<string | null>(null)

  useEffect(() => {
    reconnectSocket()
  }, [user?.id])

  // Connexion : fusion panier local + panier serveur.
  useEffect(() => {
    if (!user || synced.current === user.id) return
    synced.current = user.id
    const userId = user.id
    void get<ServerCart>('/cart')
      .then(async (server) => {
        // Le panier local (le plus récent) l'emporte ; on y ajoute ce qui n'existe que côté serveur.
        const merged = new Map(useCart.getState().lines.map((l) => [l.dishId, l]))
        for (const item of server.items) {
          if (!merged.has(item.dishId)) {
            merged.set(item.dishId, {
              dishId: item.dishId,
              slug: item.dish.slug,
              name: item.dish.name,
              price: item.dish.price,
              imageUrl: item.dish.imageUrl,
              imageAlt: item.dish.imageAlt,
              quantity: item.quantity,
            })
          }
        }
        const lines = [...merged.values()]
        useCart.getState().replace(lines)
        await put('/cart', { items: lines.map((l) => ({ dishId: l.dishId, quantity: l.quantity })) })
      })
      .catch(() => {
        if (synced.current === userId) synced.current = null
      })
  }, [user])

  // Modification du panier : envoi au serveur (léger délai pour regrouper les clics).
  useEffect(() => {
    if (!user || synced.current !== user.id) return
    const timer = setTimeout(() => {
      void put('/cart', { items: lines.map((l) => ({ dishId: l.dishId, quantity: l.quantity })) }).catch(() => undefined)
    }, 600)
    return () => clearTimeout(timer)
  }, [lines, user])

  useSocketEvent<Notification>(
    'notification:new',
    (n) => {
      void client.invalidateQueries({ queryKey: ['notifications'] })
      toast(n.sender ? `${n.sender.firstName} ${n.content}` : n.content, {
        action: { label: 'Voir', onClick: () => (window.location.href = n.link) },
      })
    },
    !!user,
  )
  useSocketEvent('order:updated', () => void client.invalidateQueries({ queryKey: ['orders'] }), !!user)
  useSocketEvent('loyalty:updated', () => void client.invalidateQueries({ queryKey: ['loyalty'] }), !!user)

  return user ? <CallManager /> : null
}

/** Enveloppe réutilisable pour les pages nécessitant une session. */
export function Hydrated({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return ready ? <>{children}</> : null
}
