'use client'

import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Mic, MicOff, Send, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Flame } from '@/components/brand/logo'
import { errorMessage, get, post } from '@/lib/api'
import { cn } from '@/lib/cn'
import { gnf } from '@/lib/format'
import type { CursorPage, Dish } from '@/lib/types'
import { useCart } from '@/stores/cart'
import { isOrderIntent, parseVoiceOrder } from './voice-order'

interface ChatReply {
  text: string
  suggestions: string[]
  dishes?: Array<{ name: string; slug: string; price: number }>
}

interface Entry extends ChatReply {
  role: 'user' | 'assistant'
}

const ROUTES: Record<string, string> = {
  'voir la carte': '/carte',
  'voir le menu': '/carte',
  'réserver une table': '/reserver',
  'faire une réservation': '/reserver',
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

/** Assistant culinaire (texte et voix). La voix permet aussi d'ajouter des plats au panier. */
export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [listening, setListening] = useState(false)
  const recognition = useRef<SpeechRecognitionLike | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const addToCart = useCart((s) => s.add)
  const openCart = useCart((s) => s.open)

  const { data: dishes } = useQuery({
    queryKey: ['public', 'dishes', 'all'],
    queryFn: () => get<CursorPage<Dish>>('/dishes', { limit: 100 }),
    enabled: open,
    staleTime: 10 * 60_000,
  })

  useEffect(() => {
    if (!open || entries.length > 0) return
    void get<ChatReply>('/chat/welcome').then((r) => setEntries([{ role: 'assistant', ...r }]))
  }, [open, entries.length])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [entries, pending])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || pending) return
    const route = ROUTES[message.toLowerCase()]
    if (route) {
      router.push(route)
      setOpen(false)
      return
    }
    setEntries((e) => [...e, { role: 'user', text: message, suggestions: [] }])
    setInput('')

    // Commande vocale ou écrite : ajout direct au panier.
    if (dishes && isOrderIntent(message)) {
      const found = parseVoiceOrder(message, dishes.items)
      if (found.length > 0) {
        for (const { dish, quantity } of found) {
          addToCart(
            { dishId: dish.id, slug: dish.slug, name: dish.name, price: dish.price, imageUrl: dish.imageUrl, imageAlt: dish.imageAlt },
            quantity,
          )
        }
        setEntries((e) => [
          ...e,
          {
            role: 'assistant',
            text: `C’est ajouté : ${found.map((f) => `${f.quantity} × ${f.dish.name}`).join(', ')}.`,
            suggestions: ['Voir mon panier'],
          },
        ])
        return
      }
    }

    setPending(true)
    try {
      const history = entries.slice(-8).map((e) => ({ role: e.role, content: e.text }))
      const reply = await post<ChatReply>('/chat/message', { message, history })
      setEntries((e) => [...e, { role: 'assistant', ...reply }])
    } catch (error) {
      setEntries((e) => [...e, { role: 'assistant', text: errorMessage(error), suggestions: [] }])
    } finally {
      setPending(false)
    }
  }

  const toggleVoice = () => {
    if (listening) {
      recognition.current?.stop()
      return
    }
    const Ctor = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
    const Recognition = Ctor.SpeechRecognition ?? Ctor.webkitSpeechRecognition
    if (!Recognition) {
      toast.error('La reconnaissance vocale n’est pas disponible sur ce navigateur (essayez Chrome ou Edge).')
      return
    }
    const r = new Recognition()
    r.lang = 'fr-FR'
    r.interimResults = false
    r.onresult = (e) => {
      const transcript = e.results[e.results.length - 1]?.[0]?.transcript ?? ''
      void send(transcript)
    }
    r.onerror = (e) => {
      if (e.error === 'not-allowed') toast.error('Autorisez le micro dans les réglages du navigateur.')
      else if (e.error === 'no-speech') toast.message('Je n’ai rien entendu, réessayez.')
    }
    r.onend = () => setListening(false)
    recognition.current = r
    r.start()
    setListening(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-xl transition-transform hover:scale-105"
        aria-label={open ? 'Fermer l’assistant' : 'Ouvrir l’assistant culinaire'}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <section
          aria-label="Assistant culinaire"
          className="fixed bottom-24 right-4 z-40 flex h-[min(560px,calc(100dvh-8rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-2xl"
        >
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Flame className="h-8 w-8" />
            <div>
              <p className="font-semibold leading-tight">Assistant Maison Braise</p>
              <p className="text-xs text-muted">Conseils, carte, réservations · commande vocale</p>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {entries.map((entry, i) => (
              <div key={i} className={cn('flex flex-col gap-2', entry.role === 'user' ? 'items-end' : 'items-start')}>
                <p
                  className={cn(
                    'max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm',
                    entry.role === 'user' ? 'rounded-br-md bg-primary text-on-primary' : 'rounded-bl-md bg-surface-2',
                  )}
                >
                  {entry.text}
                </p>
                {entry.dishes && entry.dishes.length > 0 && (
                  <ul className="w-[85%] space-y-1">
                    {entry.dishes.map((d) => (
                      <li key={d.slug}>
                        <Link
                          href={`/carte/${d.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex justify-between rounded-lg border border-line px-3 py-2 text-sm hover:border-primary"
                        >
                          <span>{d.name}</span>
                          <span className="tabular text-primary">{gnf(d.price)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {entry.role === 'assistant' && i === entries.length - 1 && entry.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {entry.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => (s === 'Voir mon panier' ? (setOpen(false), openCart()) : void send(s))}
                        className="rounded-full border border-line px-3 py-1 text-xs font-semibold hover:border-accent hover:text-accent"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {pending && <p className="w-16 rounded-2xl bg-surface-2 px-3.5 py-2.5 text-sm text-muted">···</p>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void send(input)
            }}
            className="flex items-center gap-2 border-t border-line p-3"
          >
            <button
              type="button"
              onClick={toggleVoice}
              className={cn(
                'shrink-0 rounded-full p-2.5 transition-colors',
                listening ? 'animate-pulse bg-danger text-white' : 'text-muted hover:bg-text/10 hover:text-text',
              )}
              aria-label={listening ? 'Arrêter l’écoute' : 'Parler (ex. : je veux deux lapins braisés)'}
            >
              {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <label htmlFor="chat-input" className="sr-only">
              Votre message
            </label>
            <input
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder="Posez votre question…"
              className="h-11 min-w-0 flex-1 rounded-full border border-line bg-bg px-4 text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || pending}
              className="shrink-0 rounded-full bg-primary p-2.5 text-on-primary disabled:opacity-40"
              aria-label="Envoyer"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </section>
      )}
    </>
  )
}
