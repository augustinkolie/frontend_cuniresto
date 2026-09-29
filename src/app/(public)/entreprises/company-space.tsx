'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileText, Repeat, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { Badge, Card, EmptyState, QuantityStepper, Tabs } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { del, errorMessage, get, post } from '@/lib/api'
import { DAY_NAMES, formatDate, gnf } from '@/lib/format'
import { downloadInvoice } from '@/lib/pdf'
import type { Company, CorporateInvoice, CorporateOrder } from '@/lib/types'

interface CorporateDish {
  id: string
  name: string
  price: number
  corporatePrice: number
  category: { name: string }
}

const ORDER_STATUS: Record<CorporateOrder['status'], string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
}

const INVOICE_STATUS: Record<CorporateInvoice['status'], string> = {
  DRAFT: 'Brouillon',
  SENT: 'À payer',
  PAID: 'Payée',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulée',
}

export function CompanySpace({ companyId }: { companyId: string }) {
  const [tab, setTab] = useState<'order' | 'orders' | 'team' | 'invoices'>('order')
  const { data: company, isLoading } = useQuery({ queryKey: ['company', companyId], queryFn: () => get<Company>(`/companies/${companyId}`) })

  if (isLoading || !company) return <PageLoader />
  const isAdmin = company.access !== 'employee'

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-3xl font-semibold">{company.name}</h2>
          <p className="text-muted">
            Remise négociée : <strong className="text-text">{company.discountPercent} %</strong> · Facturation{' '}
            {company.billingCycle === 'MONTHLY' ? 'mensuelle' : 'hebdomadaire'} à {company.paymentTermsDays} jours
          </p>
        </div>
        {isAdmin && (
          <div className="text-right">
            <p className="text-sm text-muted">Solde à régler</p>
            <p className="tabular text-2xl font-semibold text-primary">{gnf(company.currentBalance)}</p>
          </div>
        )}
      </Card>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'order', label: 'Commander' },
          { value: 'orders', label: 'Commandes' },
          ...(isAdmin
            ? [
                { value: 'team' as const, label: `Équipe (${company.employees?.length ?? 0})` },
                { value: 'invoices' as const, label: 'Factures' },
              ]
            : []),
        ]}
      />
      {tab === 'order' && <OrderForm company={company} onDone={() => setTab('orders')} />}
      {tab === 'orders' && <Orders companyId={company.id} />}
      {tab === 'team' && <Team company={company} />}
      {tab === 'invoices' && <Invoices companyId={company.id} />}
    </div>
  )
}

