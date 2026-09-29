'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminHeader, Table, Td } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { ConfirmDialog, Dialog } from '@/components/ui/dialog'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field'
import { Badge, Tabs } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { del, errorMessage, get, patch, post } from '@/lib/api'
import { cn } from '@/lib/cn'
import { gnf } from '@/lib/format'
import type { Category, CursorPage, Dish } from '@/lib/types'
import { DishEditor } from './dish-editor'

export default function MenuAdminPage() {
  const client = useQueryClient()
  const [tab, setTab] = useState<'dishes' | 'categories'>('dishes')
  const [filter, setFilter] = useState('')
  const [category, setCategory] = useState('')
  const [editing, setEditing] = useState<Dish | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Dish | null>(null)

  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => get<Category[]>('/categories') })
  const dishes = useQuery({
    queryKey: ['admin', 'dishes'],
    queryFn: () => get<CursorPage<Dish>>('/dishes', { limit: 100, includeUnavailable: true }),
  })
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['admin', 'dishes'] })
    void client.invalidateQueries({ queryKey: ['public'] })
  }
  const quick = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Dish> }) => patch(`/admin/dishes/${id}`, body),
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  })
  const remove = useMutation({
    mutationFn: (id: string) => del(`/admin/dishes/${id}`),
    onSuccess: () => {
      toast.success('Plat retiré de la carte')
      setDeleting(null)
      refresh()
    },
  })

  if (!dishes.data || !categories.data) return <PageLoader />

  const list = dishes.data.items.filter(
    (d) => (!category || d.categoryId === category) && (!filter || d.name.toLowerCase().includes(filter.toLowerCase())),
  )

  return (
    <div>
      <AdminHeader
        title="Carte"
        description={`${dishes.data.items.length} plats · ${categories.data.length} catégories`}
        actions={
          tab === 'dishes' && (
            <Button onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" /> Nouveau plat
            </Button>
          )
        }
      />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'dishes', label: 'Plats' },
          { value: 'categories', label: 'Catégories' },
        ]}
      />
      {tab === 'dishes' ? (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_240px]">
            <Input placeholder="Rechercher un plat" aria-label="Rechercher" value={filter} onChange={(e) => setFilter(e.target.value)} />
            <Select aria-label="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Toutes les catégories</option>
              {categories.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Table head={['Plat', 'Catégorie', 'Prix', 'Stock', 'Note', 'Statut', '']}>
            {list.map((d) => (
              <tr key={d.id} className={cn(!d.isAvailable && 'opacity-60')}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                      <Image src={d.imageUrl} alt="" fill sizes="44px" className="object-cover" />
                    </div>
                    <span className="font-semibold">{d.name}</span>
                    {d.isFeatured && <Star className="h-4 w-4 text-accent" fill="currentColor" aria-label="Signature" />}
                  </div>
                </Td>
                <Td>{d.category.name}</Td>
                <Td className="tabular">{gnf(d.price)}</Td>
                <Td>
                  <input
                    type="number"
                    min={0}
                    defaultValue={d.stock}
                    aria-label={`Stock de ${d.name}`}
                    onBlur={(e) => Number(e.target.value) !== d.stock && quick.mutate({ id: d.id, body: { stock: Number(e.target.value) } })}
                    className={cn('tabular h-9 w-20 rounded-lg border border-line bg-surface px-2', d.stock < 10 && 'border-danger text-danger')}
                  />
                </Td>
                <Td className="tabular">{d.ratingCount ? `${d.ratingAvg.toFixed(1)} (${d.ratingCount})` : '—'}</Td>
                <Td>
                  <Badge tone={d.isAvailable ? 'success' : 'neutral'}>{d.isAvailable ? 'Disponible' : 'Masqué'}</Badge>
                </Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => quick.mutate({ id: d.id, body: { isAvailable: !d.isAvailable } })} className="rounded-full p-2 hover:bg-text/10" aria-label={d.isAvailable ? 'Masquer' : 'Rendre disponible'}>
                      {d.isAvailable ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={() => quick.mutate({ id: d.id, body: { isFeatured: !d.isFeatured } })} className="rounded-full p-2 hover:bg-text/10" aria-label="Mettre en avant">
                      <Star className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setEditing(d)} className="rounded-full p-2 hover:bg-text/10" aria-label={`Modifier ${d.name}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setDeleting(d)} className="rounded-full p-2 text-danger hover:bg-danger/10" aria-label={`Supprimer ${d.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </>
      ) : (
        <CategoriesManager categories={categories.data} />
      )}
      <DishEditor dish={editing === 'new' ? null : editing} categories={categories.data} open={!!editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        title="Retirer ce plat ?"
        confirmLabel="Retirer"
        danger
        loading={remove.isPending}
      >
        « {deleting?.name} » disparaîtra de la carte. Les commandes passées gardent leur historique.
      </ConfirmDialog>
    </div>
  )
}

function CategoriesManager({ categories }: { categories: Category[] }) {
  const client = useQueryClient()
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [form, setForm] = useState({ name: '', description: '', position: 0, isVisible: true })
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['admin', 'categories'] })
    void client.invalidateQueries({ queryKey: ['public'] })
  }
  const save = useMutation({
    mutationFn: () => (editing === 'new' || !editing ? post('/admin/categories', form) : patch(`/admin/categories/${editing.id}`, form)),
    onSuccess: () => {
      setEditing(null)
      refresh()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const remove = useMutation({ mutationFn: (id: string) => del(`/admin/categories/${id}`), onSuccess: refresh, onError: (e) => toast.error(errorMessage(e)) })

  const open = (c: Category | 'new') => {
    setEditing(c)
    setForm(c === 'new' ? { name: '', description: '', position: categories.length, isVisible: true } : { name: c.name, description: c.description ?? '', position: c.position, isVisible: c.isVisible })
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => open('new')}>
          <Plus className="h-4 w-4" /> Nouvelle catégorie
        </Button>
      </div>
      <Table head={['Ordre', 'Nom', 'Plats', 'Visible', '']}>
        {categories.map((c) => (
          <tr key={c.id}>
            <Td className="tabular">{c.position}</Td>
            <Td className="font-semibold">{c.name}</Td>
            <Td className="tabular">{c.dishCount}</Td>
            <Td>{c.isVisible ? 'Oui' : 'Non'}</Td>
            <Td>
              <div className="flex justify-end gap-1">
                <button type="button" onClick={() => open(c)} className="rounded-full p-2 hover:bg-text/10" aria-label={`Modifier ${c.name}`}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => remove.mutate(c.id)} className="rounded-full p-2 text-danger hover:bg-danger/10" aria-label={`Supprimer ${c.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Td>
          </tr>
        ))}
      </Table>
      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}>
        <form
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate()
          }}
        >
          <Field label="Nom">{(p) => <Input {...p} required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}</Field>
          <Field label="Description">{(p) => <Textarea {...p} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}</Field>
          <Field label="Ordre d’affichage">{(p) => <Input {...p} type="number" min={0} value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />}</Field>
          <Checkbox label="Visible sur le site" checked={form.isVisible} onChange={(e) => setForm({ ...form, isVisible: e.target.checked })} />
          <Button type="submit" className="w-full" loading={save.isPending}>
            Enregistrer
          </Button>
        </form>
      </Dialog>
    </>
  )
}
