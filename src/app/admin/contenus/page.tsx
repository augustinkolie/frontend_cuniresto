'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Heart, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { AdminHeader } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field'
import { Badge, EmptyState } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { api, del, errorMessage, get, patch, post } from '@/lib/api'
import type { ChefContent, CursorPage, Dish } from '@/lib/types'

const CATEGORIES = { PREPARATION: 'Préparation', COOKING: 'Cuisson', PLATING: 'Dressage', TECHNIQUE: 'Technique', RECIPE: 'Recette', OTHER: 'Divers' }
const STATUS = { DRAFT: 'Brouillon', PUBLISHED: 'Publié', ARCHIVED: 'Archivé' }

type Form = {
  title: string
  description: string
  type: ChefContent['type']
  category: ChefContent['category']
  chefName: string
  thumbnailUrl: string
  videoUrl: string
  status: ChefContent['status']
  isFeatured: boolean
  dishId: string
}

const empty: Form = { title: '', description: '', type: 'VIDEO', category: 'RECIPE', chefName: '', thumbnailUrl: '', videoUrl: '', status: 'DRAFT', isFeatured: false, dishId: '' }

export default function ChefContentAdminPage() {
  const client = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState<ChefContent | 'new' | null>(null)
  const [form, setForm] = useState<Form>(empty)
  const contents = useQuery({ queryKey: ['admin', 'chef-content'], queryFn: () => get<CursorPage<ChefContent>>('/chef-content', { limit: 100 }) })
  const dishes = useQuery({ queryKey: ['admin', 'dishes'], queryFn: () => get<CursorPage<Dish>>('/dishes', { limit: 100, includeUnavailable: true }) })
  const refresh = () => void client.invalidateQueries({ queryKey: ['admin', 'chef-content'] })

  const save = useMutation({
    mutationFn: () => {
      const body = { ...form, dishId: form.dishId || undefined }
      return editing === 'new' || !editing ? post('/admin/chef-content', body) : patch(`/admin/chef-content/${editing.id}`, body)
    },
    onSuccess: () => {
      toast.success('Contenu enregistré')
      setEditing(null)
      refresh()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const remove = useMutation({ mutationFn: (id: string) => del(`/admin/chef-content/${id}`), onSuccess: refresh })

  const upload = async (file: File) => {
    const body = new FormData()
    body.append('file', file)
    try {
      const stored = await api<{ url: string }>('/admin/media', { method: 'POST', body })
      setForm((f) => ({ ...f, thumbnailUrl: stored.url }))
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const open = (c: ChefContent | 'new') => {
    setEditing(c)
    setForm(c === 'new' ? empty : { title: c.title, description: c.description, type: c.type, category: c.category, chefName: c.chefName, thumbnailUrl: c.thumbnailUrl, videoUrl: c.videoUrl, status: c.status, isFeatured: c.isFeatured, dishId: c.dishId ?? '' })
  }

  return (
    <div>
      <AdminHeader
        title="Vidéos du chef"
        description="Tutoriels et recettes publiés sur l’accueil et l’académie."
        actions={
          <Button onClick={() => open('new')}>
            <Plus className="h-4 w-4" /> Nouveau contenu
          </Button>
        }
      />
      {!contents.data ? (
        <PageLoader />
      ) : contents.data.items.length === 0 ? (
        <EmptyState title="Aucun contenu" action={<Button onClick={() => open('new')}>Publier une première vidéo</Button>} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {contents.data.items.map((c) => (
            <li key={c.id} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
              <div className="relative aspect-video">
                <Image src={c.thumbnailUrl} alt="" fill sizes="400px" className="object-cover" />
                <Badge tone={c.status === 'PUBLISHED' ? 'success' : 'neutral'} className="absolute left-2 top-2 bg-surface">
                  {STATUS[c.status]}
                </Badge>
              </div>
              <div className="p-4">
                <p className="font-semibold">{c.title}</p>
                <p className="text-sm text-muted">
                  {c.chefName} · {CATEGORIES[c.category]}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex gap-3 text-sm text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-4 w-4" /> {c.views}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-4 w-4" /> {c._count.likes}
                    </span>
                  </span>
                  <span className="flex gap-1">
                    <button type="button" onClick={() => open(c)} className="rounded-full p-2 hover:bg-text/10" aria-label={`Modifier ${c.title}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => remove.mutate(c.id)} className="rounded-full p-2 text-danger hover:bg-danger/10" aria-label={`Supprimer ${c.title}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nouveau contenu' : 'Modifier le contenu'} className="w-[min(720px,calc(100vw-2rem))]">
        <form
          className="grid gap-4 p-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!form.thumbnailUrl) return toast.error('Ajoutez une miniature')
            save.mutate()
          }}
        >
          <button type="button" onClick={() => fileRef.current?.click()} className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[var(--radius-control)] border-2 border-dashed border-line sm:col-span-2">
            {form.thumbnailUrl ? <Image src={form.thumbnailUrl} alt="" fill sizes="680px" className="object-cover" /> : <span className="flex items-center gap-2 text-muted"><ImagePlus className="h-6 w-6" /> Miniature</span>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
          <Field label="Titre" className="sm:col-span-2">{(p) => <Input {...p} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />}</Field>
          <Field label="Description" className="sm:col-span-2">{(p) => <Textarea {...p} rows={3} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}</Field>
          <Field label="Vidéo (URL YouTube, Vimeo ou fichier)" className="sm:col-span-2">{(p) => <Input {...p} required value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />}</Field>
          <Field label="Chef">{(p) => <Input {...p} required value={form.chefName} onChange={(e) => setForm({ ...form, chefName: e.target.value })} />}</Field>
          <Field label="Catégorie">
            {(p) => (
              <Select {...p} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Form['category'] })}>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Plat associé">
            {(p) => (
              <Select {...p} value={form.dishId} onChange={(e) => setForm({ ...form, dishId: e.target.value })}>
                <option value="">Aucun</option>
                {dishes.data?.items.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Statut">
            {(p) => (
              <Select {...p} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Form['status'] })}>
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Checkbox className="sm:col-span-2" label="Mettre en avant" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
          <Button type="submit" className="sm:col-span-2" loading={save.isPending}>
            Enregistrer
          </Button>
        </form>
      </Dialog>
    </div>
  )
}
