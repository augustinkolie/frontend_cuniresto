'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminHeader } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Input, Textarea } from '@/components/ui/field'
import { Card, Tabs } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { del, errorMessage, get, post, put } from '@/lib/api'
import { DAY_NAMES, formatDate } from '@/lib/format'
import type { OpeningHours } from '@/lib/types'

type Day = OpeningHours['hours'][number]

export default function SiteAdminPage() {
  const [tab, setTab] = useState<'hours' | 'about' | 'newsletter'>('hours')
  return (
    <div>
      <AdminHeader title="Horaires & textes" description="Les modifications apparaissent sur le site en quelques secondes." />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'hours', label: 'Horaires & fermetures' },
          { value: 'about', label: 'Page « À propos »' },
          { value: 'newsletter', label: 'Newsletter' },
        ]}
      />
      {tab === 'hours' && <Hours />}
      {tab === 'about' && <About />}
      {tab === 'newsletter' && <Newsletter />}
    </div>
  )
}

function Hours() {
  const client = useQueryClient()
  const { data } = useQuery({ queryKey: ['admin', 'hours'], queryFn: () => get<OpeningHours>('/opening-hours') })
  const [days, setDays] = useState<Day[]>([])
  const [closure, setClosure] = useState({ date: '', reason: '' })
  useEffect(() => {
    if (data) setDays(data.hours)
  }, [data])
  const refresh = () => void client.invalidateQueries({ queryKey: ['admin', 'hours'] })

  const save = useMutation({
    mutationFn: () => put('/admin/opening-hours', { days }),
    onSuccess: () => (toast.success('Horaires enregistrés'), refresh()),
    onError: (e) => toast.error(errorMessage(e)),
  })
  const addClosure = useMutation({
    mutationFn: () => post('/admin/closures', closure),
    onSuccess: () => (setClosure({ date: '', reason: '' }), refresh()),
    onError: (e) => toast.error(errorMessage(e)),
  })
  const removeClosure = useMutation({ mutationFn: (id: string) => del(`/admin/closures/${id}`), onSuccess: refresh })

  if (!data) return <PageLoader />
  const update = (i: number, patch: Partial<Day>) => setDays((d) => d.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="mb-4 font-sans text-lg font-semibold">Horaires d’ouverture</h2>
        <ul className="space-y-2">
          {days.map((d, i) => (
            <li key={d.dayOfWeek} className="grid grid-cols-[100px_1fr_1fr_auto] items-center gap-2">
              <span className="font-semibold">{DAY_NAMES[d.dayOfWeek]}</span>
              <Input aria-label={`Ouverture ${DAY_NAMES[d.dayOfWeek]}`} type="time" step={1800} disabled={d.isClosed} value={d.opensAt} onChange={(e) => update(i, { opensAt: e.target.value })} className="h-10" />
              <Input aria-label={`Fermeture ${DAY_NAMES[d.dayOfWeek]}`} type="time" step={1800} disabled={d.isClosed} value={d.closesAt} onChange={(e) => update(i, { closesAt: e.target.value })} className="h-10" />
              <Checkbox label="Fermé" checked={d.isClosed} onChange={(e) => update(i, { isClosed: e.target.checked })} />
            </li>
          ))}
        </ul>
        <Button className="mt-4" onClick={() => save.mutate()} loading={save.isPending}>
          Enregistrer
        </Button>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 font-sans text-lg font-semibold">Jours de fermeture exceptionnelle</h2>
        <form
          className="mb-4 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            addClosure.mutate()
          }}
        >
          <Field label="Date">{(p) => <Input {...p} type="date" required value={closure.date} onChange={(e) => setClosure({ ...closure, date: e.target.value })} />}</Field>
          <Field label="Motif" className="flex-1">{(p) => <Input {...p} required minLength={2} placeholder="Tabaski, inventaire…" value={closure.reason} onChange={(e) => setClosure({ ...closure, reason: e.target.value })} />}</Field>
          <Button type="submit" loading={addClosure.isPending}>
            Ajouter
          </Button>
        </form>
        <ul className="divide-y divide-line">
          {data.closures.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2">
              <span>
                <strong>{formatDate(c.date, { timeZone: 'UTC' })}</strong> — {c.reason}
              </span>
              <button type="button" onClick={() => removeClosure.mutate(c.id)} className="rounded-full p-2 text-danger hover:bg-danger/10" aria-label="Supprimer">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {data.closures.length === 0 && <li className="py-2 text-sm text-muted">Aucune fermeture prévue.</li>}
        </ul>
      </Card>
    </div>
  )
}

function About() {
  const { data } = useQuery({
    queryKey: ['admin', 'content', 'about'],
    queryFn: () => get<{ value: { title?: string; intro?: string; story?: string[] } | null }>('/content/about'),
  })
  const [form, setForm] = useState({ title: '', intro: '', story: '' })
  useEffect(() => {
    if (data) setForm({ title: data.value?.title ?? '', intro: data.value?.intro ?? '', story: (data.value?.story ?? []).join('\n\n') })
  }, [data])
  const save = useMutation({
    mutationFn: () =>
      put('/admin/content/about', {
        value: {
          title: form.title || undefined,
          intro: form.intro || undefined,
          story: form.story ? form.story.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : undefined,
        },
      }),
    onSuccess: () => toast.success('Page mise à jour'),
    onError: (e) => toast.error(errorMessage(e)),
  })
  if (!data) return <PageLoader />
  return (
    <Card className="max-w-3xl space-y-4 p-6">
      <p className="text-sm text-muted">Laissez un champ vide pour garder le texte par défaut.</p>
      <Field label="Titre">{(p) => <Input {...p} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />}</Field>
      <Field label="Introduction">{(p) => <Textarea {...p} rows={2} value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })} />}</Field>
      <Field label="Notre histoire" hint="Séparez les paragraphes par une ligne vide">
        {(p) => <Textarea {...p} rows={8} value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} />}
      </Field>
      <Button onClick={() => save.mutate()} loading={save.isPending}>
        Publier
      </Button>
    </Card>
  )
}

function Newsletter() {
  const { data } = useQuery({ queryKey: ['admin', 'newsletter'], queryFn: () => get<Array<{ email: string; confirmedAt: string }>>('/admin/newsletter') })
  const exportCsv = () => {
    if (!data) return
    const csv = ['email;confirme_le', ...data.map((s) => `${s.email};${s.confirmedAt.slice(0, 10)}`)].join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }))
    link.download = 'abonnes-newsletter.csv'
    link.click()
  }
  if (!data) return <PageLoader />
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold">{data.length} abonné(s) confirmé(s)</p>
        <Button size="sm" variant="secondary" onClick={exportCsv} disabled={data.length === 0}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>
      <ul className="max-h-[480px] divide-y divide-line overflow-y-auto text-sm">
        {data.map((s) => (
          <li key={s.email} className="flex justify-between py-2">
            <span>{s.email}</span>
            <span className="text-muted">{formatDate(s.confirmedAt)}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
