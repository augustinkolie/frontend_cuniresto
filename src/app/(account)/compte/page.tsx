'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, Gift, Receipt } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Avatar, Card } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { SESSION_KEY, useSession } from '@/hooks/use-session'
import { api, errorMessage, get, patch } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { LEVEL } from '@/lib/labels'
import type { CursorPage, LoyaltyAccount, Order, User } from '@/lib/types'

export default function ProfilePage() {
  const { user } = useSession()
  const client = useQueryClient()
  const avatarRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', birthDate: '', bio: '' })

  const loyalty = useQuery({ queryKey: ['loyalty'], queryFn: () => get<LoyaltyAccount>('/loyalty'), enabled: !!user })
  const orders = useQuery({ queryKey: ['orders', 'mine', 'recent'], queryFn: () => get<CursorPage<Order>>('/orders/me', { limit: 3 }), enabled: !!user })

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? '',
        birthDate: user.birthDate ?? '',
        bio: user.bio ?? '',
      })
    }
  }, [user])

  const save = useMutation({
    mutationFn: () =>
      patch<User>('/me', {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        birthDate: form.birthDate || undefined,
        bio: form.bio,
      }),
    onSuccess: (u) => {
      client.setQueryData(SESSION_KEY, u)
      toast.success('Profil mis à jour')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const upload = useMutation({
    mutationFn: ({ file, kind }: { file: File; kind: 'avatar' | 'cover' }) => {
      const data = new FormData()
      data.append('file', file)
      return api<User>(`/me/${kind}`, { method: 'POST', body: data })
    },
    onSuccess: (u) => {
      client.setQueryData(SESSION_KEY, u)
      toast.success('Photo mise à jour')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (!user) return <PageLoader />

  const pick = (kind: 'avatar' | 'cover') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload.mutate({ file, kind })
    e.target.value = ''
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <div className="relative h-40 bg-gradient-to-br from-primary/40 via-surface-2 to-accent/30 sm:h-52">
          {user.coverUrl && <Image src={user.coverUrl} alt="" fill sizes="100vw" className="object-cover" />}
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-bg/70 px-3 py-1.5 text-sm font-semibold backdrop-blur"
          >
            <Camera className="h-4 w-4" /> Couverture
          </button>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={pick('cover')} />
        </div>
        <div className="flex flex-wrap items-end gap-4 px-6 pb-6">
          <div className="relative -mt-12">
            <Avatar src={user.avatarUrl} firstName={user.firstName} lastName={user.lastName} size={96} className="ring-4 ring-surface" />
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-on-primary"
              aria-label="Changer la photo de profil"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={pick('avatar')} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-muted">
              {user.email} · membre depuis {formatDate(user.createdAt, { day: undefined })}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/compte/fidelite" className="rounded-[var(--radius-card)] border border-line bg-surface p-5 hover:border-primary/50">
          <Gift className="h-6 w-6 text-accent" />
          <p className="mt-3 text-sm text-muted">Niveau {loyalty.data ? LEVEL[loyalty.data.level] : '—'}</p>
          <p className="tabular font-display text-3xl">{loyalty.data?.availablePoints ?? 0} points</p>
        </Link>
        <Link href="/compte/commandes" className="rounded-[var(--radius-card)] border border-line bg-surface p-5 hover:border-primary/50">
          <Receipt className="h-6 w-6 text-accent" />
          <p className="mt-3 text-sm text-muted">Dernière commande</p>
          <p className="font-display text-3xl">
            {orders.data?.items[0] ? `n° ${orders.data.items[0].number}` : 'Aucune'}
          </p>
        </Link>
      </div>

      <Card className="p-6">
        <h2 className="mb-5 text-2xl font-medium">Informations personnelles</h2>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate()
          }}
        >
          <Field label="Prénom">{(p) => <Input {...p} required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />}</Field>
          <Field label="Nom">{(p) => <Input {...p} required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />}</Field>
          <Field label="Téléphone">{(p) => <Input {...p} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />}</Field>
          <Field label="Date de naissance" hint="Pour une surprise le jour J">
            {(p) => <Input {...p} type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />}
          </Field>
          <Field label="À propos de vous" className="sm:col-span-2">
            {(p) => <Textarea {...p} rows={3} maxLength={500} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />}
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" loading={save.isPending}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