function OrderForm({ company, onDone }: { company: Company; onDone: () => void }) {
  const client = useQueryClient()
  const { data: menu } = useQuery({ queryKey: ['company-menu', company.id], queryFn: () => get<CorporateDish[]>(`/companies/${company.id}/menu`) })
  const [qty, setQty] = useState<Record<string, number>>({})
  const [street, setStreet] = useState(company.street ?? '')
  const [city, setCity] = useState(company.city ?? '')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [recurrence, setRecurrence] = useState<CorporateOrder['recurrence']>('NONE')
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [notes, setNotes] = useState('')

  const lines = Object.entries(qty).filter(([, q]) => q > 0)
  const total = lines.reduce((s, [id, q]) => s + (menu?.find((d) => d.id === id)?.corporatePrice ?? 0) * q, 0)

  const place = useMutation({
    mutationFn: () =>
      post(`/companies/${company.id}/orders`, {
        items: lines.map(([dishId, quantity]) => ({ dishId, quantity })),
        deliveryStreet: street || undefined,
        deliveryCity: city || undefined,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        recurrence,
        recurrenceDays: recurrence === 'WEEKLY' ? days : undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success('Commande enregistrée')
      setQty({})
      void client.invalidateQueries({ queryKey: ['company-orders', company.id] })
      onDone()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (!menu) return <PageLoader />

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line">
        {menu.map((d) => (
          <li key={d.id} className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <p className="font-semibold">{d.name}</p>
              <p className="tabular text-sm">
                <span className="font-semibold text-primary">{gnf(d.corporatePrice)}</span>
                {d.corporatePrice < d.price && <span className="ml-2 text-muted line-through">{gnf(d.price)}</span>}
                <span className="ml-2 text-muted">· {d.category.name}</span>
              </p>
            </div>
            <QuantityStepper value={qty[d.id] ?? 0} onChange={(q) => setQty((s) => ({ ...s, [d.id]: q }))} label={`Quantité ${d.name}`} max={100} />
          </li>
        ))}
      </ul>
      <form
        className="space-y-4 lg:sticky lg:top-28 lg:self-start"
        onSubmit={(e) => {
          e.preventDefault()
          if (lines.length === 0) return toast.error('Ajoutez au moins un plat')
          place.mutate()
        }}
      >
        <Card className="space-y-4 p-6">
          <Field label="Adresse de livraison">{(p) => <Input {...p} value={street} onChange={(e) => setStreet(e.target.value)} />}</Field>
          <Field label="Ville">{(p) => <Input {...p} value={city} onChange={(e) => setCity(e.target.value)} />}</Field>
          <Field label="Date et heure de livraison">
            {(p) => <Input {...p} type="datetime-local" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />}
          </Field>
          <Field label="Récurrence">
            {(p) => (
              <Select {...p} value={recurrence} onChange={(e) => setRecurrence(e.target.value as CorporateOrder['recurrence'])}>
                <option value="NONE">Commande unique</option>
                <option value="DAILY">Tous les jours</option>
                <option value="WEEKLY">Chaque semaine</option>
                <option value="MONTHLY">Chaque mois</option>
              </Select>
            )}
          </Field>
          {recurrence === 'WEEKLY' && (
            <fieldset className="flex flex-wrap gap-1.5">
              <legend className="mb-1.5 text-sm font-semibold">Jours</legend>
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={days.includes(d)}
                  onClick={() => setDays((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d]))}
                  className={`rounded-full border px-3 py-1 text-sm ${days.includes(d) ? 'border-primary bg-primary text-on-primary' : 'border-line'}`}
                >
                  {DAY_NAMES[d]!.slice(0, 3)}
                </button>
              ))}
            </fieldset>
          )}
          <Field label="Notes">{(p) => <Textarea {...p} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />}</Field>
          <div className="flex items-center justify-between border-t border-line pt-4">
            <span className="tabular text-xl font-semibold text-primary">{gnf(total)}</span>
            <Button type="submit" loading={place.isPending}>
              Commander
            </Button>
          </div>
          <p className="text-xs text-muted">Facturé en fin de période, TVA 18 % en sus.</p>
        </Card>
      </form>
    </div>
  )
}

