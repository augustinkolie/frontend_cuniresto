'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCirclePlus, Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Search, Star, Users, Video } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ChatView, conversationTitle } from '@/components/messaging/chat-view'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/field'
import { Avatar, Tabs } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useSession } from '@/hooks/use-session'
import { useSocketEvent } from '@/hooks/use-socket-event'
import { errorMessage, get, post } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatDateTime, timeAgo } from '@/lib/format'
import type { Call, Conversation, Message, PublicUser } from '@/lib/types'

type Tab = 'all' | 'favorites' | 'starred' | 'calls'

function preview(c: Conversation, meId: string): string {
  const m = c.lastMessage
  if (!m) return 'Nouvelle conversation'
  const prefix = m.senderId === meId ? 'Vous : ' : c.isGroup ? `${m.sender.firstName} : ` : ''
  if (m.content) return prefix + m.content
  const type = m.attachments[0]?.type
  return prefix + (type === 'IMAGE' ? '📷 Photo' : type === 'AUDIO' ? '🎤 Message vocal' : type === 'VIDEO' ? '🎬 Vidéo' : '📎 Fichier')
}

export function Messenger() {
  const { user } = useSession()
  const client = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const activeId = params.get('c')
  const [tab, setTab] = useState<Tab>('all')
  const [filter, setFilter] = useState('')
  const [dialog, setDialog] = useState<'direct' | 'group' | null>(null)
  // La session n'est connue que dans le navigateur : premier rendu identique à celui du serveur.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const conversations = useQuery({ queryKey: ['conversations'], queryFn: () => get<Conversation[]>('/conversations') })
  const favorites = useQuery({ queryKey: ['favorite-contacts'], queryFn: () => get<PublicUser[]>('/me/favorite-contacts') })
  const starred = useQuery({
    queryKey: ['starred'],
    queryFn: () => get<Array<Message & { conversation: { id: string; name: string | null } }>>('/messages/starred'),
    enabled: tab === 'starred',
  })
  const calls = useQuery({ queryKey: ['calls'], queryFn: () => get<Call[]>('/calls'), enabled: tab === 'calls' })

  const refresh = () => void client.invalidateQueries({ queryKey: ['conversations'] })
  useSocketEvent('message:new', refresh)
  useSocketEvent('conversation:new', refresh)

  const select = (id: string | null) => router.replace(id ? `${pathname}?c=${id}` : pathname, { scroll: false })

  const openDirect = useMutation({
    mutationFn: (participantId: string) => post<Conversation>('/conversations', { participantId }),
    onSuccess: (c) => {
      refresh()
      setDialog(null)
      select(c.id)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const list = useMemo(() => {
    const all = conversations.data ?? []
    const q = filter.toLowerCase()
    return all.filter((c) => !q || (user && conversationTitle(c, user.id).toLowerCase().includes(q)))
  }, [conversations.data, filter, user])

  if (!mounted || !user) return <PageLoader />

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-[var(--radius-card)] border border-line bg-bg">
      <aside className={cn('flex w-full flex-col border-r border-line md:w-[340px] md:shrink-0', activeId && 'hidden md:flex')}>
        <div className="space-y-3 border-b border-line p-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Messages</h1>
            <div className="flex gap-1">
              <button type="button" onClick={() => setDialog('group')} className="rounded-full p-2 hover:bg-text/10" aria-label="Nouveau groupe">
                <Users className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setDialog('direct')} className="rounded-full p-2 hover:bg-text/10" aria-label="Nouvelle discussion">
                <MessageCirclePlus className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <label htmlFor="conv-search" className="sr-only">
              Rechercher une conversation
            </label>
            <input
              id="conv-search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Rechercher"
              className="h-10 w-full rounded-full border border-line bg-surface pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <Tabs
          value={tab}
          onChange={setTab}
          className="px-2"
          items={[
            { value: 'all', label: 'Discussions' },
            { value: 'favorites', label: 'Favoris' },
            { value: 'starred', label: 'Importants' },
            { value: 'calls', label: 'Appels' },
          ]}
        />
        <div className="flex-1 overflow-y-auto">
          {tab === 'all' &&
            (conversations.isLoading ? (
              <PageLoader />
            ) : list.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">Aucune conversation. Démarrez-en une avec le bouton ci-dessus.</p>
            ) : (
              <ul>
                {list.map((c) => {
                  const other = c.isGroup ? null : c.members.find((m) => m.id !== user.id)
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => select(c.id)}
                        className={cn('flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-text/5', activeId === c.id && 'bg-primary/10')}
                      >
                        {other ? (
                          <Avatar src={other.avatarUrl} firstName={other.firstName} lastName={other.lastName} size={44} />
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2">
                            <Users className="h-5 w-5 text-muted" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="truncate font-semibold">{conversationTitle(c, user.id)}</span>
                            <span className="shrink-0 text-xs text-muted">{timeAgo(c.lastMessageAt)}</span>
                          </span>
                          <span className="flex items-center justify-between gap-2">
                            <span className={cn('truncate text-sm', c.unread ? 'font-semibold text-text' : 'text-muted')}>{preview(c, user.id)}</span>
                            {!!c.unread && (
                              <span className="tabular shrink-0 rounded-full bg-primary px-1.5 text-xs font-bold text-on-primary">{c.unread}</span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ))}
          {tab === 'favorites' && (
            <ul>
              {(favorites.data ?? []).map((u) => (
                <li key={u.id}>
                  <button type="button" onClick={() => openDirect.mutate(u.id)} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-text/5">
                    <Avatar src={u.avatarUrl} firstName={u.firstName} lastName={u.lastName} size={40} />
                    <span className="font-semibold">
                      {u.firstName} {u.lastName}
                    </span>
                  </button>
                </li>
              ))}
              {favorites.data?.length === 0 && <p className="p-6 text-center text-sm text-muted">Ajoutez des contacts favoris depuis une conversation.</p>}
            </ul>
          )}
          {tab === 'starred' && (
            <ul className="divide-y divide-line">
              {(starred.data ?? []).map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => select(m.conversationId)} className="w-full px-3 py-3 text-left hover:bg-text/5">
                    <p className="flex items-center gap-1.5 text-xs text-muted">
                      <Star className="h-3 w-3 text-accent" fill="currentColor" /> {m.sender.firstName} · {formatDateTime(m.createdAt)}
                    </p>
                    <p className="line-clamp-2 text-sm">{m.content || 'Pièce jointe'}</p>
                  </button>
                </li>
              ))}
              {starred.data?.length === 0 && <p className="p-6 text-center text-sm text-muted">Aucun message important.</p>}
            </ul>
          )}
          {tab === 'calls' && (
            <ul className="divide-y divide-line">
              {(calls.data ?? []).map((c) => {
                const outgoing = c.callerId === user.id
                const peer = outgoing ? c.receiver : c.caller
                const missed = ['MISSED', 'REJECTED', 'CANCELLED'].includes(c.status)
                const Icon = missed ? PhoneMissed : outgoing ? PhoneOutgoing : PhoneIncoming
                return (
                  <li key={c.id}>
                    <button type="button" onClick={() => select(c.conversationId)} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-text/5">
                      <Avatar src={peer.avatarUrl} firstName={peer.firstName} lastName={peer.lastName} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">
                          {peer.firstName} {peer.lastName}
                        </span>
                        <span className={cn('flex items-center gap-1 text-xs', missed ? 'text-danger' : 'text-muted')}>
                          <Icon className="h-3.5 w-3.5" /> {formatDateTime(c.createdAt)}
                          {c.durationSeconds > 0 && ` · ${Math.floor(c.durationSeconds / 60)} min ${c.durationSeconds % 60} s`}
                        </span>
                      </span>
                      {c.type === 'VIDEO' ? <Video className="h-4 w-4 text-muted" /> : <Phone className="h-4 w-4 text-muted" />}
                    </button>
                  </li>
                )
              })}
              {calls.data?.length === 0 && <p className="p-6 text-center text-sm text-muted">Aucun appel.</p>}
            </ul>
          )}
        </div>
      </aside>

      <section className={cn('flex min-w-0 flex-1 flex-col', !activeId && 'hidden md:flex')} aria-label="Conversation">
        {activeId ? (
          <ChatView key={activeId} conversationId={activeId} onBack={() => select(null)} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted">
            <MessageCirclePlus className="h-12 w-12" />
            <p>Sélectionnez une conversation ou démarrez-en une nouvelle.</p>
          </div>
        )}
      </section>

      <ContactPicker open={dialog === 'direct'} onClose={() => setDialog(null)} onPick={(id) => openDirect.mutate(id)} />
      <NewGroup
        open={dialog === 'group'}
        onClose={() => setDialog(null)}
        onCreated={(id) => {
          refresh()
          setDialog(null)
          select(id)
        }}
      />
    </div>
  )
}

function ContactPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (id: string) => void }) {
  const [q, setQ] = useState('')
  const { data } = useQuery({ queryKey: ['contacts', q], queryFn: () => get<PublicUser[]>('/me/contacts', { q }), enabled: open })
  return (
    <Dialog open={open} onClose={onClose} title="Nouvelle discussion">
      <div className="space-y-3 p-5">
        <label htmlFor="contact-search" className="sr-only">
          Rechercher un contact
        </label>
        <Input id="contact-search" autoFocus placeholder="Nom ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="max-h-80 overflow-y-auto">
          {data?.map((u) => (
            <li key={u.id}>
              <button type="button" onClick={() => onPick(u.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-text/5">
                <Avatar src={u.avatarUrl} firstName={u.firstName} lastName={u.lastName} size={36} />
                <span className="flex-1">
                  {u.firstName} {u.lastName}
                </span>
                {u.role !== 'CUSTOMER' && <span className="text-xs text-accent">Maison Braise</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  )
}

function NewGroup({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('')
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<PublicUser[]>([])
  const { data } = useQuery({ queryKey: ['contacts', q], queryFn: () => get<PublicUser[]>('/me/contacts', { q }), enabled: open })
  const create = useMutation({
    mutationFn: () => post<Conversation>('/conversations/group', { name, participantIds: picked.map((p) => p.id) }),
    onSuccess: (c) => {
      setName('')
      setPicked([])
      onCreated(c.id)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <Dialog open={open} onClose={onClose} title="Nouveau groupe">
      <form
        className="space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (picked.length === 0) return toast.error('Ajoutez au moins un participant')
          create.mutate()
        }}
      >
        <Field label="Nom du groupe">{(p) => <Input {...p} required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
        {picked.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {picked.map((u) => (
              <button key={u.id} type="button" onClick={() => setPicked((s) => s.filter((x) => x.id !== u.id))} className="rounded-full bg-primary/15 px-3 py-1 text-sm text-primary">
                {u.firstName} ✕
              </button>
            ))}
          </div>
        )}
        <Input placeholder="Ajouter des participants" aria-label="Rechercher des participants" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="max-h-56 overflow-y-auto">
          {data
            ?.filter((u) => !picked.some((p) => p.id === u.id))
            .map((u) => (
              <li key={u.id}>
                <button type="button" onClick={() => setPicked((s) => [...s, u])} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-text/5">
                  <Avatar src={u.avatarUrl} firstName={u.firstName} lastName={u.lastName} size={32} />
                  {u.firstName} {u.lastName}
                </button>
              </li>
            ))}
        </ul>
        <Button type="submit" className="w-full" loading={create.isPending}>
          Créer le groupe ({picked.length + 1} membres)
        </Button>
      </form>
    </Dialog>
  )
}
