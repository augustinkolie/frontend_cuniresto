'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminHeader, Table, Td } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Dialog, ResponsiveDrawer } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/field'
import { Badge, Tabs } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { errorMessage, get, patch, post, put } from '@/lib/api'
import { formatDate, gnf } from '@/lib/format'
import { downloadInvoice } from '@/lib/pdf'
import type { Company, CorporateInvoice, CorporateOrder, CursorPage, Dish } from '@/lib/types'

const STATUS = { ACTIVE: 'Actif', SUSPENDED: 'Suspendu', INACTIVE: 'Inactif' } as const

export default function CompaniesAdminPage() {
  const client = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', street: '', city: 'Conakry', adminEmail: '', discountPercent: 10, paymentTermsDays: 30 })
  const companies = useQuery({ queryKey: ['admin', 'companies'], queryFn: () => get<Company[]>('/companies') })

  const create = useMutation({
    mutationFn: () => post('/admin/companies', { ...form, street: form.street || undefined }),
    onSuccess: () => {
      toast.success('Entreprise créée')
      setCreating(false)
      void client.invalidateQueries({ queryKey: ['admin', 'companies'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <div>
      <AdminHeader
        title="Entreprises"
        description="Comptes B2B : remises, tarifs négociés, commandes récurrentes et facturation."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Nouvelle entreprise
          </Button>
        }
      />
      {!companies.data ? (
        <PageLoader />
      ) : (
        <Table head={['Entreprise', 'Responsable', 'Remise', 'Employés', 'Solde', 'Statut']}>
          {companies.data.map((c) => (
            <tr key={c.id} onClick={() => setSelected(c.id)} className="cursor-pointer hover:bg-text/5">
              <Td className="font-semibold">
                {c.name}
                <span className="block text-xs font-normal text-muted">{c.email}</span>
              </Td>
              <Td>
                {c.admin.firstName} {c.admin.lastName}
              </Td>
              <Td className="tabular">{c.discountPercent} %</Td>
              <Td className="tabular">{c._count?.employees ?? 0}</Td>
              <Td className="tabular">{gnf(c.currentBalance)}</Td>
              <Td>
                <Badge tone={c.status === 'ACTIVE' ? 'success' : 'danger'}>{STATUS[c.status]}</Badge>
              </Td>
            </tr>
          ))}
          {companies.data.length === 0 && (
            <tr>
              <Td colSpan={6} className="py-10 text-center text-muted">
                Aucune entreprise
              </Td>
            </tr>
          )}
        </Table>
      )}

      <Dialog open={creating} onClose={() => setCreating(false)} title="Nouvelle entreprise">
        <form
          className="grid gap-4 p-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate()
          }}
        >
          <Field label="Raison sociale" className="sm:col-span-2">{(p) => <Input {...p} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}</Field>
          <Field label="E-mail de facturation">{(p) => <Input {...p} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}</Field>
          <Field label="Téléphone">{(p) => <Input {...p} type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />}</Field>
          <Field label="Adresse">{(p) => <Input {...p} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />}</Field>
          <Field label="Ville">{(p) => <Input {...p} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />}</Field>
          <Field label="E-mail du compte responsable" hint="Il doit déjà avoir un compte client" className="sm:col-span-2">
            {(p) => <Input {...p} type="email" required value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />}
          </Field>
          <Field label="Remise (%)">{(p) => <Input {...p} type="number" min={0} max={80} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} />}</Field>
          <Field label="Délai de paiement (jours)">{(p) => <Input {...p} type="number" min={0} value={form.paymentTermsDays} onChange={(e) => setForm({ ...form, paymentTermsDays: Number(e.target.value) })} />}</Field>
          <Button type="submit" className="sm:col-span-2" loading={create.isPending}>
            Créer
          </Button>
        </form>
      </Dialog>

      <ResponsiveDrawer open={!!selected} onClose={() => setSelected(null)} title="Compte entreprise">
        {selected && <CompanyDetail id={selected} />}
      </ResponsiveDrawer>
    </div>
  )
}

function CompanyDetail({ id }: { id: string }) {
  const client = useQueryClient()
  const [tab, setTab] = useState<'terms' | 'prices' | 'orders' | 'invoices'>('terms')
  const company = useQuery({ queryKey: ['company', id], queryFn: () => get<Company>(`/companies/${id}`) })
  const orders = useQuery({ queryKey: ['company-orders', id], queryFn: () => get<CorporateOrder[]>(`/companies/${id}/orders`), enabled: tab === 'orders' })
  const invoices = useQuery({ queryKey: ['company-invoices', id], queryFn: () => get<CorporateInvoice[]>(`/companies/${id}/invoices`), enabled: tab === 'invoices' })
  const dishes = useQuery({ queryKey: ['admin', 'dishes'], queryFn: () => get<CursorPage<Dish>>('/dishes', { limit: 100, includeUnavailable: true }), enabled: tab === 'prices' })
  const [prices, setPrices] = useState<Record<string, number>>({})
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['company', id] })
    void client.invalidateQueries({ queryKey: ['admin', 'companies'] })
  }

  const update = useMutation({ mutationFn: (body: Partial<Company>) => patch(`/companies/${id}`, body), onSuccess: () => (toast.success('Enregistré'), refresh()), onError: (e) => toast.error(errorMessage(e)) })
  const savePrices = useMutation({
    mutationFn: () => {
      const current = Object.fromEntries((company.data?.prices ?? []).map((p) => [p.dishId, p.price]))
      const merged = { ...current, ...prices }
      return put(`/admin/companies/${id}/prices`, { prices: Object.entries(merged).filter(([, v]) => v > 0).map(([dishId, price]) => ({ dishId, price })) })
    },
    onSuccess: () => (toast.success('Tarifs enregistrés'), refresh()),
  })
  const orderStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: CorporateOrder['status'] }) => patch(`/admin/companies/orders/${orderId}/status`, { status }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['company-orders', id] }),
    onError: (e) => toast.error(errorMessage(e)),
  })
  const invoiceStatus = useMutation({
    mutationFn: ({ invoiceId, status }: { invoiceId: string; status: CorporateInvoice['status'] }) => patch(`/admin/companies/invoices/${invoiceId}/status`, { status }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['company-invoices', id] })
      refresh()
    },
  })

  const c = company.data
  if (!c) return <PageLoader />
  const custom = Object.fromEntries((c.prices ?? []).map((p) => [p.dishId, p.price]))

  return (
    <div className="space-y-4 p-5">
      <div>
        <p className="text-2xl font-semibold">{c.name}</p>
        <p className="text-sm text-muted">
          {c.email} · {c.phone} · solde {gnf(c.currentBalance)}
        </p>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'terms', label: 'Conditions' },
          { value: 'prices', label: 'Tarifs' },
          { value: 'orders', label: 'Commandes' },
          { value: 'invoices', label: 'Factures' },
        ]}
      />
      {tab === 'terms' && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const data = new FormData(e.currentTarget)
            update.mutate({
              discountPercent: Number(data.get('discount')),
              paymentTermsDays: Number(data.get('terms')),
              status: data.get('status') as Company['status'],
            })
          }}
        >
          <Field label="Remise (%)">{(p) => <Input {...p} name="discount" type="number" min={0} max={80} defaultValue={c.discountPercent} />}</Field>
          <Field label="Délai de paiement (jours)">{(p) => <Input {...p} name="terms" type="number" min={0} defaultValue={c.paymentTermsDays} />}</Field>
          <Field label="Statut">
            {(p) => (
              <Select {...p} name="status" defaultValue={c.status}>
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Button type="submit" loading={update.isPending}>
            Enregistrer
          </Button>
          <div>
            <p className="mb-2 text-sm font-semibold">Employés ({c.employees?.length ?? 0})</p>
            <ul className="text-sm text-muted">
              {c.employees?.map((e) => (
                <li key={e.userId}>
                  {e.user.firstName} {e.user.lastName} — {e.user.email}
                </li>
              ))}
            </ul>
          </div>
        </form>
      )}
      {tab === 'prices' &&
        (!dishes.data ? (
          <PageLoader />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">Prix négocié par plat (laisser vide = remise de {c.discountPercent} %).</p>
            <ul className="divide-y divide-line">
              {dishes.data.items.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="flex-1">{d.name}</span>
                  <span className="tabular text-muted">{gnf(d.price)}</span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    aria-label={`Prix négocié ${d.name}`}
                    defaultValue={custom[d.id] ?? ''}
                    onChange={(e) => setPrices((s) => ({ ...s, [d.id]: Number(e.target.value) }))}
                    className="tabular h-9 w-28 rounded-lg border border-line bg-surface px-2"
                  />
                </li>
              ))}
            </ul>
            <Button onClick={() => savePrices.mutate()} loading={savePrices.isPending}>
              Enregistrer les tarifs
            </Button>
          </div>
        ))}
      {tab === 'orders' &&
        (!orders.data ? (
          <PageLoader />
        ) : (
          <ul className="space-y-2">
            {orders.data.map((o) => (
              <li key={o.id} className="rounded-lg border border-line p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">
                    {formatDate(o.createdAt)} · {o.employee.firstName}
                  </span>
                  <Select aria-label="Statut" className="h-9 w-40" value={o.status} onChange={(e) => orderStatus.mutate({ orderId: o.id, status: e.target.value as CorporateOrder['status'] })}>
                    {['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
                <p className="text-muted">{o.items.map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(', ')}</p>
                <p className="tabular font-semibold">{gnf(o.total)}</p>
              </li>
            ))}
            {orders.data.length === 0 && <p className="text-sm text-muted">Aucune commande.</p>}
          </ul>
        ))}
      {tab === 'invoices' &&
        (!invoices.data ? (
          <PageLoader />
        ) : (
          <ul className="space-y-2">
            {invoices.data.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-3 text-sm">
                <span className="flex-1 font-semibold">
                  {inv.number} · {gnf(inv.total)}
                </span>
                <Select aria-label="Statut de la facture" className="h-9 w-32" value={inv.status} onChange={(e) => invoiceStatus.mutate({ invoiceId: inv.id, status: e.target.value as CorporateInvoice['status'] })}>
                  {['SENT', 'PAID', 'OVERDUE', 'CANCELLED'].map((s) => (
                    <option key={s} value={s}>
                      {{ SENT: 'À payer', PAID: 'Payée', OVERDUE: 'En retard', CANCELLED: 'Annulée' }[s]}
                    </option>
                  ))}
                </Select>
                <Button size="sm" variant="secondary" onClick={() => void downloadInvoice(inv)} aria-label={`Télécharger ${inv.number}`}>
                  <Download className="h-4 w-4" />
                </Button>
              </li>
            ))}
            {invoices.data.length === 0 && <p className="text-sm text-muted">Aucune facture. Le responsable génère ses factures depuis son espace.</p>}
          </ul>
        ))}
    </div>
  )
}
