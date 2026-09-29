'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageSquare, Pencil, Star, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/field'
import { Avatar, Badge, Stars } from '@/components/ui/misc'
import { STAFF_ROLES, useSession } from '@/hooks/use-session'
import { del, errorMessage, get, patch, post } from '@/lib/api'
import { cn } from '@/lib/cn'
import { timeAgo } from '@/lib/format'
import type { CursorPage, Review } from '@/lib/types'

type ReviewPage = CursorPage<Review> & { distribution: Record<string, number> }

function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Votre note">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} étoile${i > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="p-0.5 text-accent"
        >
          <Star className="h-7 w-7" fill={i <= (hover || value) ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}

export function DishReviews({ dishId, dishSlug }: { dishId: string; dishSlug: string }) {
  const { user } = useSession()
  const client = useQueryClient()
  const key = ['reviews', dishId]
  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => get<ReviewPage>(`/dishes/${dishId}/reviews`, { cursor: pageParam, limit: 10 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
  const reviews = query.data?.pages.flatMap((p) => p.items) ?? []
  const distribution = query.data?.pages[0]?.distribution ?? {}
  const mine = user ? reviews.find((r) => r.userId === user.id) : undefined

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [editing, setEditing] = useState(false)
  const refresh = () => client.invalidateQueries({ queryKey: key })

  const save = useMutation({
    mutationFn: () =>
      mine
        ? patch(`/reviews/${mine.id}`, { rating, comment })
        : post(`/dishes/${dishId}/reviews`, { rating, comment }),
    onSuccess: () => {
      toast.success(mine ? 'Avis modifié' : 'Merci pour votre avis !')
      setComment('')
      setRating(0)
      setEditing(false)
      void refresh()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const total = Object.values(distribution).reduce((a, b) => a + b, 0)

  return (
    <section id="avis" className="scroll-mt-24" aria-labelledby="avis-plat">
      <h2 id="avis-plat" className="mb-5 text-[28px] font-medium">
        Avis clients {total > 0 && <span className="text-muted">({total})</span>}
      </h2>

      {total > 0 && (
        <div className="mb-8 max-w-sm space-y-1.5">
          {[5, 4, 3, 2, 1].map((n) => (
            <div key={n} className="flex items-center gap-3 text-sm">
              <span className="tabular w-3">{n}</span>
              <Star className="h-3.5 w-3.5 text-accent" fill="currentColor" aria-hidden />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${((distribution[n] ?? 0) / total) * 100}%` }} />
              </div>
              <span className="tabular w-6 text-right text-muted">{distribution[n] ?? 0}</span>
            </div>
          ))}
        </div>
      )}

      {user && (!mine || editing) ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (rating === 0) return toast.error('Choisissez une note')
            save.mutate()
          }}
          className="mb-8 space-y-3 rounded-[var(--radius-card)] border border-line bg-surface p-5"
        >
          <p className="font-semibold">{mine ? 'Modifier votre avis' : 'Donnez votre avis'}</p>
          <RatingInput value={rating} onChange={setRating} />
          <label htmlFor="review-comment" className="sr-only">
            Votre commentaire
          </label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Qu’avez-vous pensé de ce plat ?"
            minLength={3}
            maxLength={2000}
            required
          />
          <div className="flex gap-2">
            <Button type="submit" loading={save.isPending}>
              Publier
            </Button>
            {editing && (
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      ) : !user ? (
        <p className="mb-8 text-muted">
          <Link href={`/connexion?suite=/carte/${dishSlug}%23avis`} className="font-semibold text-accent hover:underline">
            Connectez-vous
          </Link>{' '}
          pour donner votre avis.
        </p>
      ) : null}

      {query.isSuccess && reviews.length === 0 ? (
        <p className="flex items-center gap-3 rounded-[var(--radius-control)] bg-surface px-4 py-3 text-sm text-muted">
          <MessageSquare className="h-5 w-5 shrink-0 text-accent" aria-hidden />
          Pas encore d’avis sur ce plat : soyez le premier à partager votre expérience.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <ReviewItem
              key={r.id}
              review={r}
              onEdit={() => {
                setRating(r.rating)
                setComment(r.comment)
                setEditing(true)
              }}
              onChanged={refresh}
            />
          ))}
        </ul>
      )}
      {query.hasNextPage && (
        <Button variant="secondary" className="mt-6" loading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
          Voir plus d’avis
        </Button>
      )}
    </section>
  )
}

function ReviewItem({ review, onEdit, onChanged }: { review: Review; onEdit: () => void; onChanged: () => void }) {
  const { user } = useSession()
  const [replying, setReplying] = useState(false)
  const [reply, setReply] = useState('')
  const isMine = user?.id === review.userId
  const isStaffUser = !!user && STAFF_ROLES.includes(user.role)

  const like = useMutation({
    mutationFn: () => post(`/reviews/${review.id}/like`),
    onSuccess: onChanged,
    onError: (e) => toast.error(errorMessage(e)),
  })
  const remove = useMutation({
    mutationFn: () => del(`/reviews/${review.id}`),
    onSuccess: () => {
      toast.success('Avis supprimé')
      onChanged()
    },
  })
  const sendReply = useMutation({
    mutationFn: () => post(`/reviews/${review.id}/replies`, { content: reply }),
    onSuccess: () => {
      setReply('')
      setReplying(false)
      onChanged()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const removeReply = useMutation({ mutationFn: (id: string) => del(`/reviews/replies/${id}`), onSuccess: onChanged })

  return (
    <li className="rounded-[var(--radius-card)] border border-line p-5">
      <div className="flex items-start gap-3">
        <Avatar src={review.user.avatarUrl} firstName={review.user.firstName} lastName={review.user.lastName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold">
              {review.user.firstName} {review.user.lastName[0]}.
            </span>
            <Stars value={review.rating} size={14} />
            <span className="text-sm text-muted">{timeAgo(review.createdAt)}</span>
          </div>
          <p className="mt-2 whitespace-pre-line text-text/90">{review.comment}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1 text-sm">
            <button
              type="button"
              disabled={!user}
              onClick={() => like.mutate()}
              className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 hover:bg-text/10', review.likedByMe && 'text-primary')}
              aria-pressed={review.likedByMe}
            >
              <Heart className="h-4 w-4" fill={review.likedByMe ? 'currentColor' : 'none'} /> {review.likeCount ?? 0}
            </button>
            {user && (
              <button type="button" onClick={() => setReplying((r) => !r)} className="rounded-full px-2.5 py-1 hover:bg-text/10">
                Répondre
              </button>
            )}
            {isMine && (
              <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 hover:bg-text/10">
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </button>
            )}
            {(isMine || isStaffUser) && (
              <button
                type="button"
                onClick={() => remove.mutate()}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-danger hover:bg-danger/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Supprimer
              </button>
            )}
          </div>

          {review.replies.length > 0 && (
            <ul className="mt-4 space-y-3 border-l-2 border-line pl-4">
              {review.replies.map((rep) => (
                <li key={rep.id} className="text-sm">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {rep.author.firstName} {rep.author.lastName[0]}.
                    </span>
                    {rep.author.role !== 'CUSTOMER' && <Badge tone="accent">Maison Braise</Badge>}
                    <span className="text-muted">{timeAgo(rep.createdAt)}</span>
                    {(user?.id === rep.author.id || isStaffUser) && (
                      <button type="button" onClick={() => removeReply.mutate(rep.id)} className="text-muted hover:text-danger" aria-label="Supprimer la réponse">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-text/85">{rep.content}</p>
                </li>
              ))}
            </ul>
          )}

          {replying && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (reply.trim()) sendReply.mutate()
              }}
              className="mt-3 flex gap-2"
            >
              <label htmlFor={`reply-${review.id}`} className="sr-only">
                Votre réponse
              </label>
              <input
                id={`reply-${review.id}`}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                maxLength={1000}
                placeholder="Votre réponse…"
                className="h-10 min-w-0 flex-1 rounded-[var(--radius-control)] border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none"
              />
              <Button size="sm" type="submit" loading={sendReply.isPending}>
                Envoyer
              </Button>
            </form>
          )}
        </div>
      </div>
    </li>
  )
}
