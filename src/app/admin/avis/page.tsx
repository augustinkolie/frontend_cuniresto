'use client'

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, MessageSquareReply } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminHeader, StatCard } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/field'
import { Avatar, Badge, Card, Stars, Tabs } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useDebounce } from '@/hooks/use-debounce'
import { errorMessage, get, patch, post } from '@/lib/api'
import { cn } from '@/lib/cn'
import { timeAgo } from '@/lib/format'
import type { CursorPage, Review } from '@/lib/types'

interface Stats {
  total: number
  positive: number
  neutral: number
  negative: number
  byDish: Array<{ dish?: { id: string; name: string }; count: number; average: number }>
  complaints: Review[]
}

export default function ReviewsAdminPage() {
  const client = useQueryClient()
  const [tab, setTab] = useState<'list' | 'stats'>('list')
  const [search, setSearch] = useState('')
  const [sentiment, setSentiment] = useState('')
  const [status, setStatus] = useState('')
  const q = useDebounce(search)
  const [replying, setReplying] = useState<string | null>(null)
  const [reply, setReply] = useState('')

  const list = useInfiniteQuery({
    queryKey: ['admin', 'reviews', q, sentiment, status],
    queryFn: ({ pageParam }) => get<CursorPage<Review>>('/admin/reviews', { search: q, sentiment, status, cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: tab === 'list',
  })
  const stats = useQuery({ queryKey: ['admin', 'reviews', 'stats'], queryFn: () => get<Stats>('/admin/reviews/statistics') })
  const refresh = () => void client.invalidateQueries({ queryKey: ['admin', 'reviews'] })

  const moderate = useMutation({ mutationFn: ({ id, status }: { id: string; status: Review['status'] }) => patch(`/admin/reviews/${id}`, { status }), onSuccess: refresh })
  const sendReply = useMutation({
    mutationFn: (id: string) => post(`/reviews/${id}/replies`, { content: reply }),
    onSuccess: () => {
      toast.success('Réponse publiée, le client est notifié')
      setReplying(null)
      setReply('')
      refresh()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const reviews = list.data?.pages.flatMap((p) => p.items) ?? []
  const s = stats.data

  return (
    <div>
      <AdminHeader title="Avis clients" description="Modérez, répondez et suivez la satisfaction par plat." />
      {s && (
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <StatCard label="Avis" value={s.total} />
          <StatCard label="Positifs (4-5★)" value={s.positive} tone="success" />
          <StatCard label="Neutres (3★)" value={s.neutral} />
          <StatCard label="Négatifs (1-2★)" value={s.negative} tone={s.negative ? 'danger' : 'neutral'} />
        </div>
      )}
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'list', label: 'Tous les avis' },
          { value: 'stats', label: 'Par plat & réclamations' },
        ]}
      />
      {tab === 'list' ? (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
            <Input placeholder="Texte, client, plat…" aria-label="Rechercher" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select aria-label="Sentiment" value={sentiment} onChange={(e) => setSentiment(e.target.value)}>
              <option value="">Tous</option>
              <option value="POSITIVE">Positifs</option>
              <option value="NEUTRAL">Neutres</option>
              <option value="NEGATIVE">Négatifs</option>
            </Select>
            <Select aria-label="Visibilité" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Publiés et masqués</option>
              <option value="PUBLISHED">Publiés</option>
              <option value="HIDDEN">Masqués</option>
            </Select>
          </div>
          {list.isLoading ? (
            <PageLoader />
          ) : (
            <ul className="space-y-3">
              {reviews.map((r) => (
                <li key={r.id}>
                  <Card className={cn('p-4', r.status === 'HIDDEN' && 'opacity-60')}>
                    <div className="flex flex-wrap items-start gap-3">
                      <Avatar src={r.user.avatarUrl} firstName={r.user.firstName} lastName={r.user.lastName} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm">
                          <strong>
                            {r.user.firstName} {r.user.lastName}
                          </strong>
                          <Stars value={r.rating} size={13} />
                          <span className="text-muted">sur {r.dish?.name}</span>
                          <span className="text-muted">· {timeAgo(r.createdAt)}</span>
                          {r.status === 'HIDDEN' && <Badge>Masqué</Badge>}
                        </p>
                        <p className="mt-1">{r.comment}</p>
                        {r.replies.map((rep) => (
                          <p key={rep.id} className="mt-2 border-l-2 border-accent pl-3 text-sm text-muted">
                            <strong className="text-text">{rep.author.firstName} :</strong> {rep.content}
                          </p>
                        ))}
                        {replying === r.id && (
                          <form
                            className="mt-3 flex gap-2"
                            onSubmit={(e) => {
                              e.preventDefault()
                              sendReply.mutate(r.id)
                            }}
                          >
                            <Input aria-label="Réponse du restaurant" autoFocus required value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Réponse au nom de Maison Braise" />
                            <Button type="submit" loading={sendReply.isPending}>
                              Publier
                            </Button>
                          </form>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => setReplying(replying === r.id ? null : r.id)} className="rounded-full p-2 hover:bg-text/10" aria-label="Répondre">
                          <MessageSquareReply className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moderate.mutate({ id: r.id, status: r.status === 'HIDDEN' ? 'PUBLISHED' : 'HIDDEN' })}
                          className="rounded-full p-2 hover:bg-text/10"
                          aria-label={r.status === 'HIDDEN' ? 'Publier' : 'Masquer'}
                        >
                          {r.status === 'HIDDEN' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
              {reviews.length === 0 && <p className="py-10 text-center text-muted">Aucun avis</p>}
            </ul>
          )}
          {list.hasNextPage && (
            <Button variant="secondary" className="mt-4" onClick={() => void list.fetchNextPage()} loading={list.isFetchingNextPage}>
              Charger plus
            </Button>
          )}
        </>
      ) : !s ? (
        <PageLoader />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-4 font-sans text-lg font-semibold">Note moyenne par plat</h2>
            <ul className="space-y-2">
              {s.byDish.map((d) => (
                <li key={d.dish?.id} className="flex items-center gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate">{d.dish?.name}</span>
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(d.average / 5) * 100}%` }} />
                  </div>
                  <span className="tabular w-16 text-right">
                    {d.average.toFixed(1)} ({d.count})
                  </span>
                </li>
              ))}
              {s.byDish.length === 0 && <p className="text-sm text-muted">Pas encore d’avis.</p>}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="mb-4 font-sans text-lg font-semibold">Réclamations récentes (1-2★)</h2>
            <ul className="space-y-3">
              {s.complaints.map((r) => (
                <li key={r.id} className="text-sm">
                  <p className="font-semibold">
                    {r.dish?.name} · <Stars value={r.rating} size={12} />
                  </p>
                  <p className="text-muted">
                    « {r.comment} » — {r.user.firstName}, {timeAgo(r.createdAt)}
                  </p>
                </li>
              ))}
              {s.complaints.length === 0 && <p className="text-sm text-muted">Aucune réclamation. 🎉</p>}
            </ul>
          </Card>
        </div>
      )}
    </div>
  )
}
