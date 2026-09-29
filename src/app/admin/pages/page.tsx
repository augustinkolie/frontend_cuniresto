'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AdminHeader } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Card, Tabs } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { api, errorMessage, get, put } from '@/lib/api'
import { cn } from '@/lib/cn'
import { type FieldDef, type ListDef, mergeContent, PAGE_DEFAULTS, PAGES, type PageKey, type SectionDef, splitParagraphs } from '@/lib/site-content'

type SectionValue = Record<string, unknown>
type Content = Record<string, SectionValue>

/** Retire les paragraphes vides avant l'enregistrement. */
function clean(content: Content): Content {
  return Object.fromEntries(
    Object.entries(content).map(([id, section]) => [
      id,
      Object.fromEntries(
        Object.entries(section).map(([k, v]) =>
          Array.isArray(v) && v.every((x) => typeof x === 'string') ? [k, splitParagraphs((v as string[]).join('\n\n'))] : [k, v],
        ),
      ),
    ]),
  )
}

export default function PagesAdminPage() {
  const [key, setKey] = useState<PageKey>('home')
  return (
    <div>
      <AdminHeader
        title="Pages du site"
        description="Modifiez les textes et les photos, ou masquez une section. Un champ vide retire l’élément de la page."
      />
      <Tabs className="mb-6" value={key} onChange={setKey} items={PAGES.map((p) => ({ value: p.key, label: p.label }))} />
      <PageEditor key={key} pageKey={key} />
    </div>
  )
}

