'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field'
import { api, errorMessage, patch, post } from '@/lib/api'
import { cn } from '@/lib/cn'
import { ALLERGEN, TAG } from '@/lib/labels'
import type { Category, Dish } from '@/lib/types'

interface FormState {
  name: string
  description: string
  price: number
  categoryId: string
  imageUrl: string
  imageAlt: string
  prepTimeMinutes: number
  stock: number
  isFeatured: boolean
  isAvailable: boolean
  tags: string[]
  allergens: string[]
  chefVideoUrl: string
  options: Array<{ name: string; extraPrice: number }>
}

const empty = (categoryId: string): FormState => ({
  name: '',
  description: '',
  price: 0,
  categoryId,
  imageUrl: '',
  imageAlt: '',
  prepTimeMinutes: 15,
  stock: 100,
  isFeatured: false,
  isAvailable: true,
  tags: [],
  allergens: [],
  chefVideoUrl: '',
  options: [],
})

export function DishEditor({
  dish,
  categories,
  open,
  onClose,
}: {
  dish: Dish | null
  categories: Category[]
  open: boolean
  onClose: () => void
}) {
  const client = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormState>(empty(categories[0]?.id ?? ''))
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      dish
        ? {
            name: dish.name,
            description: dish.description,
            price: dish.price,
            categoryId: dish.categoryId,
            imageUrl: dish.imageUrl,
            imageAlt: dish.imageAlt,
            prepTimeMinutes: dish.prepTimeMinutes,
            stock: dish.stock,
            isFeatured: dish.isFeatured,
            isAvailable: dish.isAvailable,
            tags: dish.tags,
            allergens: dish.allergens,
            chefVideoUrl: dish.chefVideoUrl ?? '',
            options: dish.options.map(({ name, extraPrice }) => ({ name, extraPrice })),
          }
        : empty(categories[0]?.id ?? ''),
    )
  }, [dish, open, categories])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))
  const toggle = (key: 'tags' | 'allergens', value: string) =>
    set(key, form[key].includes(value) ? form[key].filter((v) => v !== value) : [...form[key], value])

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const stored = await api<{ url: string }>('/admin/media', { method: 'POST', body })
      set('imageUrl', stored.url)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setUploading(false)
    }
  }

  const save = useMutation({
    mutationFn: () => {
      const body = { ...form, chefVideoUrl: form.chefVideoUrl || undefined }
      return dish ? patch(`/admin/dishes/${dish.id}`, body) : post('/admin/dishes', body)
    },
    onSuccess: () => {
      toast.success(dish ? 'Plat modifié' : 'Plat créé')
      void client.invalidateQueries({ queryKey: ['admin', 'dishes'] })
      void client.invalidateQueries({ queryKey: ['public'] })
      onClose()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <Dialog open={open} onClose={onClose} title={dish ? `Modifier « ${dish.name} »` : 'Nouveau plat'} className="w-[min(760px,calc(100vw-2rem))]">
      <form
        className="grid gap-4 p-5 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!form.imageUrl) return toast.error('Ajoutez une photo')
          save.mutate()
        }}
      >
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex aspect-[16/7] w-full items-center justify-center overflow-hidden rounded-[var(--radius-control)] border-2 border-dashed border-line hover:border-primary"
          >
            {form.imageUrl ? (
              <Image src={form.imageUrl} alt="" fill sizes="720px" className="object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-muted">
                <ImagePlus className="h-8 w-8" /> {uploading ? 'Téléversement…' : 'Ajouter une photo'}
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
        </div>
        <Field label="Texte alternatif de la photo" hint="Décrivez l’image pour les lecteurs d’écran (obligatoire)" className="sm:col-span-2">
          {(p) => <Input {...p} required minLength={3} maxLength={200} value={form.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} />}
        </Field>
        <Field label="Nom">{(p) => <Input {...p} required minLength={2} value={form.name} onChange={(e) => set('name', e.target.value)} />}</Field>
        <Field label="Catégorie">
          {(p) => (
            <Select {...p} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Description" className="sm:col-span-2">
          {(p) => <Textarea {...p} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />}
        </Field>
        <Field label="Prix (GNF)">{(p) => <Input {...p} type="number" min={0} step={500} required value={form.price} onChange={(e) => set('price', Number(e.target.value))} />}</Field>
        <Field label="Préparation (minutes)">
          {(p) => <Input {...p} type="number" min={1} value={form.prepTimeMinutes} onChange={(e) => set('prepTimeMinutes', Number(e.target.value))} />}
        </Field>
        <Field label="Stock">{(p) => <Input {...p} type="number" min={0} value={form.stock} onChange={(e) => set('stock', Number(e.target.value))} />}</Field>
        <Field label="Vidéo du chef (URL, facultatif)">{(p) => <Input {...p} type="url" value={form.chefVideoUrl} onChange={(e) => set('chefVideoUrl', e.target.value)} />}</Field>
        <div className="flex flex-wrap gap-4 sm:col-span-2">
          <Checkbox label="Disponible" checked={form.isAvailable} onChange={(e) => set('isAvailable', e.target.checked)} />
          <Checkbox label="Mis en avant (signature)" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-semibold">Étiquettes</legend>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TAG).map(([k, v]) => (
              <button key={k} type="button" aria-pressed={form.tags.includes(k)} onClick={() => toggle('tags', k)} className={cn('rounded-full border px-3 py-1 text-sm', form.tags.includes(k) ? 'border-success bg-success/15 text-success' : 'border-line')}>
                {v}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-semibold">Allergènes</legend>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ALLERGEN).map(([k, v]) => (
              <button key={k} type="button" aria-pressed={form.allergens.includes(k)} onClick={() => toggle('allergens', k)} className={cn('rounded-full border px-3 py-1 text-sm', form.allergens.includes(k) ? 'border-danger bg-danger/10 text-danger' : 'border-line')}>
                {v}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="mb-1 text-sm font-semibold">Suppléments</legend>
          {form.options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <Input aria-label="Nom du supplément" value={o.name} onChange={(e) => set('options', form.options.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <Input aria-label="Prix du supplément" type="number" min={0} className="w-36" value={o.extraPrice} onChange={(e) => set('options', form.options.map((x, j) => (j === i ? { ...x, extraPrice: Number(e.target.value) } : x)))} />
              <button type="button" onClick={() => set('options', form.options.filter((_, j) => j !== i))} className="px-2 text-muted hover:text-danger" aria-label="Supprimer le supplément">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button size="sm" variant="ghost" onClick={() => set('options', [...form.options, { name: '', extraPrice: 0 }])}>
            <Plus className="h-4 w-4" /> Ajouter un supplément
          </Button>
        </fieldset>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={save.isPending} disabled={uploading}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
