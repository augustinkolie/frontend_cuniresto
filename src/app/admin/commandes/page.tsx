'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminHeader, Table, Td } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { ResponsiveDrawer } from '@/components/ui/dialog'
import { Input, Select } from '@/components/ui/field'
import { Badge } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useDebounce } from '@/hooks/use-debounce'
import { errorMessage, get, patch, post } from '@/lib/api'
import { formatDateTime, gnf } from '@/lib/format'
import { DELIVERY_STATUS, ORDER_STATUS, ORDER_TYPE, PAYMENT_PROVIDER } from '@/lib/labels'
import type { CursorPage, Order, OrderStatus, OrderType } from '@/lib/types'

export default function OrdersAdminPage() {
  const client = useQueryClient()
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [type, setType] = useState<OrderType | ''>('')
  const [search, setSearch] = useState('')
  const q = useDebounce(search, 300)
  const [selected, setSelected] = useState<Order | null>(null)

  const query = useInfiniteQuery({
    queryKey: ['admin', 'orders', status, type, q],
    queryFn: ({ pageParam }) => get<CursorPage<Order>>('/admin/orders', { status, type, search: q, cursor: pageParam, limit: 30 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
  const orders = query.data?.pages.flatMap((p) => p.items) ?? []

  const refresh = async (id: string) => {
    await client.invalidateQueries({ queryKey: ['admin'] })
    const fresh = await get<Order>(`/orders/${id}`)
    setSelected(fresh)
  }
  const move = useMutation({
    mutationFn: ({ id, to }: { id: string; to: OrderStatus }) => patch(`/admin/orders/${id}/status`, { status: to }),
    onSuccess: (_d, v) => void refresh(v.id),
    onError: (e) => toast.error(errorMessage(e)),
  })
  const paid = useMutation({
    mutationFn: (id: string) => post(`/payments/${id}/mark-paid`),
    onSuccess: (_d, id) => {
      toast.success('Paiement encaissé')
      void refresh(id)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <div>
      <AdminHeader title="Commandes" description="Toutes les commandes en ligne, à emporter et sur place." />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px_200px]">
        <Input placeholder="N° de commande, téléphone, nom…" aria-label="Rechercher" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select aria-label="Statut" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | '')}>
          <option value="">Tous les statuts</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select aria-label="Type" value={type} onChange={(e) => setType(e.target.value as OrderType | '')}>
          <option value="">Tous les types</option>
          {Object.entries(ORDER_TYPE).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      {query.isLoading ? (
        <PageLoader />
      ) : (
        <Table head={['N°', 'Date', 'Client', 'Type', 'Statut', 'Paiement', 'Total']}>
          {orders.map((o) => (
            <tr key={o.id} onClick={() => setSelected(o)} className="cursor-pointer hover:bg-text/5">
              <Td className="tabular font-semibold">#{o.number}</Td>
              <Td>{formatDateTime(o.createdAt)}</Td>
              <Td>{o.user ? `${o.user.firstName} ${o.user.lastName}` : (o.contactName ?? (o.table ? `Table ${o.table.number}` : '—'))}</Td>
              <Td>{ORDER_TYPE[o.type]}</Td>
              <Td>
                <Badge tone={o.status === 'CANCELLED' ? 'danger' : ['DELIVERED', 'COMPLETED'].includes(o.status) ? 'success' : 'accent'}>{ORDER_STATUS[o.status]}</Badge>
              </Td>
              <Td>
                {o.payment ? `${PAYMENT_PROVIDER[o.payment.provider]}${o.payment.status === 'SUCCEEDED' ? ' ✓' : ''}` : '—'}
              </Td>
              <Td className="tabular font-semibold">{gnf(o.total)}</Td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <Td colSpan={7} className="py-10 text-center text-muted">
                Aucune commande
              </Td>
            </tr>
          )}
        </Table>
      )}
      {query.hasNextPage && (
        <Button variant="secondary" className="mt-4" loading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
          Charger plus
        </Button>
      )}

      <ResponsiveDrawer open={!!selected} onClose={() => setSelected(null)} title={selected ? `Commande #${selected.number}` : ''}>
        {selected && (
          <div className="space-y-5 p-5">
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">{ORDER_STATUS[selected.status]}</Badge>
              <Badge>{ORDER_TYPE[selected.type]}</Badge>
              {selected.payment && (
                <Badge tone={selected.payment.status === 'SUCCEEDED' ? 'success' : 'neutral'}>
                  {PAYMENT_PROVIDER[selected.payment.provider]} · {selected.payment.status === 'SUCCEEDED' ? 'payé' : 'non payé'}
                </Badge>
              )}
            </div>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Créée</dt>
                <dd>{formatDateTime(selected.createdAt)}</dd>
              </div>
              {selected.contactPhone && (
                <div className="flex justify-between">
                  <dt className="text-muted">Contact</dt>
                  <dd>
                    {selected.contactName} ·{' '}
                    <a href={`tel:${selected.contactPhone}`} className="text-primary">
                      {selected.contactPhone}
                    </a>
                  </dd>
                </div>
              )}
              {selected.deliveryStreet && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Adresse</dt>
                  <dd className="text-right">
                    {selected.deliveryStreet}, {selected.deliveryCity}
                  </dd>
                </div>
              )}
              {selected.delivery && (
                <div className="flex justify-between">
                  <dt className="text-muted">Livraison</dt>
                  <dd>
                    {DELIVERY_STATUS[selected.delivery.status]}
                    {selected.delivery.driverName && ` · ${selected.delivery.driverName}`}
                  </dd>
                </div>
              )}
            </dl>
            <ul className="divide-y divide-line rounded-[var(--radius-control)] border border-line">
              {selected.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 px-3 py-2 text-sm">
                  <span>
                    {i.quantity} × {i.nameSnapshot}
                    {i.notes && <span className="block text-muted">{i.notes}</span>}
                  </span>
                  <span className="tabular">{gnf(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
              <li className="flex justify-between px-3 py-2 font-semibold">
                <span>Total</span>
                <span className="tabular">{gnf(selected.total)}</span>
              </li>
            </ul>
            {(selected.instructions || selected.tastePreferences) && (
              <p className="rounded-lg bg-accent/10 p-3 text-sm">{[selected.instructions, selected.tastePreferences].filter(Boolean).join(' · ')}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {selected.nextStatuses.map((s) => (
                <Button key={s} size="sm" variant={s === 'CANCELLED' ? 'danger' : 'primary'} loading={move.isPending && move.variables?.to === s} onClick={() => move.mutate({ id: selected.id, to: s })}>
                  {s === 'CANCELLED' ? 'Annuler' : `→ ${ORDER_STATUS[s]}`}
                </Button>
              ))}
              {selected.payment?.provider === 'ON_SITE' && selected.payment.status !== 'SUCCEEDED' && (
                <Button size="sm" variant="secondary" onClick={() => paid.mutate(selected.id)} loading={paid.isPending}>
                  Encaisser
                </Button>
              )}
            </div>
          </div>
        )}
      </ResponsiveDrawer>
    </div>
  )
}
