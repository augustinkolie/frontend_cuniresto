'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminHeader } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Card } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { errorMessage, get, put } from '@/lib/api'
import type { RestaurantSettings } from '@/lib/types'

interface ReservationSettings {
  capacityPerSlot: number
  minNoticeMinutes: number
  maxDaysAhead: number
  lastSeatingBeforeCloseMinutes: number
}

export default function SettingsAdminPage() {
  const { data } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => get<{ restaurant: RestaurantSettings; reservations: ReservationSettings }>('/admin/settings'),
  })
  const [restaurant, setRestaurant] = useState<RestaurantSettings | null>(null)
  const [reservations, setReservations] = useState<ReservationSettings | null>(null)
  useEffect(() => {
    if (data) {
      setRestaurant(data.restaurant)
      setReservations(data.reservations)
    }
  }, [data])

  const save = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => put(`/admin/settings/${key}`, { value }),
    onSuccess: () => toast.success('Paramètres enregistrés'),
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (!restaurant || !reservations) return <PageLoader />
  const r = restaurant
  const setR = (patch: Partial<RestaurantSettings>) => setRestaurant({ ...r, ...patch })
  const clean = (v: string) => (v.trim() ? v.trim() : undefined)

  return (
    <div className="space-y-6">
      <AdminHeader title="Paramètres" description="Coordonnées affichées sur le site et règles de réservation." />
      <Card className="p-6">
        <h2 className="mb-4 font-sans text-lg font-semibold">Restaurant</h2>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate({
              key: 'restaurant',
              value: {
                ...r,
                whatsapp: clean(r.whatsapp ?? ''),
                mapUrl: clean(r.mapUrl ?? ''),
                socials: { facebook: clean(r.socials.facebook ?? ''), instagram: clean(r.socials.instagram ?? ''), tiktok: clean(r.socials.tiktok ?? '') },
              },
            })
          }}
        >
          <Field label="Nom">{(p) => <Input {...p} required value={r.name} onChange={(e) => setR({ name: e.target.value })} />}</Field>
          <Field label="Accroche">{(p) => <Input {...p} value={r.tagline} onChange={(e) => setR({ tagline: e.target.value })} />}</Field>
          <Field label="Téléphone">{(p) => <Input {...p} value={r.phone} onChange={(e) => setR({ phone: e.target.value })} />}</Field>
          <Field label="WhatsApp">{(p) => <Input {...p} value={r.whatsapp ?? ''} onChange={(e) => setR({ whatsapp: e.target.value })} />}</Field>
          <Field label="E-mail">{(p) => <Input {...p} type="email" value={r.email} onChange={(e) => setR({ email: e.target.value })} />}</Field>
          <Field label="Adresse">{(p) => <Input {...p} value={r.address} onChange={(e) => setR({ address: e.target.value })} />}</Field>
          <Field label="Ville">{(p) => <Input {...p} value={r.city} onChange={(e) => setR({ city: e.target.value })} />}</Field>
          <Field label="Facebook">{(p) => <Input {...p} type="url" value={r.socials.facebook ?? ''} onChange={(e) => setR({ socials: { ...r.socials, facebook: e.target.value } })} />}</Field>
          <Field label="Instagram">{(p) => <Input {...p} type="url" value={r.socials.instagram ?? ''} onChange={(e) => setR({ socials: { ...r.socials, instagram: e.target.value } })} />}</Field>
          <Field label="TikTok">{(p) => <Input {...p} type="url" value={r.socials.tiktok ?? ''} onChange={(e) => setR({ socials: { ...r.socials, tiktok: e.target.value } })} />}</Field>
          <div className="sm:col-span-2">
            <Button type="submit" loading={save.isPending}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-sans text-lg font-semibold">Réservations</h2>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate({ key: 'reservations', value: reservations })
          }}
        >
          <Field label="Couverts maximum par créneau de 30 min">{(p) => <Input {...p} type="number" min={1} value={reservations.capacityPerSlot} onChange={(e) => setReservations({ ...reservations, capacityPerSlot: Number(e.target.value) })} />}</Field>
          <Field label="Délai minimum avant l’arrivée (minutes)">{(p) => <Input {...p} type="number" min={0} value={reservations.minNoticeMinutes} onChange={(e) => setReservations({ ...reservations, minNoticeMinutes: Number(e.target.value) })} />}</Field>
          <Field label="Réservation jusqu’à (jours à l’avance)">{(p) => <Input {...p} type="number" min={1} value={reservations.maxDaysAhead} onChange={(e) => setReservations({ ...reservations, maxDaysAhead: Number(e.target.value) })} />}</Field>
          <Field label="Dernière arrivée avant la fermeture (minutes)">{(p) => <Input {...p} type="number" min={0} value={reservations.lastSeatingBeforeCloseMinutes} onChange={(e) => setReservations({ ...reservations, lastSeatingBeforeCloseMinutes: Number(e.target.value) })} />}</Field>
          <div className="sm:col-span-2">
            <Button type="submit" loading={save.isPending}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
