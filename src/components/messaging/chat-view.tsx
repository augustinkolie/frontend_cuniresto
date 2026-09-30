'use client'

import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Ban, Clock, Heart, LogOut, MoreVertical, Phone, UserPlus, Users, Video, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useCallStore } from '@/components/calls/call-store'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/field'
import { Avatar } from '@/components/ui/misc'
import { Spinner } from '@/components/ui/spinner'
import { useSession } from '@/hooks/use-session'
import { useSocketEvent } from '@/hooks/use-socket-event'
import { api, del, errorMessage, get, patch, post, put } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import type { Conversation, CursorPage, Message, PublicUser } from '@/lib/types'
import { Composer } from './composer'
import { MessageBubble } from './message-bubble'

const DISAPPEARING = [
  { value: 0, label: 'Désactivés' },
  { value: 86_400, label: '24 heures' },
  { value: 604_800, label: '7 jours' },
  { value: 7_776_000, label: '90 jours' },
]

type Pages = InfiniteData<CursorPage<Message>, string | undefined>

export function conversationTitle(c: Conversation, meId: string): string {
  if (c.isGroup) return c.name ?? 'Groupe'
  const other = c.members.find((m) => m.id !== meId)
  return other ? `${other.firstName} ${other.lastName}` : 'Conversation'
}

