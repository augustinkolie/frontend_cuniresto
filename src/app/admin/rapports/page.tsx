'use client'

import { useQuery } from '@tanstack/react-query'
import { Download, FileText } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { AdminHeader, PeriodSelect, StatCard, Table, Td } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Badge, Card } from '@/components/ui/misc'
import { Skeleton } from '@/components/ui/spinner'
import { get } from '@/lib/api'
import { cn } from '@/lib/cn'
import { DAY_NAMES, gnf } from '@/lib/format'
import { ORDER_TYPE, PAYMENT_PROVIDER } from '@/lib/labels'
import type { OrderType, PaymentProvider } from '@/lib/types'

const loading = () => <Skeleton className="h-[240px]" />
const TrendChart = dynamic(() => import('@/components/admin/charts').then((m) => m.TrendChart), { ssr: false, loading })
const BarsChart = dynamic(() => import('@/components/admin/charts').then((m) => m.BarsChart), { ssr: false, loading })
const ShareBar = dynamic(() => import('@/components/admin/charts').then((m) => m.ShareBar), { ssr: false })

interface Sales {
  byDay: Array<{ day: string; revenue: number; orders: number }>
  total: number
  orders: number
  trend: number | null
  byType: Array<{ type: OrderType; revenue: number; orders: number }>
  byProvider: Array<{ provider: PaymentProvider; amount: number; count: number }>
}
interface Performance {
  reservations: { total: number; confirmed: number; cancelled: number; confirmationRate: number }
  reviews: { total: number; positive: number; negative: number; satisfactionRate: number }
  users: { new: number; active: number }
  orders: { total: number; cancelled: number; cancellationRate: number }
}
interface Peak {
  byHour: Array<{ hour: number; orders: number }>
  byWeekday: Array<{ weekday: number; orders: number }>
  reservationsBySlot: Array<{ slot: string; reservations: number; covers: number }>
}
interface MenuRow {
  id: string
  name: string
  category: string
  price: number
  quantity: number
  revenue: number
  ratingAvg: number
  ratingCount: number
  quadrant: 'STAR' | 'PLOWHORSE' | 'PUZZLE' | 'DOG'
}
interface HistoryRow {
  day: string
  orders: number
  revenue: number
  delivery: number
  pickup: number
  dineIn: number
  reservations: number
  covers: number
}

const QUADRANT: Record<MenuRow['quadrant'], { label: string; hint: string; tone: 'success' | 'accent' | 'primary' | 'danger' }> = {
  STAR: { label: 'Étoile', hint: 'Populaire et apprécié : à mettre en avant', tone: 'success' },
  PLOWHORSE: { label: 'Locomotive', hint: 'Se vend bien, note à améliorer', tone: 'accent' },
  PUZZLE: { label: 'Pépite', hint: 'Apprécié mais peu vendu : à promouvoir', tone: 'primary' },
  DOG: { label: 'À revoir', hint: 'Peu vendu et moins apprécié', tone: 'danger' },
}

const toCsv = (rows: HistoryRow[]) =>
  [
    'date;commandes;chiffre_affaires_gnf;livraison;a_emporter;sur_place;reservations;couverts',
    ...rows.map((r) => [r.day, r.orders, r.revenue, r.delivery, r.pickup, r.dineIn, r.reservations, r.covers].join(';')),
  ].join('\n')

async function exportPdf(rows: HistoryRow[], days: number) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF()
  const money = (n: number) => new Intl.NumberFormat('fr-FR').format(n).replace(/ | /g, ' ')
  doc.setFontSize(16)
  doc.text(`Maison Braise — rapport des ${days} derniers jours`, 14, 18)
  autoTable(doc, {
    startY: 26,
    head: [['Date', 'Cmd', 'CA (GNF)', 'Livr.', 'Emp.', 'Place', 'Résa', 'Couv.']],
    body: rows.map((r) => [r.day, r.orders, money(r.revenue), r.delivery, r.pickup, r.dineIn, r.reservations, r.covers]),
    headStyles: { fillColor: [201, 80, 42] },
  })
  doc.save(`rapport-${days}j.pdf`)
}

