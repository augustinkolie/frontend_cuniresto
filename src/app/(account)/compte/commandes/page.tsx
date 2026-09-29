'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { ChevronRight, Receipt } from 'lucide-react'
import Link from 'next/link'
import { Button, LinkButton } from '@/components/ui/button'
import { Badge, EmptyState } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { get } from '@/lib/api'
import { formatDateTime, gnf } from '@/lib/format'
import { ORDER_STATUS, ORDER_TYPE } from '@/lib/labels'
import type { CursorPage, Order } from '@/lib/types'

export default function MyOrdersPage() {
  const query = useInfiniteQuery({
    queryKey: ['orders', 'mine'],
    queryFn: ({ pageParam }) => get<CursorPage<Order>>('/orders/me', { cursor: pageParam, limit: 10 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
  const orders = query.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <div>
      <h1 className="mb-6 text-[36px] font-semibold">Mes commandes</h1>
      {query.isLoading ? (
        <PageLoader />
      ) : orders.length === 0 ? (
        <EmptyState icon={<Receipt className="h-10 w-10" />} title="Aucune commande" action={<LinkButton href="/carte">Commander</LinkButton>}>
          Vos commandes et leur suivi apparaîtront ici.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/commande/${o.id}`} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:border-primary/50">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">Commande n° {o.number}</p>
                    <Badge tone={o.status === 'CANCELLED' ? 'danger' : ['DELIVERED', 'COMPLETED', 'SERVED'].includes(o.status) ? 'success' : 'accent'}>
                      {ORDER_STATUS[o.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted">
                    {ORDER_TYPE[o.type]} · {formatDateTime(o.createdAt)}
                  </p>
                  <p className="truncate text-sm text-muted">{o.items.map((i) => `${i.quantity} × ${i.nameSnapshot}`).join(', ')}</p>
                </div>
                <span className="tabular font-semibold">{gnf(o.total)}</span>
                <ChevronRight className="h-5 w-5 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {query.hasNextPage && (
        <Button variant="secondary" className="mt-6" loading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
          Plus de commandes
        </Button>
      )}
    </div>
  )
}