function PageEditor({ pageKey }: { pageKey: PageKey }) {
  const page = PAGES.find((p) => p.key === pageKey)!
  const client = useQueryClient()
  const { data } = useQuery({
    queryKey: ['admin', 'content', pageKey],
    queryFn: () => get<{ value: unknown }>(`/content/${pageKey}`),
  })
  const [content, setContent] = useState<Content | null>(null)
  const [saved, setSaved] = useState('')

  useEffect(() => {
    if (!data) return
    const merged = mergeContent(pageKey, data.value) as unknown as Content
    setContent(merged)
    setSaved(JSON.stringify(merged))
  }, [data, pageKey])

  const save = useMutation({
    mutationFn: () => put(`/admin/content/${pageKey}`, { value: clean(content!) }),
    onSuccess: () => {
      setSaved(JSON.stringify(clean(content!)))
      setContent(clean(content!))
      void client.invalidateQueries({ queryKey: ['admin', 'content', pageKey] })
      toast.success('Page publiée — visible sur le site dans quelques secondes')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (!content) return <PageLoader />
  const dirty = JSON.stringify(content) !== saved
  const setSection = (id: string, value: SectionValue) => setContent((c) => ({ ...c!, [id]: value }))
  const defaults = PAGE_DEFAULTS[pageKey] as unknown as Content

  return (
    <div className="max-w-4xl space-y-5 pb-24">
      {page.sections.map((section) => (
        <SectionEditor
          key={section.id}
          def={section}
          value={content[section.id] ?? {}}
          onChange={(v) => setSection(section.id, v)}
          onReset={() => setSection(section.id, structuredClone(defaults[section.id] ?? {}))}
        />
      ))}

      {/* Barre d'enregistrement toujours visible */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:left-64 lg:px-8">
        <div className="flex max-w-4xl flex-wrap items-center gap-3">
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!dirty}>
            Publier
          </Button>
          {dirty && (
            <Button variant="ghost" onClick={() => setContent(JSON.parse(saved) as Content)}>
              Annuler les modifications
            </Button>
          )}
          <span className="text-sm text-muted">{dirty ? 'Modifications non publiées' : 'À jour'}</span>
          <a href={page.href} target="_blank" rel="noopener" className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-text">
            Voir la page <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  )
}

function SectionEditor({
  def,
  value,
  onChange,
  onReset,
}: {
  def: SectionDef
  value: SectionValue
  onChange: (v: SectionValue) => void
  onReset: () => void
}) {
  const visible = value.visible !== false
  const set = (name: string, v: unknown) => onChange({ ...value, [name]: v })

  return (
    <Card className={cn('p-5 transition-opacity', !visible && 'opacity-70')}>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-sans text-lg font-semibold">{def.label}</h2>
        {!visible && <span className="rounded-full bg-text/10 px-2 py-0.5 text-xs font-semibold text-muted">Masquée</span>}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => confirm(`Rétablir le contenu d’origine de « ${def.label} » ?`) && onReset()}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-muted hover:bg-text/5 hover:text-text"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Rétablir
          </button>
          {def.toggleable && <Switch checked={visible} onChange={(v) => set('visible', v)} label="Afficher sur le site" />}
        </div>
      </div>

      {visible && (def.fields.length > 0 || def.lists?.length) ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {def.fields.map((field) => (
              <FieldEditor key={field.name} def={field} section={value} onChange={set} />
            ))}
          </div>
          {def.lists?.map((list) => (
            <ListEditor key={list.name} def={list} items={(value[list.name] as Array<Record<string, string>>) ?? []} onChange={(items) => set(list.name, items)} />
          ))}
        </div>
      ) : null}
    </Card>
  )
}

function FieldEditor({ def, section, onChange }: { def: FieldDef; section: SectionValue; onChange: (name: string, v: unknown) => void }) {
  const raw = section[def.name]
  if (def.type === 'image') {
    return <ImageField def={def} src={String(raw ?? '')} alt={String(section[`${def.name}Alt`] ?? '')} onChange={onChange} />
  }
  if (def.type === 'paragraphs') {
    const value = Array.isArray(raw) ? raw.join('\n\n') : String(raw ?? '')
    return (
      <Field label={def.label} hint={def.hint} className="sm:col-span-2">
        {(p) => <Textarea {...p} rows={7} value={value} onChange={(e) => onChange(def.name, splitParagraphs(e.target.value).length ? e.target.value.split(/\n\s*\n/) : [])} />}
      </Field>
    )
  }
  const value = String(raw ?? '')
  return (
    <Field label={def.label} hint={def.hint} className={cn(def.type === 'textarea' && 'sm:col-span-2')}>
      {(p) =>
        def.type === 'textarea' ? (
          <Textarea {...p} rows={3} value={value} onChange={(e) => onChange(def.name, e.target.value)} />
        ) : (
          <Input {...p} value={value} onChange={(e) => onChange(def.name, e.target.value)} />
        )
      }
    </Field>
  )
}

/** Aperçu léger : miniature demandée à Unsplash, ou à l'optimiseur Next.js pour les photos téléversées. */
function previewUrl(src: string) {
  if (src.startsWith('https://images.unsplash.com/')) {
    const url = new URL(src)
    url.searchParams.set('w', '400')
    return url.toString()
  }
  return src.startsWith('/uploads/') ? `/_next/image?url=${encodeURIComponent(src)}&w=384&q=70` : src
}

function ImageField({ def, src, alt, onChange }: { def: FieldDef; src: string; alt: string; onChange: (name: string, v: unknown) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const stored = await api<{ url: string }>('/admin/media', { method: 'POST', body })
      onChange(def.name, stored.url)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <p className="text-sm font-semibold">{def.label}</p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-dashed border-line bg-bg sm:w-44">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl(src)} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="px-3 text-center text-xs text-muted">Aucune photo — l’emplacement est retiré de la page</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
            <Button size="sm" variant="secondary" onClick={() => input.current?.click()} loading={uploading}>
              <ImagePlus className="h-4 w-4" /> Téléverser
            </Button>
            {src && (
              <Button size="sm" variant="ghost" onClick={() => onChange(def.name, '')}>
                <X className="h-4 w-4" /> Retirer
              </Button>
            )}
          </div>
          <Input aria-label={`${def.label} — adresse de l’image`} placeholder="…ou collez l’adresse d’une image" value={src} onChange={(e) => onChange(def.name, e.target.value)} className="h-10 text-sm" />
          <Input aria-label={`${def.label} — description`} placeholder="Description de la photo (accessibilité)" value={alt} onChange={(e) => onChange(`${def.name}Alt`, e.target.value)} className="h-10 text-sm" />
        </div>
      </div>
    </div>
  )
}

function ListEditor({ def, items, onChange }: { def: ListDef; items: Array<Record<string, string>>; onChange: (items: Array<Record<string, string>>) => void }) {
  const update = (i: number, name: string, v: string) => onChange(items.map((it, j) => (j === i ? { ...it, [name]: v } : it)))
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items]
    ;[next[i], next[i + dir]] = [next[i + dir]!, next[i]!]
    onChange(next)
  }
  const blank = Object.fromEntries(def.fields.map((f) => [f.name, '']))

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">
        {def.label} <span className="font-normal text-muted">({items.length})</span>
      </p>
      {items.map((item, i) => (
        <div key={i} className="rounded-[var(--radius-control)] border border-line p-4">
          <div className="mb-3 flex items-center gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              {def.itemLabel} {i + 1}
            </span>
            <div className="ml-auto flex items-center">
              <IconButton label="Monter" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton label="Descendre" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown className="h-4 w-4" />
              </IconButton>
              <IconButton label="Supprimer" danger onClick={() => onChange(items.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {def.fields.map((f) => (
              <Field key={f.name} label={f.label} hint={f.hint} className={cn(f.type === 'textarea' && 'sm:col-span-2')}>
                {(p) =>
                  f.type === 'textarea' ? (
                    <Textarea {...p} rows={3} value={item[f.name] ?? ''} onChange={(e) => update(i, f.name, e.target.value)} />
                  ) : (
                    <Input {...p} value={item[f.name] ?? ''} onChange={(e) => update(i, f.name, e.target.value)} />
                  )
                }
              </Field>
            ))}
          </div>
        </div>
      ))}
      <Button size="sm" variant="secondary" onClick={() => onChange([...items, { ...blank }])}>
        <Plus className="h-4 w-4" /> Ajouter : {def.itemLabel.toLowerCase()}
      </Button>
    </div>
  )
}

function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn('rounded-full p-2 hover:bg-text/5 disabled:opacity-30', danger ? 'text-danger hover:bg-danger/10' : 'text-muted')}
    >
      {children}
    </button>
  )
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
      <span className="text-muted">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 shrink-0 rounded-full p-0 transition-colors', checked ? 'bg-primary' : 'bg-text/20')}
      >
        <span className={cn('absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
      </button>
    </label>
  )
}