export default function ReportsPage() {
  const [days, setDays] = useState(30)
  const sales = useQuery({ queryKey: ['admin', 'sales', days], queryFn: () => get<Sales>('/admin/analytics/sales', { days }) })
  const perf = useQuery({ queryKey: ['admin', 'performance', days], queryFn: () => get<Performance>('/admin/analytics/performance', { days }) })
  const top = useQuery({ queryKey: ['admin', 'top', days], queryFn: () => get<Array<{ name: string; quantity: number; revenue: number }>>('/admin/analytics/top-dishes', { days }) })
  const peak = useQuery({ queryKey: ['admin', 'peak', days], queryFn: () => get<Peak>('/admin/analytics/peak-hours', { days }) })
  const menu = useQuery({ queryKey: ['admin', 'menu-opt', days], queryFn: () => get<MenuRow[]>('/admin/analytics/menu-optimization', { days }) })
  const history = useQuery({ queryKey: ['admin', 'history', days], queryFn: () => get<HistoryRow[]>('/admin/analytics/history', { days }) })

  const downloadCsv = () => {
    if (!history.data) return
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([`﻿${toCsv(history.data)}`], { type: 'text/csv;charset=utf-8' }))
    link.download = `rapport-${days}j.csv`
    link.click()
  }

  const s = sales.data
  const p = perf.data

  return (
    <div className="space-y-6">
      <AdminHeader title="Rapports" description="Ventes, affluence, satisfaction et performance de la carte." actions={<PeriodSelect value={days} onChange={setDays} />} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Chiffre d’affaires"
          value={s ? gnf(s.total) : '—'}
          tone="primary"
          hint={s?.trend !== null && s?.trend !== undefined ? `${s.trend >= 0 ? '▲' : '▼'} ${Math.abs(s.trend)} % vs période précédente` : undefined}
        />
        <StatCard label="Commandes payées" value={s?.orders ?? '—'} hint={s && s.orders ? `ticket moyen ${gnf(Math.round(s.total / s.orders))}` : undefined} />
        <StatCard label="Satisfaction" value={p ? `${p.reviews.satisfactionRate} %` : '—'} tone="success" hint={p ? `${p.reviews.total} avis` : undefined} />
        <StatCard label="Réservations confirmées" value={p ? `${p.reservations.confirmationRate} %` : '—'} hint={p ? `${p.reservations.total} demandes · ${p.users.new} nouveaux clients` : undefined} />
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-sans text-lg font-semibold">Chiffre d’affaires par jour</h2>
        {s && s.byDay.length > 0 ? (
          <TrendChart label="Chiffre d’affaires par jour" data={s.byDay.map((d) => ({ jour: d.day.slice(5).split('-').reverse().join('/'), revenue: d.revenue }))} x="jour" y="revenue" unit="GNF" />
        ) : (
          <p className="py-10 text-center text-sm text-muted">Aucune vente sur la période.</p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-sans text-lg font-semibold">Par type de commande</h2>
          {s && <ShareBar items={s.byType.map((t) => ({ label: ORDER_TYPE[t.type], value: t.revenue }))} unit="GNF" />}
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-sans text-lg font-semibold">Par moyen de paiement</h2>
          {s && <ShareBar items={s.byProvider.map((t) => ({ label: PAYMENT_PROVIDER[t.provider], value: t.amount }))} unit="GNF" />}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-sans text-lg font-semibold">Plats les plus vendus</h2>
          {top.data && top.data.length > 0 ? (
            <BarsChart label="Quantités vendues par plat" horizontal height={Math.max(200, top.data.slice(0, 10).length * 34)} data={top.data.slice(0, 10).map((d) => ({ plat: d.name, quantite: d.quantity }))} x="plat" y="quantite" unit="vendus" />
          ) : (
            <p className="py-10 text-center text-sm text-muted">Pas encore de ventes.</p>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-sans text-lg font-semibold">Affluence par heure</h2>
          {peak.data && peak.data.byHour.length > 0 ? (
            <BarsChart label="Commandes par heure" data={Array.from({ length: 24 }, (_, h) => ({ heure: `${h}h`, commandes: peak.data!.byHour.find((x) => x.hour === h)?.orders ?? 0 })).slice(8, 24)} x="heure" y="commandes" unit="commandes" />
          ) : (
            <p className="py-10 text-center text-sm text-muted">Pas encore de données.</p>
          )}
          {peak.data && peak.data.byWeekday.length > 0 && (
            <p className="mt-3 text-sm text-muted">
              Jour le plus chargé :{' '}
              <strong className="text-text">{DAY_NAMES[[...peak.data.byWeekday].sort((a, b) => b.orders - a.orders)[0]!.weekday]}</strong>
            </p>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-1 font-sans text-lg font-semibold">Ingénierie de menu</h2>
        <p className="mb-4 text-sm text-muted">Chaque plat classé selon ses ventes et sa note moyenne sur la période.</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.values(QUADRANT).map((q) => (
            <Badge key={q.label} tone={q.tone}>
              {q.label} : {q.hint}
            </Badge>
          ))}
        </div>
        {menu.data && (
          <Table head={['Plat', 'Catégorie', 'Vendus', 'CA', 'Note', 'Classement']}>
            {menu.data.map((m) => (
              <tr key={m.id}>
                <Td className="font-semibold">{m.name}</Td>
                <Td>{m.category}</Td>
                <Td className="tabular">{m.quantity}</Td>
                <Td className="tabular">{gnf(m.revenue)}</Td>
                <Td className="tabular">{m.ratingCount ? m.ratingAvg.toFixed(1) : '—'}</Td>
                <Td>
                  <Badge tone={QUADRANT[m.quadrant].tone}>{QUADRANT[m.quadrant].label}</Badge>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-sans text-lg font-semibold">Historique quotidien</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={downloadCsv} disabled={!history.data?.length}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button size="sm" variant="secondary" onClick={() => history.data && void exportPdf(history.data, days)} disabled={!history.data?.length}>
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>
        {history.data && (
          <Table head={['Date', 'Commandes', 'CA', 'Livraison', 'À emporter', 'Sur place', 'Réservations', 'Couverts']}>
            {history.data.map((h) => (
              <tr key={h.day}>
                <Td className="tabular">{h.day.split('-').reverse().join('/')}</Td>
                <Td className="tabular">{h.orders}</Td>
                <Td className={cn('tabular font-semibold')}>{gnf(h.revenue)}</Td>
                <Td className="tabular">{h.delivery}</Td>
                <Td className="tabular">{h.pickup}</Td>
                <Td className="tabular">{h.dineIn}</Td>
                <Td className="tabular">{h.reservations}</Td>
                <Td className="tabular">{h.covers}</Td>
              </tr>
            ))}
            {history.data.length === 0 && (
              <tr>
                <Td colSpan={8} className="py-8 text-center text-muted">
                  Aucune activité sur la période
                </Td>
              </tr>
            )}
          </Table>
        )}
      </Card>
    </div>
  )
}
