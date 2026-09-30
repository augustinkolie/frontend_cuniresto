'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bike, LocateFixed, MapPin, Navigation, Phone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Logo } from '@/components/brand/logo'
import { UserMenu } from '@/components/layout/user-menu'
import { Button } from '@/components/ui/button'
import { Badge, EmptyState } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useSession } from '@/hooks/use-session'
import { useSocketEvent } from '@/hooks/use-socket-event'
import { errorMessage, get, patch, post } from '@/lib/api'
import { gnf } from '@/lib/format'
import { DELIVERY_STATUS, ORDER_STATUS } from '@/lib/labels'
import type { Delivery, DeliveryStatus, OrderStatus } from '@/lib/types'

type DriverDelivery = Delivery & {
  order: { id: string; number: number; status: OrderStatus; total: number; contactName: string | null; contactPhone: string | null; instructions: string | null; items: Array<{ nameSnapshot: string; quantity: number }> }
}

const NEXT: Partial<Record<DeliveryStatus, { to: DeliveryStatus; label: string }>> = {
  ASSIGNED: { to: 'PICKED_UP', label: 'J’ai récupéré la commande' },
  PICKED_UP: { to: 'IN_TRANSIT', label: 'Je pars' },
  IN_TRANSIT: { to: 'ARRIVED', label: 'Je suis arrivé' },
  ARRIVED: { to: 'DELIVERED', label: 'Livrée' },
}

/** Application du livreur (rôle DRIVER) : courses assignées, étapes, partage de position. */
export default function DriverPage() {
  const { user, isLoading, hasRole } = useSession()
  const router = useRouter()
  const client = useQueryClient()
  const [sharing, setSharing] = useState(false)
  const watch = useRef<number | null>(null)
  const lastSent = useRef(0)

  useEffect(() => {
    if (!isLoading && (!user || !hasRole('DRIVER', 'MANAGER'))) router.replace('/')
  }, [isLoading, user, hasRole, router])

  const { data, isLoading: loading } = useQuery({
    queryKey: ['driver', 'deliveries'],
    queryFn: () => get<DriverDelivery[]>('/driver/deliveries'),
    enabled: !!user,
    refetchInterval: 30_000,
  })
  useSocketEvent('delivery:assigned', () => {
    toast('Nouvelle course assignée')
    void client.invalidateQueries({ queryKey: ['driver'] })
  })

  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DeliveryStatus }) => patch(`/driver/deliveries/${id}/status`, { status }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['driver'] }),
    onError: (e) => toast.error(errorMessage(e)),
  })

  const active = data?.filter((d) => ['PICKED_UP', 'IN_TRANSIT', 'ARRIVED'].includes(d.status)) ?? []

  // Partage de position pendant les courses en route (au plus toutes les 20 s).
  const toggleSharing = () => {
    if (sharing) {
      if (watch.current !== null) navigator.geolocation.clearWatch(watch.current)
      watch.current = null
      setSharing(false)
      return
    }
    if (!navigator.geolocation) return toast.error('Géolocalisation indisponible')
    watch.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (Date.now() - lastSent.current < 20_000) return
        lastSent.current = Date.now()
        for (const d of active) {
          void post(`/driver/deliveries/${d.id}/location`, { lat: pos.coords.latitude, lng: pos.coords.longitude }).catch(() => undefined)
        }
      },
      () => toast.error('Autorisez la localisation pour la partager'),
      { enableHighAccuracy: true },
    )
    setSharing(true)
  }
  useEffect(() => () => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current)
  }, [])

  if (isLoading || !user) return <PageLoader />
  // Un admin ou un manager voit toutes les courses en cours, avec le nom du livreur.
  const isDriver = user.role === 'DRIVER'

  return (
    <div data-theme="light" className="min-h-dvh bg-bg text-text">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface px-4">
        <Logo href="/livreur" />
        <UserMenu user={user} />
      </header>
      <main id="contenu" className="mx-auto max-w-xl space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">{isDriver ? 'Mes courses' : 'Courses en cours'}</h1>
          <Button size="sm" variant={sharing ? 'primary' : 'secondary'} onClick={toggleSharing} disabled={active.length === 0 && !sharing}>
            <LocateFixed className="h-4 w-4" /> {sharing ? 'Position partagée' : 'Partager ma position'}
          </Button>
        </div>
        {loading ? (
          <PageLoader />
        ) : !data?.length ? (
          <EmptyState icon={<Bike className="h-10 w-10" />} title="Aucune course pour le moment">
            Les commandes qui vous sont assignées apparaissent ici en temps réel.
          </EmptyState>
        ) : (
          data.map((d) => {
            const next = NEXT[d.status]
            const blocked = d.status === 'ASSIGNED' && d.order.status !== 'READY'
            return (
              <article key={d.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="tabular text-3xl font-bold">#{d.order.number}</p>
                    {!isDriver && d.driverName && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                        <Bike className="h-4 w-4" /> {d.driverName}
                        {!d.driverId && ' (externe)'}
                      </p>
                    )}
                  </div>
                  <Badge tone="accent">{DELIVERY_STATUS[d.status]}</Badge>
                </div>
                <p className="mt-3 flex items-start gap-2 text-lg">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" /> {d.street}, {d.city}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${d.street}, ${d.city}, Guinée`)}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-semibold"
                  >
                    <Navigation className="h-4 w-4" /> Itinéraire
                  </a>
                  {d.order.contactPhone && (
                    <a href={`tel:${d.order.contactPhone}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-semibold">
                      <Phone className="h-4 w-4" /> {d.order.contactName ?? 'Client'}
                    </a>
                  )}
                </div>
                <p className="mt-3 text-sm text-muted">{d.order.items.map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(', ')}</p>
                {d.order.instructions && <p className="mt-2 rounded-lg bg-accent/10 p-2 text-sm">{d.order.instructions}</p>}
                <p className="tabular mt-3 text-sm text-muted">Déjà payée en ligne · {gnf(d.order.total)} · rien à encaisser</p>
                {next && (
                  <Button className="mt-4 w-full" disabled={blocked} loading={advance.isPending && advance.variables?.id === d.id} onClick={() => advance.mutate({ id: d.id, status: next.to })}>
                    {blocked ? `En cuisine : ${ORDER_STATUS[d.order.status]}` : next.label}
                  </Button>
                )}
              </article>
            )
          })
        )}
      </main>
    </div>
  )
}