export function ChatView({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const { user } = useSession()
  const client = useQueryClient()
  const scroller = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [typing, setTyping] = useState<string | null>(null)
  const [menu, setMenu] = useState(false)
  const [settings, setSettings] = useState(false)
  const startCall = useCallStore((s) => s.start)
  const key = ['messages', conversationId]

  const conversation = useQuery({ queryKey: ['conversation', conversationId], queryFn: () => get<Conversation>(`/conversations/${conversationId}`) })
  const messages = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => get<CursorPage<Message>>(`/conversations/${conversationId}/messages`, { cursor: pageParam, limit: 30 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
  const favorites = useQuery({ queryKey: ['favorite-contacts'], queryFn: () => get<PublicUser[]>('/me/favorite-contacts') })
  // Présence des autres membres (application ouverte ou non), pour savoir si un appel peut aboutir.
  const presence = useQuery({
    queryKey: ['presence', conversationId],
    queryFn: () => get<Record<string, boolean>>(`/conversations/${conversationId}/presence`),
    refetchInterval: 20_000,
  })

  // Pages chargées de la plus récente à la plus ancienne ; affichage chronologique.
  const list = [...(messages.data?.pages ?? [])].reverse().flatMap((p) => p.items)

  const markRead = useMutation({
    mutationFn: () => post(`/conversations/${conversationId}/read`),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['conversations'] }),
  })
  useEffect(() => {
    if (list.length > 0) markRead.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, list.length])

  useLayoutEffect(() => {
    const el = scroller.current
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
  }, [list.length, typing])

  const updateMessage = (id: string, patchFn: (m: Message) => Message) =>
    client.setQueryData<Pages>(key, (data) =>
      data && { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((m) => (m.id === id ? patchFn(m) : m)) })) },
    )

  useSocketEvent<Message>('message:new', (m) => {
    if (m.conversationId !== conversationId) return
    client.setQueryData<Pages>(key, (data) => {
      if (!data || data.pages[0]?.items.some((x) => x.id === m.id)) return data
      const [first, ...rest] = data.pages
      return { ...data, pages: [{ ...first!, items: [...first!.items, m] }, ...rest] }
    })
    setTyping(null)
  })
  useSocketEvent<{ id: string; conversationId: string }>('message:deleted', (e) => {
    if (e.conversationId === conversationId) updateMessage(e.id, (m) => ({ ...m, deletedAt: new Date().toISOString(), content: '', attachments: [] }))
  })
  useSocketEvent<{ id: string; reactions: Message['reactions'] }>('message:reactions', (e) => updateMessage(e.id, (m) => ({ ...m, reactions: e.reactions })))
  useSocketEvent<{ conversationId: string }>('conversation:read', (e) => {
    if (e.conversationId === conversationId) void client.invalidateQueries({ queryKey: ['conversation', conversationId] })
  })
  useSocketEvent<{ id: string }>('conversation:updated', (e) => {
    if (e.id === conversationId) void client.invalidateQueries({ queryKey: ['conversation', conversationId] })
  })
  useSocketEvent<{ conversationId: string; userId: string; isTyping: boolean }>('typing', (e) => {
    if (e.conversationId !== conversationId) return
    const member = conversation.data?.members.find((m) => m.id === e.userId)
    setTyping(e.isTyping && member ? member.firstName : null)
  })

  const send = useMutation({
    mutationFn: ({ content, files }: { content: string; files: File[] }) => {
      const body = new FormData()
      if (content.trim()) body.append('content', content)
      if (replyTo) body.append('replyToId', replyTo.id)
      files.forEach((f) => body.append('attachments', f))
      return api<Message>(`/conversations/${conversationId}/messages`, { method: 'POST', body })
    },
    onSuccess: () => {
      setReplyTo(null)
      stickToBottom.current = true
      void client.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const react = useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) => put(`/messages/${id}/reaction`, { emoji }),
    onError: (e) => toast.error(errorMessage(e)),
  })
  const star = useMutation({
    mutationFn: (id: string) => put<{ isStarred: boolean }>(`/messages/${id}/star`),
    onSuccess: (r, id) => updateMessage(id, (m) => ({ ...m, isStarred: r.isStarred })),
  })
  const remove = useMutation({ mutationFn: (id: string) => del(`/messages/${id}`), onError: (e) => toast.error(errorMessage(e)) })

  const toggleFavorite = useMutation({
    mutationFn: (id: string) => post(`/me/favorite-contacts/${id}`),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['favorite-contacts'] }),
  })
  const block = useMutation({
    mutationFn: (id: string) => post(`/me/blocked/${id}`),
    onSuccess: () => {
      toast.success('Utilisateur bloqué')
      setMenu(false)
    },
  })
  const leave = useMutation({
    mutationFn: () => del(`/conversations/${conversationId}/members/${user!.id}`),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['conversations'] })
      onBack()
    },
  })

  const c = conversation.data
  if (!c || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const other = c.isGroup ? null : c.members.find((m) => m.id !== user.id)
  const isFavorite = !!other && !!favorites.data?.some((f) => f.id === other.id)
  const otherReadAt = (createdAt: string) =>
    c.members.filter((m) => m.id !== user.id).every((m) => m.lastReadAt && m.lastReadAt >= createdAt)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-line bg-surface px-3 py-2.5">
        <button type="button" onClick={onBack} className="rounded-full p-2 hover:bg-text/10 md:hidden" aria-label="Retour aux conversations">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {other ? (
          <Avatar src={other.avatarUrl} firstName={other.firstName} lastName={other.lastName} />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2">
            <Users className="h-5 w-5 text-muted" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{conversationTitle(c, user.id)}</p>
          <p className="truncate text-xs text-muted">
            {typing ? (
              <span className="text-accent">{typing} écrit…</span>
            ) : c.isGroup ? (
              `${c.members.length} membres`
            ) : other && presence.data ? (
              <span className="inline-flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', presence.data[other.id] ? 'bg-success' : 'bg-text/30')} aria-hidden />
                {presence.data[other.id] ? 'En ligne' : 'Hors ligne'}
                {c.disappearingSeconds ? ' · messages éphémères' : ''}
              </span>
            ) : c.disappearingSeconds ? (
              'Messages éphémères activés'
            ) : (
              ' '
            )}
          </p>
        </div>
        {other && (
          <>
            <button type="button" onClick={() => startCall(c.id, other, 'AUDIO')} className="rounded-full p-2.5 hover:bg-text/10" aria-label="Appel audio" title={presence.data?.[other.id] === false ? `${other.firstName} est hors ligne` : 'Appel audio'}>
              <Phone className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => startCall(c.id, other, 'VIDEO')} className="rounded-full p-2.5 hover:bg-text/10" aria-label="Appel vidéo" title={presence.data?.[other.id] === false ? `${other.firstName} est hors ligne` : 'Appel vidéo'}>
              <Video className="h-5 w-5" />
            </button>
          </>
        )}
        <div className="relative">
          <button type="button" onClick={() => setMenu((m) => !m)} className="rounded-full p-2.5 hover:bg-text/10" aria-label="Options" aria-expanded={menu}>
            <MoreVertical className="h-5 w-5" />
          </button>
          {menu && (
            <div className="absolute right-0 z-20 mt-1 w-60 rounded-[var(--radius-control)] border border-line bg-surface py-1 shadow-xl">
              {other && (
                <button type="button" onClick={() => toggleFavorite.mutate(other.id)} className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-text/5">
                  <Heart className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} /> {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </button>
              )}
              <button type="button" onClick={() => (setSettings(true), setMenu(false))} className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-text/5">
                <Clock className="h-4 w-4" /> {c.isGroup ? 'Paramètres du groupe' : 'Messages éphémères'}
              </button>
              {other && (
                <button type="button" onClick={() => block.mutate(other.id)} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-danger/10">
                  <Ban className="h-4 w-4" /> Bloquer {other.firstName}
                </button>
              )}
              <button type="button" onClick={() => leave.mutate()} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-danger/10">
                <LogOut className="h-4 w-4" /> {c.isGroup ? 'Quitter le groupe' : 'Supprimer la conversation'}
              </button>
            </div>
          )}
        </div>
      </header>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
          if (el.scrollTop < 60 && messages.hasNextPage && !messages.isFetchingNextPage) void messages.fetchNextPage()
        }}
        className="flex-1 space-y-2 overflow-y-auto px-3 py-4"
      >
        {messages.isFetchingNextPage && <Spinner className="mx-auto block h-5 w-5 text-muted" />}
        {list.length === 0 && messages.isSuccess && <p className="py-12 text-center text-sm text-muted">Aucun message. Dites bonjour !</p>}
        {list.map((m, i) => {
          const prev = list[i - 1]
          const newDay = !prev || prev.createdAt.slice(0, 10) !== m.createdAt.slice(0, 10)
          return (
            <div key={m.id}>
              {newDay && (
                <p className="my-3 text-center text-xs font-semibold text-muted">
                  {formatDate(m.createdAt, { weekday: 'long', year: undefined })}
                </p>
              )}
              <MessageBubble
                message={m}
                mine={m.senderId === user.id}
                showSender={c.isGroup && prev?.senderId !== m.senderId}
                read={otherReadAt(m.createdAt)}
                onReply={() => setReplyTo(m)}
                onReact={(emoji) => react.mutate({ id: m.id, emoji })}
                onStar={() => star.mutate(m.id)}
                onDelete={() => remove.mutate(m.id)}
              />
            </div>
          )
        })}
      </div>

      <Composer
        conversationId={conversationId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        sending={send.isPending}
        onSend={async (content, files) => {
          await send.mutateAsync({ content, files })
        }}
      />

      <ConversationSettings conversation={c} open={settings} onClose={() => setSettings(false)} meId={user.id} />
    </div>
  )
}

