'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bike, MapPin, Phone } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminHeader } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/field'
import { Badge, EmptyState } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { errorMessage, get, patch } from '@/lib/api'
import { formatTime, gnf } from '@/lib/format'
import { DELIVERY_MODE, DELIVERY_STATUS, ORDER_STATUS } from '@/lib/labels'
import type { Delivery, DeliveryStatus, OrderStatus, User } from '@/lib/types'

type AdminDelivery = Delivery & {
  order: { id: string; number: number; status: OrderStatus; total: number; contactName: string | null; contactPhone: string | null; instructions: string | null; items: Array<{ nameSnapshot: string; quantity: number }> }
}

export default function DeliveriesPage() {
  const client = useQueryClient()
  const [status, setStatus] = useState<DeliveryStatus | ''>('')
  const [assigning, setAssigning] = useState<AdminDelivery | null>(null)
  const [driverId, setDriverId] = useState('')
  const [external, setExternal] = useState({ driverName: '', driverPhone: '', driverVehicle: '' })

  const deliveries = useQuery({ queryKey: ['admin', 'deliveries', status], queryFn: () => get<AdminDelivery[]>('/admin/deliveries', { status }), refetchInterval: 30_000 })
  const drivers = useQuery({ queryKey: ['admin', 'drivers'], queryFn: () => get<User[]>('/admin/drivers') })

  const assign = useMutation({
    mutationFn: () =>
      patch(`/admin/deliveries/${assigning!.id}/assign`, driverId ? { driverId, driverVehicle: external.driverVehicle || undefined } : {
        driverName: external.driverName,
        driverPhone: external.driverPhone || undefined,
        driverVehicle: external.driverVehicle || undefined,
      }),
    onSuccess: () => {
      toast.success('Livreur assigné, le client est prévenu')
      setAssigning(null)
      void client.invalidateQueries({ queryKey: ['admin', 'deliveries'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <div>
      <AdminHeader title="Livraisons" description="Affectez les livreurs et suivez les livraisons en cours." />
      <Select aria-label="Statut" className="mb-5 max-w-xs" value={status} onChange={(e) => setStatus(e.target.value as DeliveryStatus | '')}>
        <option value="">En cours</option>
        {Object.entries(DELIVERY_STATUS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </Select>
      {!deliveries.data ? (
        <PageLoader />
      ) : deliveries.data.length === 0 ? (
        <EmptyState icon={<Bike className="h-10 w-10" />} title="Aucune livraison" />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {deliveries.data.map((d) => (
            <li key={d.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="tabular text-2xl font-semibold">#{d.order.number}</p>
                  <p className="text-sm text-muted">
                    {DELIVERY_MODE[d.mode]} · {formatTime(d.createdAt)} · ~{d.estimatedMinutes} min
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone="accent">{DELIVERY_STATUS[d.status]}</Badge>
                  <span className="text-xs text-muted">Cuisine : {ORDER_STATUS[d.order.status]}</span>
                </div>
              </div>
              <p className="mt-3 flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {d.street}, {d.city}
              </p>
              {d.order.contactPhone && (
                <a href={`tel:${d.order.contactPhone}`} className="mt-1 flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-primary" /> {d.order.contactName} · {d.order.contactPhone}
                </a>
              )}
              <p className="mt-2 text-sm text-muted">{d.order.items.map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(', ')}</p>
              {d.order.instructions && <p className="mt-2 rounded-lg bg-accent/10 px-2 py-1 text-sm">{d.order.instructions}</p>}
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
                <span className="text-sm">
                  {d.driverName ? (
                    <>
                      <Bike className="mr-1 inline h-4 w-4" /> {d.driverName}
                    </>
                  ) : (
                    <span className="text-muted">Pas de livreur</span>
                  )}
                </span>
                <span className="tabular text-sm font-semibold">{gnf(d.order.total)}</span>
                {['PENDING', 'PREPARING', 'READY', 'ASSIGNED'].includes(d.status) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setAssigning(d)
                      setDriverId(d.driverId ?? '')
                      setExternal({ driverName: '', driverPhone: '', driverVehicle: d.driverVehicle ?? '' })
                    }}
                  >
                    {d.driverName ? 'Réassigner' : 'Assigner'}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!assigning} onClose={() => setAssigning(null)} title={assigning ? `Livreur — commande #${assigning.order.number}` : ''}>
        <form
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (!driverId && !external.driverName) return toast.error('Choisissez un livreur')
            assign.mutate()
          }}
        >
          <Field label="Livreur de l’équipe" hint="Il reçoit la course dans son application">
            {(p) => (
              <Select {...p} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                <option value="">— Livreur externe —</option>
                {drivers.data?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {!driverId && (
            <>
              <Field label="Nom du livreur externe">{(p) => <Input {...p} value={external.driverName} onChange={(e) => setExternal({ ...external, driverName: e.target.value })} />}</Field>
              <Field label="Téléphone">{(p) => <Input {...p} type="tel" value={external.driverPhone} onChange={(e) => setExternal({ ...external, driverPhone: e.target.value })} />}</Field>
            </>
          )}
          <Field label="Véhicule (facultatif)">{(p) => <Input {...p} placeholder="Moto rouge, plaque…" value={external.driverVehicle} onChange={(e) => setExternal({ ...external, driverVehicle: e.target.value })} />}</Field>
          <Button type="submit" className="w-full" loading={assign.isPending}>
            Assigner
          </Button>
        </form>
      </Dialog>
    </div>
  )
}
