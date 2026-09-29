'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminHeader, StatCard, Table, Td } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field'
import { Badge, Tabs } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { del, errorMessage, get, patch, post } from '@/lib/api'
import { formatDate, gnf } from '@/lib/format'
import { LEVEL } from '@/lib/labels'
import type { LoyaltyLevel, Reward } from '@/lib/types'

interface Stats {
  accounts: number
  pointsIssued: number
  pointsUsed: number
  referrals: number
  completedReferrals: number
  pendingCashback: { count: number; amount: number }
  byLevel: Partial<Record<LoyaltyLevel, number>>
}

interface AdminReferral {
  id: string
  code: string
  status: 'PENDING' | 'COMPLETED'
  createdAt: string
  referrer: { firstName: string; lastName: string; email: string }
  referred: { firstName: string; lastName: string; email: string }
}

interface AdminCashback {
  id: string
  amount: number
  points: number
  phone: string
  status: 'PENDING' | 'PAID' | 'REJECTED'
  createdAt: string
  user: { firstName: string; lastName: string; email: string }
}

const TYPES = { DISCOUNT: 'Réduction', FREE_ITEM: 'Article offert', CASHBACK: 'Cashback', VOUCHER: 'Bon d’achat' }
const emptyReward = { name: '', description: '', pointsCost: 100, type: 'FREE_ITEM' as Reward['type'], value: 0, valueType: 'FIXED' as Reward['valueType'], minLevel: 'BRONZE' as LoyaltyLevel, stock: '' as number | '', isActive: true }

