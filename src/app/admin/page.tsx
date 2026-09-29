'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, BellRing, CalendarDays, ChefHat, Receipt, Wallet } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { AdminHeader, StatCard } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Badge, Card } from '@/components/ui/misc'
import { PageLoader, Skeleton } from '@/components/ui/spinner'
import { useSession } from '@/hooks/use-session'
import { get, patch } from '@/lib/api'
import { formatDate, gnf, timeAgo } from '@/lib/format'
import { RESERVATION_STATUS } from '@/lib/labels'
import type { Reservation } from '@/lib/types'

// Écran lourd (graphique) chargé à la demande.
const TrendChart = dynamic(() => import('@/components/admin/charts').then((m) => m.TrendChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[260px]" />,
})

interface Summary {
  todayRevenue: number
  todayOrders: number
  averageTicket: number
  ordersInProgress: number
  pendingReservations: number
  upcomingReservations: Reservation[]
  lowStock: Array<{ id: string; name: string; stock: number }>
}

interface Sales {
  byDay: Array<{ day: string; revenue: number; orders: number }>
  total: number
  trend: number | null
}

interface WaiterCall {
  id: string
  createdAt: string
  table: { number: number }
}

export default function DashboardPage() {
  const { hasRole } = useSession()
  const client = useQueryClient()
  const isManager = hasRole('MANAGER')
  const summary = useQuery({ queryKey: ['admin', 'summary'], queryFn: () => get<Summary>('/admin/analytics/summary'), enabled: isManager, refetchInterval: 60_000 })
  const sales = useQuery({ queryKey: ['admin', 'sales', 30], queryFn: () => get<Sales>('/admin/analytics/sales', { days: 30 }), enabled: isManager })
  const calls = useQuery({ queryKey: ['admin', 'waiter-calls'], queryFn: () => get<WaiterCall[]>('/admin/waiter-calls'), refetchInterval: 30_000 })
  const reservations = useQuery({
    queryKey: ['admin', 'reservations', 'today'],
    queryFn: () => get<Reservation[]>('/admin/reservations', { date: new Date().toISOString().slice(0, 10) }),
    enabled: !isManager,
  })
  const ack = useMutation({
    mutationFn: (id: string) => patch(`/admin/waiter-calls/${id}/acknowledge`),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['admin', 'waiter-calls'] }),
  })

  const s = summary.data
  const upcoming = s?.upcomingReservations ?? reservations.data ?? []

  return (
    <div className="space-y-6">
      <AdminHeader title="Tableau de bord" description={formatDate(new Date(), { weekday: 'long' })} />

      {calls.data && calls.data.length > 0 && (
        <Card className="border-accent bg-accent/10 p-4">
          <p className="mb-3 flex items-center gap-2 font-semibold">
            <BellRing className="h-5 w-5 text-accent" /> Appels en salle
          </p>
          <ul className="flex flex-wrap gap-2">
            {calls.data.map((c) => (
              <li key={c.id} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-3 pr-1">
                <span className="text-sm font-semibold">Table {c.table.number}</span>
                <span className="text-xs text-muted">{timeAgo(c.createdAt)}</span>
                <Button size="sm" variant="ghost" onClick={() => ack.mutate(c.id)}>
                  Pris en charge
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isManager &&
        (s ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Chiffre d’affaires du jour" value={gnf(s.todayRevenue)} tone="primary" icon={<Wallet className="h-5 w-5" />} hint={`${s.todayOrders} commandes payées`} />
            <StatCard label="Ticket moyen" value={gnf(s.averageTicket)} icon={<Receipt className="h-5 w-5" />} />
            <StatCard label="Commandes en cours" value={s.ordersInProgress} icon={<ChefHat className="h-5 w-5" />} hint={<Link href="/admin/cuisine" className="text-primary hover:underline">Ouvrir l’écran cuisine</Link>} />
            <StatCard label="Réservations à confirmer" value={s.pendingReservations} tone={s.pendingReservations ? 'danger' : 'neutral'} icon={<CalendarDays className="h-5 w-5" />} />
          </div>
        ) : (
          <PageLoader />
        ))}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {isManager && (
          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-sans text-lg font-semibold">Chiffre d’affaires — 30 jours</h2>
              {sales.data && (
                <p className="tabular text-sm text-muted">
                  {gnf(sales.data.total)}
                  {sales.data.trend !== null && (
                    <span className={sales.data.trend >= 0 ? 'ml-2 text-success' : 'ml-2 text-danger'}>
                      {sales.data.trend >= 0 ? '▲' : '▼'} {Math.abs(sales.data.trend)} %
                    </span>
                  )}
                </p>
              )}
            </div>
            {sales.data && sales.data.byDay.length > 0 ? (
              <TrendChart
                label="Chiffre d’affaires quotidien"
                data={sales.data.byDay.map((d) => ({ jour: d.day.slice(5).split('-').reverse().join('/'), revenue: d.revenue }))}
                x="jour"
                y="revenue"
                unit="GNF"
              />
            ) : (
              <p className="py-16 text-center text-sm text-muted">Pas encore de ventes sur la période.</p>
            )}
          </Card>
        )}

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-lg font-semibold">Réservations à venir</h2>
            <Link href="/admin/reservations" className="text-sm font-semibold text-primary hover:underline">
              Planning
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">Aucune réservation à venir.</p>
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <span className="tabular w-24 shrink-0 text-sm font-semibold">
                    {new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })} {r.timeSlot}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {r.firstName} {r.lastName} · {r.partySize} pers.
                  </span>
                  <Badge tone={r.status === 'CONFIRMED' ? 'success' : 'accent'}>{RESERVATION_STATUS[r.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {s && s.lowStock.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-sans text-lg font-semibold">
            <AlertTriangle className="h-5 w-5 text-danger" /> Stock faible
          </h2>
          <ul className="flex flex-wrap gap-2">
            {s.lowStock.map((d) => (
              <li key={d.id}>
                <Link href="/admin/carte" className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm hover:border-danger">
                  {d.name} <span className="tabular font-semibold text-danger">{d.stock}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