function ConversationSettings({ conversation, open, onClose, meId }: { conversation: Conversation; open: boolean; onClose: () => void; meId: string }) {
  const client = useQueryClient()
  const [name, setName] = useState(conversation.name ?? '')
  const [search, setSearch] = useState('')
  const me = conversation.members.find((m) => m.id === meId)
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['conversation', conversation.id] })
    void client.invalidateQueries({ queryKey: ['conversations'] })
  }
  const contacts = useQuery({
    queryKey: ['contacts', search],
    queryFn: () => get<PublicUser[]>('/me/contacts', { q: search }),
    enabled: open && conversation.isGroup && !!me?.isAdmin,
  })
  const update = useMutation({
    mutationFn: (body: { name?: string; disappearingSeconds?: number }) => patch(`/conversations/${conversation.id}`, body),
    onSuccess: () => {
      toast.success('Enregistré')
      refresh()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const add = useMutation({
    mutationFn: (userId: string) => post(`/conversations/${conversation.id}/members`, { userIds: [userId] }),
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  })
  const removeMember = useMutation({
    mutationFn: (userId: string) => del(`/conversations/${conversation.id}/members/${userId}`),
    onSuccess: refresh,
  })

  return (
    <Dialog open={open} onClose={onClose} title={conversation.isGroup ? 'Paramètres du groupe' : 'Paramètres'}>
      <div className="space-y-6 p-5">
        <Field label="Messages éphémères" hint="Les messages sont supprimés pour tous après ce délai">
          {(p) => (
            <Select {...p} value={conversation.disappearingSeconds} onChange={(e) => update.mutate({ disappearingSeconds: Number(e.target.value) })}>
              {DISAPPEARING.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {conversation.isGroup && me?.isAdmin && (
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              update.mutate({ name })
            }}
          >
            <Field label="Nom du groupe" className="flex-1">
              {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />}
            </Field>
            <Button type="submit" variant="secondary">
              Renommer
            </Button>
          </form>
        )}
        {conversation.isGroup && (
          <div>
            <p className="mb-2 text-sm font-semibold">Membres</p>
            <ul className="divide-y divide-line rounded-[var(--radius-control)] border border-line">
              {conversation.members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-3 py-2">
                  <Avatar src={m.avatarUrl} firstName={m.firstName} lastName={m.lastName} size={32} />
                  <span className="flex-1 text-sm">
                    {m.firstName} {m.lastName} {m.isAdmin && <span className="text-xs text-accent">admin</span>}
                  </span>
                  {me?.isAdmin && m.id !== meId && (
                    <button type="button" onClick={() => removeMember.mutate(m.id)} className="text-muted hover:text-danger" aria-label={`Retirer ${m.firstName}`}>
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {me?.isAdmin && (
              <div className="mt-4 space-y-2">
                <label htmlFor="add-member" className="text-sm font-semibold">
                  Ajouter des membres
                </label>
                <Input id="add-member" placeholder="Rechercher" value={search} onChange={(e) => setSearch(e.target.value)} />
                <ul className="max-h-48 overflow-y-auto">
                  {contacts.data
                    ?.filter((u) => !conversation.members.some((m) => m.id === u.id))
                    .map((u) => (
                      <li key={u.id}>
                        <button type="button" onClick={() => add.mutate(u.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-text/5">
                          <Avatar src={u.avatarUrl} firstName={u.firstName} lastName={u.lastName} size={28} />
                          <span className="flex-1">
                            {u.firstName} {u.lastName}
                          </span>
                          <UserPlus className="h-4 w-4 text-muted" />
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  )
}