export default function LoyaltyAdminPage() {
  const client = useQueryClient()
  const [tab, setTab] = useState<'cashback' | 'rewards' | 'referrals'>('cashback')
  const [editing, setEditing] = useState<Reward | 'new' | null>(null)
  const [form, setForm] = useState(emptyReward)

  const stats = useQuery({ queryKey: ['admin', 'loyalty', 'stats'], queryFn: () => get<Stats>('/admin/loyalty/statistics') })
  const cashback = useQuery({ queryKey: ['admin', 'loyalty', 'cashback'], queryFn: () => get<AdminCashback[]>('/admin/loyalty/cashback'), enabled: tab === 'cashback' })
  const rewards = useQuery({ queryKey: ['admin', 'loyalty', 'rewards'], queryFn: () => get<Reward[]>('/admin/loyalty/rewards'), enabled: tab === 'rewards' })
  const referrals = useQuery({ queryKey: ['admin', 'loyalty', 'referrals'], queryFn: () => get<AdminReferral[]>('/admin/loyalty/referrals'), enabled: tab === 'referrals' })
  const refresh = () => void client.invalidateQueries({ queryKey: ['admin', 'loyalty'] })

  const settle = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'PAID' | 'REJECTED' }) => patch(`/admin/loyalty/cashback/${id}`, { status }),
    onSuccess: (_d, v) => (toast.success(v.status === 'PAID' ? 'Cashback marqué comme versé' : 'Refusé : points restitués'), refresh()),
    onError: (e) => toast.error(errorMessage(e)),
  })
  const saveReward = useMutation({
    mutationFn: () => {
      const body = { ...form, stock: form.stock === '' ? null : Number(form.stock) }
      return editing === 'new' || !editing ? post('/admin/loyalty/rewards', body) : patch(`/admin/loyalty/rewards/${editing.id}`, body)
    },
    onSuccess: () => {
      setEditing(null)
      refresh()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const removeReward = useMutation({ mutationFn: (id: string) => del(`/admin/loyalty/rewards/${id}`), onSuccess: refresh })

  const open = (r: Reward | 'new') => {
    setEditing(r)
    setForm(r === 'new' ? emptyReward : { name: r.name, description: r.description, pointsCost: r.pointsCost, type: r.type, value: r.value, valueType: r.valueType, minLevel: r.minLevel, stock: r.stock ?? '', isActive: r.isActive })
  }

  const s = stats.data

  return (
    <div>
      <AdminHeader title="Fidélité & parrainage" />
      {s && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Comptes fidélité" value={s.accounts} hint={Object.entries(s.byLevel).map(([k, v]) => `${LEVEL[k as LoyaltyLevel]} ${v}`).join(' · ')} />
          <StatCard label="Points distribués" value={s.pointsIssued.toLocaleString('fr-FR')} hint={`${s.pointsUsed.toLocaleString('fr-FR')} utilisés`} />
          <StatCard label="Parrainages" value={s.referrals} hint={`${s.completedReferrals} validés`} />
          <StatCard label="Cashback à verser" value={gnf(s.pendingCashback.amount)} tone={s.pendingCashback.count ? 'danger' : 'neutral'} hint={`${s.pendingCashback.count} demande(s)`} />
        </div>
      )}
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'cashback', label: 'Cashback' },
          { value: 'rewards', label: 'Récompenses' },
          { value: 'referrals', label: 'Parrainages' },
        ]}
      />
      {tab === 'cashback' &&
        (!cashback.data ? (
          <PageLoader />
        ) : (
          <Table head={['Date', 'Client', 'Orange Money', 'Montant', 'Statut', '']}>
            {cashback.data.map((c) => (
              <tr key={c.id}>
                <Td>{formatDate(c.createdAt)}</Td>
                <Td>
                  {c.user.firstName} {c.user.lastName}
                  <span className="block text-xs text-muted">{c.user.email}</span>
                </Td>
                <Td className="tabular">{c.phone}</Td>
                <Td className="tabular font-semibold">
                  {gnf(c.amount)} <span className="block text-xs font-normal text-muted">{c.points} pts</span>
                </Td>
                <Td>
                  <Badge tone={c.status === 'PAID' ? 'success' : c.status === 'REJECTED' ? 'danger' : 'accent'}>{{ PENDING: 'À verser', PAID: 'Versé', REJECTED: 'Refusé' }[c.status]}</Badge>
                </Td>
                <Td>
                  {c.status === 'PENDING' && (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => settle.mutate({ id: c.id, status: 'PAID' })}>
                        Versé
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => settle.mutate({ id: c.id, status: 'REJECTED' })}>
                        Refuser
                      </Button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
            {cashback.data.length === 0 && (
              <tr>
                <Td colSpan={6} className="py-10 text-center text-muted">
                  Aucune demande
                </Td>
              </tr>
            )}
          </Table>
        ))}
      {tab === 'rewards' &&
        (!rewards.data ? (
          <PageLoader />
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <Button onClick={() => open('new')}>
                <Plus className="h-4 w-4" /> Nouvelle récompense
              </Button>
            </div>
            <Table head={['Récompense', 'Type', 'Coût', 'Niveau', 'Utilisée', 'Active', '']}>
              {rewards.data.map((r) => (
                <tr key={r.id}>
                  <Td className="font-semibold">{r.name}</Td>
                  <Td>{TYPES[r.type]}</Td>
                  <Td className="tabular">{r.pointsCost} pts</Td>
                  <Td>{LEVEL[r.minLevel]}</Td>
                  <Td className="tabular">
                    {r.used}
                    {r.stock !== null && ` / ${r.stock}`}
                  </Td>
                  <Td>{r.isActive ? 'Oui' : 'Non'}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => open(r)} className="rounded-full p-2 hover:bg-text/10" aria-label={`Modifier ${r.name}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => removeReward.mutate(r.id)} className="rounded-full p-2 text-danger hover:bg-danger/10" aria-label={`Désactiver ${r.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          </>
        ))}
      {tab === 'referrals' &&
        (!referrals.data ? (
          <PageLoader />
        ) : (
          <Table head={['Date', 'Parrain', 'Filleul', 'Code', 'Statut']}>
            {referrals.data.map((r) => (
              <tr key={r.id}>
                <Td>{formatDate(r.createdAt)}</Td>
                <Td>
                  {r.referrer.firstName} {r.referrer.lastName}
                </Td>
                <Td>
                  {r.referred.firstName} {r.referred.lastName}
                </Td>
                <Td className="font-mono">{r.code}</Td>
                <Td>
                  <Badge tone={r.status === 'COMPLETED' ? 'success' : 'accent'}>{r.status === 'COMPLETED' ? 'Validé' : 'En attente'}</Badge>
                </Td>
              </tr>
            ))}
          </Table>
        ))}

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nouvelle récompense' : 'Modifier la récompense'}>
        <form
          className="grid gap-4 p-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            saveReward.mutate()
          }}
        >
          <Field label="Nom" className="sm:col-span-2">{(p) => <Input {...p} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}</Field>
          <Field label="Description" className="sm:col-span-2">{(p) => <Textarea {...p} rows={2} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}</Field>
          <Field label="Coût (points)">{(p) => <Input {...p} type="number" min={1} value={form.pointsCost} onChange={(e) => setForm({ ...form, pointsCost: Number(e.target.value) })} />}</Field>
          <Field label="Type">
            {(p) => (
              <Select {...p} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Reward['type'] })}>
                {Object.entries(TYPES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Valeur">{(p) => <Input {...p} type="number" min={0} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />}</Field>
          <Field label="Unité">
            {(p) => (
              <Select {...p} value={form.valueType} onChange={(e) => setForm({ ...form, valueType: e.target.value as Reward['valueType'] })}>
                <option value="FIXED">GNF</option>
                <option value="PERCENTAGE">%</option>
                <option value="POINTS">points</option>
              </Select>
            )}
          </Field>
          <Field label="Niveau minimum">
            {(p) => (
              <Select {...p} value={form.minLevel} onChange={(e) => setForm({ ...form, minLevel: e.target.value as LoyaltyLevel })}>
                {Object.entries(LEVEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Stock (vide = illimité)">{(p) => <Input {...p} type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value === '' ? '' : Number(e.target.value) })} />}</Field>
          <Checkbox className="sm:col-span-2" label="Active" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          <Button type="submit" className="sm:col-span-2" loading={saveReward.isPending}>
            Enregistrer
          </Button>
        </form>
      </Dialog>
    </div>
  )
}