function Orders({ companyId }: { companyId: string }) {
  const client = useQueryClient()
  const { data } = useQuery({ queryKey: ['company-orders', companyId], queryFn: () => get<CorporateOrder[]>(`/companies/${companyId}/orders`) })
  const stop = useMutation({
    mutationFn: (id: string) => post(`/companies/orders/${id}/stop-recurrence`),
    onSuccess: () => {
      toast.success('Récurrence arrêtée')
      void client.invalidateQueries({ queryKey: ['company-orders', companyId] })
    },
  })
  if (!data) return <PageLoader />
  if (data.length === 0) return <EmptyState title="Aucune commande pour le moment" />
  return (
    <ul className="space-y-3">
      {data.map((o) => (
        <li key={o.id} className="rounded-[var(--radius-card)] border border-line p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">
              {formatDate(o.createdAt)} · {o.employee.firstName} {o.employee.lastName}
            </p>
            <div className="flex items-center gap-2">
              {o.recurrence !== 'NONE' && (
                <Badge tone="accent">
                  <Repeat className="h-3 w-3" /> {o.recurrence === 'DAILY' ? 'Quotidienne' : o.recurrence === 'WEEKLY' ? 'Hebdomadaire' : 'Mensuelle'}
                </Badge>
              )}
              <Badge tone={o.status === 'CANCELLED' ? 'danger' : 'success'}>{ORDER_STATUS[o.status]}</Badge>
            </div>
          </div>
          <p className="mt-1 text-sm text-muted">{o.items.map((i) => `${i.quantity} × ${i.nameSnapshot}`).join(', ')}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="tabular font-semibold text-primary">{gnf(o.total)}</span>
            {o.recurrence !== 'NONE' && (
              <Button size="sm" variant="ghost" onClick={() => stop.mutate(o.id)}>
                Arrêter la récurrence
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function Team({ company }: { company: Company }) {
  const client = useQueryClient()
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const refresh = () => client.invalidateQueries({ queryKey: ['company', company.id] })
  const add = useMutation({
    mutationFn: () => post(`/companies/${company.id}/employees`, { email, department: department || undefined, position: position || undefined }),
    onSuccess: () => {
      toast.success('Employé ajouté')
      setEmail('')
      setDepartment('')
      setPosition('')
      void refresh()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const remove = useMutation({
    mutationFn: (userId: string) => del(`/companies/${company.id}/employees/${userId}`),
    onSuccess: () => void refresh(),
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line">
        {company.employees?.map((e) => (
          <li key={e.userId} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">
                {e.user.firstName} {e.user.lastName} {e.userId === company.adminId && <Badge tone="accent">Responsable</Badge>}
              </p>
              <p className="text-sm text-muted">
                {e.user.email}
                {e.position && ` · ${e.position}`}
                {e.department && ` · ${e.department}`}
              </p>
            </div>
            {e.userId !== company.adminId && (
              <button type="button" onClick={() => remove.mutate(e.userId)} className="rounded-full p-2 text-muted hover:text-danger" aria-label={`Retirer ${e.user.firstName}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          add.mutate()
        }}
      >
        <Card className="space-y-4 p-6">
          <h3 className="font-sans text-lg font-semibold">Ajouter un employé</h3>
          <p className="text-sm text-muted">L’employé doit déjà avoir un compte Maison Braise.</p>
          <Field label="E-mail">{(p) => <Input {...p} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
          <Field label="Service">{(p) => <Input {...p} value={department} onChange={(e) => setDepartment(e.target.value)} />}</Field>
          <Field label="Poste">{(p) => <Input {...p} value={position} onChange={(e) => setPosition(e.target.value)} />}</Field>
          <Button type="submit" loading={add.isPending}>
            <UserPlus className="h-4 w-4" /> Ajouter
          </Button>
        </Card>
      </form>
    </div>
  )
}

function Invoices({ companyId }: { companyId: string }) {
  const client = useQueryClient()
  const { data } = useQuery({ queryKey: ['company-invoices', companyId], queryFn: () => get<CorporateInvoice[]>(`/companies/${companyId}/invoices`) })
  const now = new Date()
  const [start, setStart] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10))
  const [end, setEnd] = useState(now.toISOString().slice(0, 10))
  const generate = useMutation({
    mutationFn: () => post(`/companies/${companyId}/invoices`, { periodStart: `${start}T00:00:00Z`, periodEnd: `${end}T23:59:59Z` }),
    onSuccess: () => {
      toast.success('Facture générée')
      void client.invalidateQueries({ queryKey: ['company-invoices', companyId] })
      void client.invalidateQueries({ queryKey: ['company', companyId] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-end gap-4 p-5">
        <Field label="Du">{(p) => <Input {...p} type="date" value={start} onChange={(e) => setStart(e.target.value)} />}</Field>
        <Field label="Au">{(p) => <Input {...p} type="date" value={end} onChange={(e) => setEnd(e.target.value)} />}</Field>
        <Button onClick={() => generate.mutate()} loading={generate.isPending}>
          <FileText className="h-4 w-4" /> Générer la facture
        </Button>
      </Card>
      {!data ? (
        <PageLoader />
      ) : data.length === 0 ? (
        <EmptyState title="Aucune facture" />
      ) : (
        <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line">
          {data.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-semibold">{inv.number}</p>
                <p className="text-sm text-muted">
                  {formatDate(inv.periodStart)} → {formatDate(inv.periodEnd)} · échéance {formatDate(inv.dueDate)}
                </p>
              </div>
              <Badge tone={inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'danger' : 'accent'}>{INVOICE_STATUS[inv.status]}</Badge>
              <span className="tabular font-semibold">{gnf(inv.total)}</span>
              <Button size="sm" variant="secondary" onClick={() => void downloadInvoice(inv)}>
                <Download className="h-4 w-4" /> PDF
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
