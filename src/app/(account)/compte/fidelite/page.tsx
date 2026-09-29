'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Gift, Lock, Share2, Smartphone, Ticket, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/field'
import { Badge, Card, EmptyState, Tabs } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useSession } from '@/hooks/use-session'
import { errorMessage, get, post } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatDate, gnf, timeAgo } from '@/lib/format'
import { LEVEL } from '@/lib/labels'
import type { LoyaltyAccount, LoyaltyLevel, LoyaltyTransaction, Reward } from '@/lib/types'

const LEVEL_STYLE: Record<LoyaltyLevel, string> = {
  BRONZE: 'from-[#8a5a3b] to-[#5c3a26]',
  SILVER: 'from-[#9aa3ab] to-[#5f676e]',
  GOLD: 'from-[#f2a541] to-[#b8721b]',
  PLATINUM: 'from-[#7b6cf0] to-[#3d2f9e]',
}

interface ReferralInfo {
  code: string
  total: number
  completed: number
  pointsEarned: number
  referredBy: { status: string; referrer: { firstName: string; lastName: string } } | null
  referrals: Array<{ id: string; status: string; createdAt: string; referred: { firstName: string; lastName: string } }>
}

interface Redemption {
  id: string
  code: string
  usedAt: string | null
  createdAt: string
  reward: { name: string }
}

interface Cashback {
  id: string
  amount: number
  points: number
  status: 'PENDING' | 'PAID' | 'REJECTED'
  createdAt: string
}

export default function LoyaltyPage() {
  const { user } = useSession()
  const client = useQueryClient()
  const [tab, setTab] = useState<'rewards' | 'history' | 'referral' | 'cashback'>('rewards')
  const account = useQuery({ queryKey: ['loyalty'], queryFn: () => get<LoyaltyAccount>('/loyalty') })
  const refresh = () => client.invalidateQueries({ queryKey: ['loyalty'] })

  if (!account.data) return <PageLoader />
  const a = account.data

  return (
    <div className="space-y-8">
      <h1 className="text-[36px] font-semibold">Fidélité</h1>
      <div className={cn('relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br p-6 text-white', LEVEL_STYLE[a.level])}>
        <p className="text-sm font-semibold uppercase tracking-widest opacity-80">Niveau {LEVEL[a.level]}</p>
        <p className="tabular mt-2 font-display text-5xl">{a.availablePoints.toLocaleString('fr-FR')} pts</p>
        <p className="mt-1 text-sm opacity-80">
          {a.totalPoints.toLocaleString('fr-FR')} points cumulés · {a.usedPoints.toLocaleString('fr-FR')} utilisés
        </p>
        {a.nextLevel && (
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-sm">
              <span>Prochain niveau : {LEVEL[a.nextLevel.level]}</span>
              <span className="tabular">{(a.nextLevel.minPoints - a.totalPoints).toLocaleString('fr-FR')} pts restants</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={a.progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-white" style={{ width: `${a.progress}%` }} />
            </div>
          </div>
        )}
        <Gift className="absolute -right-6 -top-6 h-40 w-40 opacity-10" aria-hidden />
      </div>

      <Card className="grid gap-4 p-5 text-sm sm:grid-cols-3">
        <p>
          <strong className="block text-base">10 pts par commande</strong>
          <span className="text-muted">+ 1 point par tranche de 1 000 GNF</span>
        </p>
        <p>
          <strong className="block text-base">500 pts par filleul</strong>
          <span className="text-muted">300 pts offerts à votre filleul</span>
        </p>
        <p>
          <strong className="block text-base">1 pt = 10 GNF</strong>
          <span className="text-muted">en cashback Orange Money</span>
        </p>
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'rewards', label: 'Récompenses' },
          { value: 'history', label: 'Historique' },
          { value: 'referral', label: 'Parrainage' },
          { value: 'cashback', label: 'Cashback' },
        ]}
      />
      {tab === 'rewards' && <Rewards available={a.availablePoints} onChange={refresh} />}
      {tab === 'history' && <History />}
      {tab === 'referral' && <Referral />}
      {tab === 'cashback' && <CashbackPanel available={a.availablePoints} defaultPhone={user?.orangeMoneyNumber ?? user?.phone ?? ''} onChange={refresh} />}
    </div>
  )
}

