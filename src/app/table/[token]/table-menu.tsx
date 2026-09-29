'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellRing, Minus, Plus, Search, ShoppingBag } from 'lucide-react'
import Image from '@/components/ui/photo'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Badge, EmptyState } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useSocketEvent } from '@/hooks/use-socket-event'
import { errorMessage, get, post } from '@/lib/api'
import { cn } from '@/lib/cn'
import { gnf } from '@/lib/format'
import { ORDER_STATUS } from '@/lib/labels'
import { getSocket } from '@/lib/socket'
import type { Category, CursorPage, Dish, OrderStatus } from '@/lib/types'

interface TableInfo {
  number: number
  capacity: number
  zone: string
}

interface TableOrder {
  id: string
  number: number
  status: OrderStatus
  total: number
  items: Array<{ name: string; quantity: number }>
}

export function TableMenu({ token }: { token: string }) {
  const client = useQueryClient()
  const [category, setCategory] = useState('tout')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [checkout, setCheckout] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [requests, setRequests] = useState('')

  const table = useQuery({ queryKey: ['table', token], queryFn: () => get<TableInfo>(`/tables/qr/${token}`), retry: false })
  const dishes = useQuery({ queryKey: ['public', 'dishes', 'all'], queryFn: () => get<CursorPage<Dish>>('/dishes', { limit: 100 }) })
  const categories = useQuery({ queryKey: ['public', 'categories'], queryFn: () => get<Category[]>('/categories') })
  const orders = useQuery({
    queryKey: ['table-orders', token],
    queryFn: () => get<TableOrder[]>(`/tables/qr/${token}/orders`),
    enabled: table.isSuccess,
  })

  // Suivi en direct : le jeton du QR code donne accès aux commandes de cette table uniquement.
  useEffect(() => {
    const socket = getSocket()
    const join = () => socket.emit('table:join', token)
    socket.on('connect', join)
    if (socket.connected) join()
    else socket.connect()
    return () => {
      socket.off('connect', join)
    }
  }, [token])
  useSocketEvent('order:updated', () => void client.invalidateQueries({ queryKey: ['table-orders', token] }))

  const list = dishes.data?.items ?? []
  const byId = useMemo(() => new Map(list.map((d) => [d.id, d])), [list])
  const shown = list.filter(
    (d) =>
      (category === 'tout' || d.category.slug === category) &&
      (!search || d.name.toLowerCase().includes(search.toLowerCase())),
  )
  const lines = Object.entries(cart).filter(([, q]) => q > 0)
  const total = lines.reduce((sum, [id, q]) => sum + (byId.get(id)?.price ?? 0) * q, 0)
  const count = lines.reduce((sum, [, q]) => sum + q, 0)
  const setQty = (id: string, q: number) => setCart((c) => ({ ...c, [id]: Math.max(0, Math.min(50, q)) }))

  const place = useMutation({
    mutationFn: () =>
      post<{ number: number }>(`/tables/qr/${token}/orders`, {
        items: lines.map(([dishId, quantity]) => ({ dishId, quantity })),
        customerName: name || undefined,
        customerPhone: phone || undefined,
        specialRequests: requests || undefined,
      }),
    onSuccess: (r) => {
      toast.success(`Commande n° ${r.number} envoyée en cuisine !`)
      setCart({})
      setCheckout(false)
      void client.invalidateQueries({ queryKey: ['table-orders', token] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const callWaiter = useMutation({
    mutationFn: () => post<{ alreadyCalled: boolean }>(`/tables/qr/${token}/call-waiter`),
    onSuccess: (r) => toast.success(r.alreadyCalled ? 'Un serveur a déjà été appelé, il arrive.' : 'Un serveur arrive à votre table.'),
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (table.isLoading) return <PageLoader />
  if (table.isError || !table.data) {
    return (
      <div className="px-4 pt-24">
        <EmptyState title="QR code non reconnu">Demandez à un serveur de vous aider ou scannez à nouveau le QR code de votre table.</EmptyState>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32">
      <header className="sticky top-0 z-30 -mx-4 flex items-center justify-between gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <Logo />
        <div className="flex items-center gap-2">
          <Badge tone="accent" className="text-sm">
            Table {table.data.number}
          </Badge>
          <Button size="sm" variant="secondary" onClick={() => callWaiter.mutate()} loading={callWaiter.isPending}>
            <BellRing className="h-4 w-4" /> Serveur
          </Button>
        </div>
      </header>

      {orders.data && orders.data.length > 0 && (
        <section className="mt-5 space-y-2" aria-label="Vos commandes en cours">
          {orders.data.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-line bg-surface p-3 text-sm">
              <div>
                <p className="font-semibold">Commande n° {o.number}</p>
                <p className="text-muted">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
              </div>
              <Badge tone={o.status === 'READY' || o.status === 'SERVED' ? 'success' : 'accent'}>{ORDER_STATUS[o.status]}</Badge>
            </div>
          ))}
        </section>
      )}

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
        <label htmlFor="table-search" className="sr-only">
          Rechercher
        </label>
        <input
          id="table-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un plat"
          className="h-12 w-full rounded-[var(--radius-control)] border border-line bg-surface pl-12 pr-4 focus:border-primary focus:outline-none"
        />
      </div>
      <nav className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4" aria-label="Catégories">
        {[{ slug: 'tout', name: 'Tout' }, ...(categories.data ?? [])].map((c) => (
          <button
            key={c.slug}
            type="button"
            aria-pressed={category === c.slug}
            onClick={() => setCategory(c.slug)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold',
              category === c.slug ? 'border-primary bg-primary text-on-primary' : 'border-line text-muted',
            )}
          >
            {c.name}
          </button>
        ))}
      </nav>

      <ul className="mt-5 divide-y divide-line">
        {shown.map((d) => (
          <li key={d.id} className="flex gap-4 py-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
              <Image src={d.imageUrl} alt={d.imageAlt} fill sizes="80px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{d.name}</p>
              <p className="line-clamp-2 text-sm text-muted">{d.description}</p>
              <p className="tabular mt-1 font-semibold text-primary">{gnf(d.price)}</p>
            </div>
            <div className="flex items-center gap-1 self-center">
              {cart[d.id] ? (
                <>
                  <button type="button" onClick={() => setQty(d.id, (cart[d.id] ?? 0) - 1)} className="rounded-full border border-line p-2" aria-label={`Retirer un ${d.name}`}>
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="tabular w-6 text-center font-semibold">{cart[d.id]}</span>
                </>
              ) : null}
              <button type="button" onClick={() => setQty(d.id, (cart[d.id] ?? 0) + 1)} className="rounded-full bg-primary p-2 text-on-primary" aria-label={`Ajouter ${d.name}`}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 p-4 backdrop-blur">
          <Button className="mx-auto flex w-full max-w-3xl" onClick={() => setCheckout(true)}>
            <ShoppingBag className="h-5 w-5" /> Commander {count} article{count > 1 ? 's' : ''} · {gnf(total)}
          </Button>
        </div>
      )}

      <Dialog open={checkout} onClose={() => setCheckout(false)} title={`Commande — table ${table.data.number}`} variant="sheet">
        <form
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault()
            place.mutate()
          }}
        >
          <ul className="space-y-1 text-sm">
            {lines.map(([id, q]) => (
              <li key={id} className="flex justify-between">
                <span>
                  {q} × {byId.get(id)?.name}
                </span>
                <span className="tabular">{gnf((byId.get(id)?.price ?? 0) * q)}</span>
              </li>
            ))}
          </ul>
          <Field label="Votre prénom (facultatif)">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />}</Field>
          <Field label="Téléphone (facultatif)" hint="Pour cumuler vos points de fidélité si vous avez un compte">
            {(p) => <Input {...p} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />}
          </Field>
          <Field label="Demandes particulières">{(p) => <Textarea {...p} rows={2} value={requests} onChange={(e) => setRequests(e.target.value)} maxLength={500} />}</Field>
          <div className="flex items-center justify-between border-t border-line pt-4">
            <span className="tabular text-xl font-semibold text-primary">{gnf(total)}</span>
            <Button type="submit" loading={place.isPending}>
              Envoyer en cuisine
            </Button>
          </div>
          <p className="text-center text-xs text-muted">Vous réglez l’addition auprès du serveur.</p>
        </form>
      </Dialog>
    </div>
  )
}
