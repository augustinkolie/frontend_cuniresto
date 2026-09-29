'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bike, Printer, Store, UtensilsCrossed } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useSession } from '@/hooks/use-session'
import { errorMessage, get, patch } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatTime, gnf } from '@/lib/format'
import { ORDER_STATUS } from '@/lib/labels'
import type { Order, OrderStatus } from '@/lib/types'

const COLUMNS: Array<{ title: string; statuses: OrderStatus[]; tone: string }> = [
  { title: 'Reçues', statuses: ['CONFIRMED'], tone: 'border-t-[#2a78d6]' },
  { title: 'En préparation', statuses: ['PREPARING'], tone: 'border-t-primary' },
  { title: 'Prêtes', statuses: ['READY'], tone: 'border-t-success' },
  { title: 'Remises', statuses: ['OUT_FOR_DELIVERY', 'SERVED'], tone: 'border-t-muted' },
]

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  PREPARING: 'Commencer',
  READY: 'Prête',
  OUT_FOR_DELIVERY: 'Remise au livreur',
  SERVED: 'Servie',
  COMPLETED: 'Récupérée / clôturer',
  DELIVERED: 'Livrée',
}

const TYPE_ICON = { DELIVERY: Bike, PICKUP: Store, DINE_IN: UtensilsCrossed }

function minutesSince(date: string, now: number) {
  return Math.floor((now - new Date(date).getTime()) / 60_000)
}

/** Ticket de cuisine imprimable (format 80 mm). */
function printTicket(order: Order) {
  const w = window.open('', '_blank', 'width=380,height=600')
  if (!w) return
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
  w.document.write(`<!doctype html><html><head><title>Commande ${order.number}</title>
<style>body{font-family:monospace;width:72mm;margin:0 auto;font-size:14px}h1{font-size:22px;text-align:center;margin:8px 0}
.row{display:flex;justify-content:space-between}hr{border:0;border-top:1px dashed #000}.big{font-size:18px;font-weight:bold}</style></head><body>
<h1>N° ${order.number}</h1><p style="text-align:center">${order.type === 'DINE_IN' ? `TABLE ${order.table?.number ?? ''}` : order.type === 'DELIVERY' ? 'LIVRAISON' : 'À EMPORTER'} — ${formatTime(order.createdAt)}</p><hr>
${order.items.map((i) => `<div class="big">${i.quantity} × ${esc(i.nameSnapshot)}</div>${i.notes ? `<div>→ ${esc(i.notes)}</div>` : ''}`).join('')}
<hr>${order.instructions ? `<p><b>Note :</b> ${esc(order.instructions)}</p>` : ''}${order.tastePreferences ? `<p><b>Goût :</b> ${esc(order.tastePreferences)}</p>` : ''}
${order.contactName ? `<p>${esc(order.contactName)} ${esc(order.contactPhone ?? '')}</p>` : ''}
<div class="row"><span>Total</span><b>${gnf(order.total)}</b></div></body></html>`)
  w.document.close()
  w.focus()
  w.print()
}

export default function KitchenPage() {
  const client = useQueryClient()
  const { hasRole } = useSession()
  const [now, setNow] = useState(Date.now())
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'kitchen'],
    queryFn: () => get<Order[]>('/admin/orders/kitchen'),
    refetchInterval: 30_000,
  })

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => patch(`/admin/orders/${id}/status`, { status }),
    onMutate: async ({ id, status }) => {
      // Mise à jour optimiste : la carte change de colonne immédiatement.
      await client.cancelQueries({ queryKey: ['admin', 'kitchen'] })
      const previous = client.getQueryData<Order[]>(['admin', 'kitchen'])
      client.setQueryData<Order[]>(['admin', 'kitchen'], (orders) =>
        orders?.map((o) => (o.id === id ? { ...o, status } : o)).filter((o) => !['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(o.status)),
      )
      return { previous }
    },
    onError: (e, _v, ctx) => {
      client.setQueryData(['admin', 'kitchen'], ctx?.previous)
      toast.error(errorMessage(e))
    },
    onSettled: () => void client.invalidateQueries({ queryKey: ['admin', 'kitchen'] }),
  })

  if (isLoading) return <PageLoader />
  const orders = data ?? []

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[32px] font-semibold">Cuisine</h1>
        <p className="text-muted">{orders.length} commande{orders.length > 1 ? 's' : ''} en cours · mise à jour en temps réel</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = orders.filter((o) => col.statuses.includes(o.status))
          return (
            <section key={col.title} aria-label={col.title} className={cn('rounded-[var(--radius-card)] border border-t-4 border-line bg-surface-2/60 p-3', col.tone)}>
              <h2 className="mb-3 flex items-center justify-between px-1 font-sans text-lg font-semibold">
                {col.title} <span className="tabular rounded-full bg-surface px-2.5 text-base">{items.length}</span>
              </h2>
              <ul className="space-y-3">
                {items.map((o) => {
                  const Icon = TYPE_ICON[o.type]
                  const age = minutesSince(o.createdAt, now)
                  const next = o.nextStatuses.filter((s) => s !== 'CANCELLED')
                  const allowed = next.filter((s) => hasRole('MANAGER') || (hasRole('KITCHEN') && ['PREPARING', 'READY'].includes(s)) || (hasRole('WAITER') && ['READY', 'SERVED', 'COMPLETED'].includes(s)))
                  return (
                    <li key={o.id} className="rounded-[var(--radius-control)] border border-line bg-surface p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="tabular text-3xl font-bold leading-none">#{o.number}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-muted">
                            <Icon className="h-4 w-4" /> {o.type === 'DINE_IN' ? `Table ${o.table?.number ?? ''}` : o.type === 'DELIVERY' ? 'Livraison' : 'À emporter'}
                          </p>
                        </div>
                        <Badge tone={age >= 25 ? 'danger' : age >= 15 ? 'accent' : 'neutral'} className="tabular text-sm">
                          {age} min
                        </Badge>
                      </div>
                      <ul className="mt-3 space-y-1">
                        {o.items.map((i) => (
                          <li key={i.id} className="text-lg leading-snug">
                            <strong className="tabular">{i.quantity}×</strong> {i.nameSnapshot}
                            {i.notes && <p className="text-sm text-danger">→ {i.notes}</p>}
                          </li>
                        ))}
                      </ul>
                      {(o.instructions || o.tastePreferences) && (
                        <p className="mt-2 rounded-lg bg-accent/10 px-2 py-1.5 text-sm">{[o.instructions, o.tastePreferences].filter(Boolean).join(' · ')}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {allowed.map((s) => (
                          <Button key={s} size="sm" className="flex-1" onClick={() => move.mutate({ id: o.id, status: s })}>
                            {NEXT_LABEL[s] ?? ORDER_STATUS[s]}
                          </Button>
                        ))}
                        <Button size="sm" variant="secondary" onClick={() => printTicket(o)} aria-label={`Imprimer le ticket ${o.number}`}>
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  )
                })}
                {items.length === 0 && <li className="py-6 text-center text-sm text-muted">—</li>}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