function Rewards({ available, onChange }: { available: number; onChange: () => void }) {
  const client = useQueryClient()
  const rewards = useQuery({ queryKey: ['loyalty', 'rewards'], queryFn: () => get<Reward[]>('/loyalty/rewards') })
  const redemptions = useQuery({ queryKey: ['loyalty', 'redemptions'], queryFn: () => get<Redemption[]>('/loyalty/redemptions') })
  const [code, setCode] = useState<Redemption | null>(null)
  const redeem = useMutation({
    mutationFn: (id: string) => post<Redemption>(`/loyalty/rewards/${id}/redeem`),
    onSuccess: (r) => {
      setCode(r)
      void client.invalidateQueries({ queryKey: ['loyalty'] })
      onChange()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (!rewards.data) return <PageLoader />
  return (
    <div className="space-y-8">
      <ul className="grid gap-4 sm:grid-cols-2">
        {rewards.data.map((r) => {
          const locked = !r.levelOk
          return (
            <li key={r.id} className={cn('flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5', (locked || r.soldOut) && 'opacity-60')}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{r.name}</p>
                {r.minLevel !== 'BRONZE' && <Badge tone="accent">{LEVEL[r.minLevel]}+</Badge>}
              </div>
              <p className="mt-1 flex-1 text-sm text-muted">{r.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="tabular font-semibold text-primary">{r.pointsCost} pts</span>
                <Button
                  size="sm"
                  disabled={locked || r.soldOut || available < r.pointsCost}
                  loading={redeem.isPending && redeem.variables === r.id}
                  onClick={() => redeem.mutate(r.id)}
                >
                  {locked ? <Lock className="h-4 w-4" /> : null}
                  {r.soldOut ? 'Épuisée' : locked ? 'Verrouillée' : available < r.pointsCost ? `Encore ${r.pointsCost - available} pts` : 'Échanger'}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
      {redemptions.data && redemptions.data.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-medium">Mes bons</h2>
          <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line">
            {redemptions.data.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{r.reward.name}</p>
                  <p className="text-sm text-muted">Obtenu {timeAgo(r.createdAt)}</p>
                </div>
                <span className={cn('tabular rounded-lg border border-dashed px-3 py-1 font-mono', r.usedAt ? 'border-line text-muted line-through' : 'border-accent text-accent')}>
                  {r.code}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Dialog open={!!code} onClose={() => setCode(null)} title="Récompense obtenue">
        {code && (
          <div className="space-y-4 p-6 text-center">
            <Ticket className="mx-auto h-12 w-12 text-accent" />
            <p>
              Présentez ce code en caisse ou indiquez-le dans les instructions de votre prochaine commande pour profiter de{' '}
              <strong>{code.reward.name}</strong>.
            </p>
            <p className="tabular rounded-xl border-2 border-dashed border-accent py-4 font-mono text-3xl text-accent">{code.code}</p>
          </div>
        )}
      </Dialog>
    </div>
  )
}

function History() {
  const { data } = useQuery({ queryKey: ['loyalty', 'transactions'], queryFn: () => get<LoyaltyTransaction[]>('/loyalty/transactions') })
  if (!data) return <PageLoader />
  if (data.length === 0) return <EmptyState title="Pas encore de points">Passez votre première commande pour commencer à cumuler.</EmptyState>
  return (
    <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line">
      {data.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold">{t.description}</p>
            <p className="text-sm text-muted">{formatDate(t.createdAt)}</p>
          </div>
          <span className={cn('tabular font-semibold', t.points > 0 ? 'text-success' : 'text-danger')}>
            {t.points > 0 ? '+' : ''}
            {t.points} pts
          </span>
        </li>
      ))}
    </ul>
  )
}

function Referral() {
  const client = useQueryClient()
  const { data } = useQuery({ queryKey: ['loyalty', 'referral'], queryFn: () => get<ReferralInfo>('/loyalty/referral') })
  const [code, setCode] = useState('')
  const use = useMutation({
    mutationFn: () => post('/loyalty/referral', { code }),
    onSuccess: () => {
      toast.success('Code enregistré : 300 points après votre première commande !')
      void client.invalidateQueries({ queryKey: ['loyalty', 'referral'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  if (!data) return <PageLoader />

  const link = typeof window === 'undefined' ? '' : `${window.location.origin}/inscription?parrain=${data.code}`
  const share = async () => {
    const text = `Découvre Maison Braise ! Inscris-toi avec mon code ${data.code} et gagne 300 points : ${link}`
    if (navigator.share) await navigator.share({ title: 'Maison Braise', text, url: link }).catch(() => undefined)
    else {
      await navigator.clipboard.writeText(text)
      toast.success('Invitation copiée')
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6 text-center">
        <p className="text-muted">Votre code de parrainage</p>
        <p className="tabular font-mono text-4xl tracking-widest text-accent">{data.code}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => void navigator.clipboard.writeText(data.code).then(() => toast.success('Code copié'))}>
            <Copy className="h-4 w-4" /> Copier
          </Button>
          <Button size="sm" onClick={() => void share()}>
            <Share2 className="h-4 w-4" /> Inviter
          </Button>
        </div>
        <dl className="tabular grid grid-cols-3 gap-4 border-t border-line pt-4">
          <div>
            <dd className="text-2xl font-semibold">{data.total}</dd>
            <dt className="text-sm text-muted">invités</dt>
          </div>
          <div>
            <dd className="text-2xl font-semibold">{data.completed}</dd>
            <dt className="text-sm text-muted">validés</dt>
          </div>
          <div>
            <dd className="text-2xl font-semibold text-primary">{data.pointsEarned}</dd>
            <dt className="text-sm text-muted">points gagnés</dt>
          </div>
        </dl>
      </Card>
      {data.referredBy ? (
        <p className="text-muted">
          Vous avez été parrainé·e par {data.referredBy.referrer.firstName} ({data.referredBy.status === 'COMPLETED' ? 'bonus versé' : 'bonus après votre première commande'}).
        </p>
      ) : (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            use.mutate()
          }}
        >
          <Field label="Vous avez un code de parrainage ?" className="flex-1">
            {(p) => <Input {...p} className="uppercase" value={code} onChange={(e) => setCode(e.target.value)} minLength={4} required />}
          </Field>
          <Button type="submit" loading={use.isPending}>
            Valider
          </Button>
        </form>
      )}
      {data.referrals.length > 0 && (
        <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line">
          {data.referrals.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 p-4">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted" /> {r.referred.firstName} {r.referred.lastName[0]}.
              </span>
              <Badge tone={r.status === 'COMPLETED' ? 'success' : 'accent'}>{r.status === 'COMPLETED' ? '+500 pts' : 'En attente de commande'}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CashbackPanel({ available, defaultPhone, onChange }: { available: number; defaultPhone: string; onChange: () => void }) {
  const client = useQueryClient()
  const [amount, setAmount] = useState(5000)
  const [phone, setPhone] = useState(defaultPhone)
  const list = useQuery({ queryKey: ['loyalty', 'cashback'], queryFn: () => get<Cashback[]>('/loyalty/cashback') })
  const request = useMutation({
    mutationFn: () => post('/loyalty/cashback', { amount, orangeMoneyNumber: phone }),
    onSuccess: () => {
      toast.success('Demande envoyée : versement sous 48 h')
      void client.invalidateQueries({ queryKey: ['loyalty', 'cashback'] })
      onChange()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const maxAmount = available * 10
  const points = Math.ceil(amount / 10)

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form
          className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault()
            request.mutate()
          }}
        >
          <Field label="Montant (GNF)" hint={`Maximum ${gnf(maxAmount)} · ${points} points`}>
            {(p) => <Input {...p} type="number" min={5000} step={1000} max={maxAmount} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />}
          </Field>
          <Field label="Numéro Orange Money">{(p) => <Input {...p} type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />}</Field>
          <Button type="submit" loading={request.isPending} disabled={amount < 5000 || points > available}>
            <Smartphone className="h-4 w-4" /> Demander
          </Button>
        </form>
      </Card>
      {list.data && list.data.length > 0 && (
        <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line">
          {list.data.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="tabular font-semibold">{gnf(c.amount)}</p>
                <p className="text-sm text-muted">
                  {c.points} pts · {formatDate(c.createdAt)}
                </p>
              </div>
              <Badge tone={c.status === 'PAID' ? 'success' : c.status === 'REJECTED' ? 'danger' : 'accent'}>
                {c.status === 'PAID' ? 'Versé' : c.status === 'REJECTED' ? 'Refusé (points rendus)' : 'En cours'}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
