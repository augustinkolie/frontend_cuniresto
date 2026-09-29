'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bike, CheckCircle2, Clock, MapPin, Phone, RotateCcw, XCircle } from 'lucide-react'
import Image from '@/components/ui/photo'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { OrderTimeline } from '@/components/orders/order-timeline'
import { Button, LinkButton } from '@/components/ui/button'
import { Badge, Card, EmptyState } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useSocketEvent } from '@/hooks/use-socket-event'
import { errorMessage, get, post } from '@/lib/api'
import { formatDateTime, formatTime, gnf } from '@/lib/format'
import { DELIVERY_MODE, DELIVERY_STATUS, ORDER_STATUS, ORDER_TYPE, PAYMENT_PROVIDER } from '@/lib/labels'
import type { Order } from '@/lib/types'
import { type CartLine, useCart } from '@/stores/cart'

export function OrderTracking({ id }: { id: string }) {
  const client = useQueryClient()
  const router = useRouter()
  const params = useSearchParams()
  const returning = params.get('paiement') === 'retour'
  const key = ['orders', id]

  const { data: order, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () => get<Order>(`/orders/${id}`),
    // Au retour du prestataire, on interroge l'API le temps que le webhook confirme le paiement.
    refetchInterval: (q) => (q.state.data?.status === 'PENDING_PAYMENT' && returning ? 3000 : false),
  })

  const refresh = () => void client.invalidateQueries({ queryKey: key })
  useSocketEvent<{ orderId: string }>('order:updated', (e) => e.orderId === id && refresh())
  useSocketEvent<{ orderId: string }>('delivery:updated', (e) => e.orderId === id && refresh())
  useSocketEvent('delivery:location', refresh)

  useEffect(() => {
    if (returning && order?.status === 'CONFIRMED') toast.success('Paiement reçu, votre commande est confirmée !')
  }, [returning, order?.status])

  const cancel = useMutation({
    mutationFn: () => post(`/orders/${id}/cancel`),
    onSuccess: () => {
      toast.success('Commande annulée')
      refresh()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const reorder = useMutation({
    // Plats encore disponibles, au prix actuel de la carte.
    mutationFn: () => get<Array<CartLine>>(`/orders/${id}/reorder`),
    onSuccess: (items) => {
      if (items.length === 0) return toast.error('Ces plats ne sont plus disponibles')
      const add = useCart.getState().add
      for (const { quantity, ...line } of items) add(line, quantity)
      router.push('/panier')
    },
  })

  if (isLoading) return <PageLoader />
  if (error || !order) {
    return <EmptyState title="Commande introuvable" action={<LinkButton href="/compte/commandes">Mes commandes</LinkButton>} />
  }

  const lastLocation = [...(order.delivery?.events ?? [])].reverse().find((e) => e.lat !== null && e.lng !== null)
  const cancelled = order.status === 'CANCELLED'

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <Card className="space-y-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted">
                {ORDER_TYPE[order.type]} · {formatDateTime(order.createdAt)}
              </p>
              <h1 className="text-[32px] font-semibold">Commande n° {order.number}</h1>
            </div>
            <Badge tone={cancelled ? 'danger' : order.status === 'PENDING_PAYMENT' ? 'accent' : 'success'} className="text-sm">
              {ORDER_STATUS[order.status]}
            </Badge>
          </div>

          {cancelled ? (
            <p className="flex items-center gap-2 text-danger">
              <XCircle className="h-5 w-5" /> Cette commande a été annulée{order.payment?.status === 'FAILED' ? ' (paiement refusé)' : ''}.
            </p>
          ) : order.status === 'PENDING_PAYMENT' ? (
            <div className="space-y-3 rounded-[var(--radius-control)] border border-accent/40 bg-accent/10 p-4">
              <p className="font-semibold">
                {returning ? 'Vérification du paiement en cours…' : 'En attente de votre paiement'}
              </p>
              <p className="text-sm text-muted">
                {order.payment && PAYMENT_PROVIDER[order.payment.provider]}
                {order.payment?.provider === 'ORANGE_MONEY' && ' : validez le paiement sur votre téléphone si demandé.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {order.payment?.checkoutUrl && (
                  <a href={order.payment.checkoutUrl} className="inline-flex h-11 items-center rounded-[var(--radius-control)] bg-primary px-4 font-semibold text-on-primary">
                    Payer maintenant
                  </a>
                )}
                <Button variant="ghost" onClick={() => cancel.mutate()} loading={cancel.isPending}>
                  Annuler la commande
                </Button>
              </div>
            </div>
          ) : (
            <OrderTimeline type={order.type} status={order.status} />
          )}
        </Card>

        {order.delivery && !cancelled && (
          <Card className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">Livraison {DELIVERY_MODE[order.delivery.mode].toLowerCase()}</h2>
              <Badge tone="accent">{DELIVERY_STATUS[order.delivery.status]}</Badge>
            </div>
            <p className="flex items-start gap-2 text-muted">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-accent" /> {order.delivery.street}, {order.delivery.city}
            </p>
            <p className="flex items-center gap-2 text-muted">
              <Clock className="h-4 w-4 text-accent" /> Temps estimé : {order.delivery.estimatedMinutes} min
              {order.delivery.actualMinutes !== null && ` · réel : ${order.delivery.actualMinutes} min`}
            </p>
            {order.delivery.driverName && (
              <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-control)] bg-surface-2 p-4">
                <Bike className="h-6 w-6 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold">{order.delivery.driverName}</p>
                  {order.delivery.driverVehicle && <p className="text-sm text-muted">{order.delivery.driverVehicle}</p>}
                </div>
                {order.delivery.driverPhone && (
                  <a href={`tel:${order.delivery.driverPhone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm font-semibold">
                    <Phone className="h-4 w-4" /> Appeler
                  </a>
                )}
              </div>
            )}
            {lastLocation && (
              <a
                href={`https://www.google.com/maps?q=${lastLocation.lat},${lastLocation.lng}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 font-semibold text-accent hover:underline"
              >
                <MapPin className="h-4 w-4" /> Position du livreur ({formatTime(lastLocation.createdAt)})
              </a>
            )}
            <ol className="space-y-3 border-l-2 border-line pl-5">
              {[...order.delivery.events].reverse().map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
                  <p>{e.message}</p>
                  <p className="text-xs text-muted">{formatDateTime(e.createdAt)}</p>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-medium">Détail</h2>
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                {item.imageUrl && (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                  </div>
                )}
                <span className="flex-1 text-sm">
                  {item.quantity} × {item.nameSnapshot}
                </span>
                <span className="tabular text-sm">{gnf(item.unitPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="tabular mt-4 space-y-1 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Sous-total</dt>
              <dd>{gnf(order.subtotal)}</dd>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Livraison</dt>
                <dd>{gnf(order.deliveryFee)}</dd>
              </div>
            )}
            <div className="flex justify-between pt-2 text-lg font-semibold">
              <dt>Total</dt>
              <dd className="text-primary">{gnf(order.total)}</dd>
            </div>
          </dl>
          {order.payment && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <CheckCircle2 className={order.payment.status === 'SUCCEEDED' ? 'h-4 w-4 text-success' : 'h-4 w-4'} />
              {PAYMENT_PROVIDER[order.payment.provider]} · {order.payment.status === 'SUCCEEDED' ? 'payé' : order.payment.status === 'PENDING' ? 'en attente' : 'non abouti'}
            </p>
          )}
        </Card>
        {['DELIVERED', 'COMPLETED', 'CANCELLED', 'SERVED'].includes(order.status) && (
          <Button variant="secondary" className="w-full" onClick={() => reorder.mutate()} loading={reorder.isPending}>
            <RotateCcw className="h-4 w-4" /> Recommander
          </Button>
        )}
        <Link href="/compte/commandes" className="block text-center text-sm font-semibold text-accent hover:underline">
          Toutes mes commandes
        </Link>
      </aside>
    </div>
  )
}
