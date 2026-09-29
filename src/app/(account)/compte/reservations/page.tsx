'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, LinkButton } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Badge, EmptyState } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useSocketEvent } from '@/hooks/use-socket-event'
import { errorMessage, get, patch } from '@/lib/api'
import { formatDate, todayIso } from '@/lib/format'
import { RESERVATION_STATUS } from '@/lib/labels'
import type { Reservation } from '@/lib/types'

export default function MyReservationsPage() {
  const client = useQueryClient()
  const [cancelling, setCancelling] = useState<Reservation | null>(null)
  const { data, isLoading } = useQuery({ queryKey: ['reservations', 'mine'], queryFn: () => get<Reservation[]>('/reservations/me') })
  useSocketEvent('reservation:updated', () => void client.invalidateQueries({ queryKey: ['reservations', 'mine'] }))

  const cancel = useMutation({
    mutationFn: (id: string) => patch(`/reservations/${id}/cancel`),
    onSuccess: () => {
      toast.success('Réservation annulée')
      setCancelling(null)
      void client.invalidateQueries({ queryKey: ['reservations', 'mine'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const today = todayIso()
  const upcoming = data?.filter((r) => r.date.slice(0, 10) >= today && ['PENDING', 'CONFIRMED'].includes(r.status)) ?? []
  const past = data?.filter((r) => !upcoming.includes(r)) ?? []

  const Item = ({ r }: { r: Reservation }) => (
    <li className="flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-2">
        <span className="tabular text-xl font-semibold leading-none">{new Date(r.date).getUTCDate()}</span>
        <span className="text-xs uppercase text-muted">{new Date(r.date).toLocaleDateString('fr-FR', { month: 'short', timeZone: 'UTC' })}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {formatDate(r.date, { weekday: 'long', timeZone: 'UTC' })} à {r.timeSlot}
        </p>
        <p className="flex items-center gap-2 text-sm text-muted">
          <Users className="h-4 w-4" /> {r.partySize} personne{r.partySize > 1 ? 's' : ''}
          {r.table && ` · table ${r.table.number}`}
        </p>
      </div>
      <Badge tone={r.status === 'CONFIRMED' ? 'success' : r.status === 'CANCELLED' ? 'danger' : 'accent'}>{RESERVATION_STATUS[r.status]}</Badge>
      {upcoming.includes(r) && (
        <Button size="sm" variant="ghost" onClick={() => setCancelling(r)}>
          Annuler
        </Button>
      )}
    </li>
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[36px] font-semibold">Mes réservations</h1>
        <LinkButton href="/reserver" size="sm">
          Nouvelle réservation
        </LinkButton>
      </div>
      {isLoading ? (
        <PageLoader />
      ) : !data?.length ? (
        <EmptyState icon={<CalendarDays className="h-10 w-10" />} title="Aucune réservation" action={<LinkButton href="/reserver">Réserver une table</LinkButton>} />
      ) : (
        <div className="space-y-10">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-medium">À venir</h2>
              <ul className="space-y-3">
                {upcoming.map((r) => (
                  <Item key={r.id} r={r} />
                ))}
              </ul>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-medium text-muted">Historique</h2>
              <ul className="space-y-3 opacity-80">
                {past.map((r) => (
                  <Item key={r.id} r={r} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={() => cancelling && cancel.mutate(cancelling.id)}
        title="Annuler la réservation ?"
        confirmLabel="Oui, annuler"
        danger
        loading={cancel.isPending}
      >
        {cancelling && `Réservation du ${formatDate(cancelling.date, { timeZone: 'UTC' })} à ${cancelling.timeSlot}.`}
      </ConfirmDialog>
    </div>
  )
}
