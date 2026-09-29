'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Checkbox, Field, Input, Textarea } from '@/components/ui/field'
import { Badge, EmptyState } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { del, errorMessage, get, post, put } from '@/lib/api'
import type { Address } from '@/lib/types'

const EMPTY = { label: '', street: '', city: 'Conakry', instructions: '', isDefault: false }

export default function AddressesPage() {
  const client = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['addresses'], queryFn: () => get<Address[]>('/me/addresses') })
  const [editing, setEditing] = useState<Address | 'new' | null>(null)
  const [form, setForm] = useState(EMPTY)
  const refresh = () => client.invalidateQueries({ queryKey: ['addresses'] })

  const open = (a: Address | 'new') => {
    setEditing(a)
    setForm(a === 'new' ? EMPTY : { label: a.label, street: a.street, city: a.city, instructions: a.instructions ?? '', isDefault: a.isDefault })
  }

  const save = useMutation({
    mutationFn: () => {
      const body = { ...form, instructions: form.instructions || undefined }
      return editing === 'new' || !editing ? post('/me/addresses', body) : put(`/me/addresses/${editing.id}`, body)
    },
    onSuccess: () => {
      toast.success('Adresse enregistrée')
      setEditing(null)
      void refresh()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const remove = useMutation({ mutationFn: (id: string) => del(`/me/addresses/${id}`), onSuccess: () => void refresh() })
  const makeDefault = useMutation({
    mutationFn: (a: Address) => put(`/me/addresses/${a.id}`, { label: a.label, street: a.street, city: a.city, instructions: a.instructions ?? undefined, isDefault: true }),
    onSuccess: () => void refresh(),
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-[36px] font-semibold">Mes adresses</h1>
        <Button size="sm" onClick={() => open('new')}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>
      {isLoading ? (
        <PageLoader />
      ) : !data?.length ? (
        <EmptyState icon={<MapPin className="h-10 w-10" />} title="Aucune adresse enregistrée">
          Enregistrez vos adresses pour commander plus vite.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.map((a) => (
            <li key={a.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">
                  {a.label} {a.isDefault && <Badge tone="accent">Par défaut</Badge>}
                </p>
                <div className="flex gap-1">
                  {!a.isDefault && (
                    <button type="button" onClick={() => makeDefault.mutate(a)} className="rounded-full p-2 text-muted hover:text-accent" aria-label="Définir par défaut">
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => open(a)} className="rounded-full p-2 text-muted hover:text-text" aria-label="Modifier">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove.mutate(a.id)} className="rounded-full p-2 text-muted hover:text-danger" aria-label="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-muted">
                {a.street}, {a.city}
              </p>
              {a.instructions && <p className="mt-1 text-sm text-muted">{a.instructions}</p>}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nouvelle adresse' : 'Modifier l’adresse'}>
        <form
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate()
          }}
        >
          <Field label="Nom" hint="Maison, Bureau…">{(p) => <Input {...p} required maxLength={40} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />}</Field>
          <Field label="Adresse">{(p) => <Input {...p} required minLength={3} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />}</Field>
          <Field label="Ville">{(p) => <Input {...p} required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />}</Field>
          <Field label="Indications pour le livreur">
            {(p) => <Textarea {...p} rows={2} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />}
          </Field>
          <Checkbox label="Adresse par défaut" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
          <Button type="submit" loading={save.isPending} className="w-full">
            Enregistrer
          </Button>
        </form>
      </Dialog>
    </div>
  )
}
