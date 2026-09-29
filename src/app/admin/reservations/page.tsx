'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Mail, Phone } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminHeader, Table, Td } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/field'
import { Badge, Card, Tabs } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { errorMessage, get, patch } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatDate, todayIso } from '@/lib/format'
import { RESERVATION_STATUS } from '@/lib/labels'
import type { Reservation, ReservationStatus, Table as DiningTable } from '@/lib/types'

interface Planning {
  date: string
  isOpen: boolean
  closureReason: string | null
  slots: Array<{ time: string; remaining: number; reservations: Reservation[] }>
}

const shift = (date: string, days: number) => new Date(new Date(`${date}T00:00:00Z`).getTime() + days * 86_400_000).toISOString().slice(0, 10)

export default function ReservationsAdminPage() {
  const client = useQueryClient()
  const [tab, setTab] = useState<'planning' | 'list'>('planning')
  const [date, setDate] = useState(todayIso())
  const [status, setStatus] = useState<ReservationStatus | ''>('PENDING')

  const planning = useQuery({ queryKey: ['admin', 'reservations', 'planning', date], queryFn: () => get<Planning>('/admin/reservations/planning', { date }), enabled: tab === 'planning' })
  const list = useQuery({ queryKey: ['admin', 'reservations', 'list', status], queryFn: () => get<Reservation[]>('/admin/reservations', { status }), enabled: tab === 'list' })
  const tables = useQuery({ queryKey: ['admin', 'tables'], queryFn: () => get<DiningTable[]>('/admin/tables') })

  const manage = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { status?: ReservationStatus; tableId?: string | null } }) => patch(`/admin/reservations/${id}`, body),
    onSuccess: () => {
      toast.success('Réservation mise à jour (le client est prévenu par e-mail)')
      void client.invalidateQueries({ queryKey: ['admin', 'reservations'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const Row = ({ r }: { r: Reservation }) => (
    <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-control)] border border-line bg-surface p-3">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {r.firstName} {r.lastName} · <span className="tabular">{r.partySize} pers.</span>
        </p>
        <p className="flex flex-wrap gap-x-3 text-sm text-muted">
          <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 hover:text-text">
            <Phone className="h-3.5 w-3.5" /> {r.phone}
          </a>
          <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 hover:text-text">
            <Mail className="h-3.5 w-3.5" /> {r.email}
          </a>
        </p>
        {r.message && <p className="mt-1 text-sm italic">« {r.message} »</p>}
      </div>
      <Select
        aria-label="Table"
        className="h-10 w-32"
        value={r.tableId ?? ''}
        onChange={(e) => manage.mutate({ id: r.id, body: { tableId: e.target.value || null } })}
      >
        <option value="">Table…</option>
        {tables.data
          ?.filter((t) => t.capacity >= r.partySize)
          .map((t) => (
            <option key={t.id} value={t.id}>
              T{t.number} ({t.capacity})
            </option>
          ))}
      </Select>
      <Badge tone={r.status === 'CONFIRMED' ? 'success' : r.status === 'CANCELLED' ? 'danger' : 'accent'}>{RESERVATION_STATUS[r.status]}</Badge>
      <div className="flex gap-1">
        {r.status === 'PENDING' && (
          <Button size="sm" onClick={() => manage.mutate({ id: r.id, body: { status: 'CONFIRMED' } })}>
            Confirmer
          </Button>
        )}
        {r.status === 'CONFIRMED' && (
          <Button size="sm" variant="secondary" onClick={() => manage.mutate({ id: r.id, body: { status: 'COMPLETED' } })}>
            Honorée
          </Button>
        )}
        {['PENDING', 'CONFIRMED'].includes(r.status) && (
          <Button size="sm" variant="ghost" onClick={() => manage.mutate({ id: r.id, body: { status: 'CANCELLED' } })}>
            Annuler
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <div>
      <AdminHeader title="Réservations" />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'planning', label: 'Planning' },
          { value: 'list', label: 'Liste' },
        ]}
      />
      {tab === 'planning' ? (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Button size="icon" variant="secondary" onClick={() => setDate(shift(date, -1))} aria-label="Jour précédent">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-11 rounded-[var(--radius-control)] border border-line bg-surface px-3" aria-label="Date" />
            <Button size="icon" variant="secondary" onClick={() => setDate(shift(date, 1))} aria-label="Jour suivant">
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDate(todayIso())}>
              Aujourd’hui
            </Button>
            <p className="ml-2 font-semibold">{formatDate(`${date}T12:00:00Z`, { weekday: 'long' })}</p>
          </div>
          {!planning.data ? (
            <PageLoader />
          ) : !planning.data.isOpen ? (
            <Card className="p-6 text-muted">Fermé ce jour-là{planning.data.closureReason ? ` : ${planning.data.closureReason}` : ''}.</Card>
          ) : (
            <div className="space-y-3">
              {planning.data.slots.map((slot) => {
                const covers = slot.reservations.reduce((s, r) => s + r.partySize, 0)
                return (
                  <div key={slot.time} className={cn('grid gap-3 sm:grid-cols-[100px_1fr]', slot.reservations.length === 0 && 'opacity-60')}>
                    <div className="pt-2">
                      <p className="tabular text-lg font-semibold">{slot.time}</p>
                      <p className="tabular text-xs text-muted">
                        {covers} couv. · {slot.remaining} libres
                      </p>
                    </div>
                    <div className="space-y-2">
                      {slot.reservations.length === 0 ? (
                        <div className="h-full min-h-10 rounded-[var(--radius-control)] border border-dashed border-line" />
                      ) : (
                        slot.reservations.map((r) => <Row key={r.id} r={r} />)
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <Select aria-label="Statut" className="mb-4 max-w-xs" value={status} onChange={(e) => setStatus(e.target.value as ReservationStatus | '')}>
            <option value="">Tous les statuts</option>
            {Object.entries(RESERVATION_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          {!list.data ? (
            <PageLoader />
          ) : (
            <Table head={['Date', 'Heure', 'Client', 'Couverts', 'Statut']}>
              {list.data.map((r) => (
                <tr key={r.id}>
                  <Td>{formatDate(r.date, { timeZone: 'UTC' })}</Td>
                  <Td className="tabular">{r.timeSlot}</Td>
                  <Td>
                    {r.firstName} {r.lastName}
                    <span className="block text-xs text-muted">{r.phone}</span>
                  </Td>
                  <Td className="tabular">{r.partySize}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Badge tone={r.status === 'CONFIRMED' ? 'success' : r.status === 'CANCELLED' ? 'danger' : 'accent'}>{RESERVATION_STATUS[r.status]}</Badge>
                      {r.status === 'PENDING' && (
                        <Button size="sm" onClick={() => manage.mutate({ id: r.id, body: { status: 'CONFIRMED' } })}>
                          Confirmer
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
              {list.data.length === 0 && (
                <tr>
                  <Td colSpan={5} className="py-10 text-center text-muted">
                    Aucune réservation
                  </Td>
                </tr>
              )}
            </Table>
          )}
        </>
      )}
    </div>
  )
}
