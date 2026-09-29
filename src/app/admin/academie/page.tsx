'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Radio, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminHeader, Table, Td } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field'
import { Card, Tabs } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { del, errorMessage, get, patch, post, put } from '@/lib/api'
import { formatDate, gnf } from '@/lib/format'
import { PAYMENT_PROVIDER } from '@/lib/labels'
import type { AcademyCourse, AcademyResource, CourseEnrollment, LiveSession } from '@/lib/types'

type CourseForm = Omit<AcademyCourse, 'id' | 'modules' | 'perks' | 'seats' | 'seatsLeft'> & { modules: string; perks: string; seats: string }

const emptyCourse: CourseForm = { title: '', instructor: '', level: 'Débutant', duration: '4 semaines', lessons: 8, students: 0, rating: 0, price: 50000, imageUrl: '/images/academy/african-cuisine.png', category: 'Cuisine traditionnelle', description: '', modules: '', onSite: false, featured: false, schedule: '', seats: '', perks: '' }

/** Modules saisis une ligne par module : « Titre | durée ». */
const parseModules = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [title, duration] = l.split('|').map((s) => s.trim())
      return { title: title ?? l, duration: duration ?? '' }
    })

export default function AcademyAdminPage() {
  const client = useQueryClient()
  const [tab, setTab] = useState<'live' | 'courses' | 'enrollments' | 'resources'>('live')
  const [editing, setEditing] = useState<AcademyCourse | 'new' | null>(null)
  const [course, setCourse] = useState<CourseForm>(emptyCourse)
  const [resource, setResource] = useState({ title: '', description: '', fileUrl: '', category: 'recette', type: 'pdf' })
  const [live, setLive] = useState({ title: '', description: '', streamUrl: '' })

  const courses = useQuery({ queryKey: ['admin', 'academy', 'courses'], queryFn: () => get<AcademyCourse[]>('/academy/courses') })
  const resources = useQuery({ queryKey: ['admin', 'academy', 'resources'], queryFn: () => get<AcademyResource[]>('/academy/resources') })
  const session = useQuery({ queryKey: ['admin', 'academy', 'live'], queryFn: () => get<LiveSession>('/academy/live') })
  useEffect(() => {
    if (session.data) setLive({ title: session.data.title, description: session.data.description, streamUrl: session.data.streamUrl ?? '' })
  }, [session.data])
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['admin', 'academy'] })
    void client.invalidateQueries({ queryKey: ['public'] })
  }

  const saveCourse = useMutation({
    mutationFn: () => {
      // Champs envoyés explicitement (l'API refuse les propriétés inconnues).
      const { title, instructor, level, duration, lessons, students, rating, price, imageUrl, category, description, onSite, featured } = course
      const body = {
        title, instructor, level, duration, lessons, students, rating, price, imageUrl, category, description, onSite, featured,
        modules: parseModules(course.modules),
        schedule: course.schedule?.trim() || undefined,
        seats: course.seats ? Number(course.seats) : null,
        perks: course.perks.split('\n').map((l) => l.trim()).filter(Boolean),
      }
      return editing === 'new' || !editing ? post('/admin/academy/courses', body) : patch(`/admin/academy/courses/${editing.id}`, body)
    },
    onSuccess: () => (setEditing(null), refresh()),
    onError: (e) => toast.error(errorMessage(e)),
  })
  const removeCourse = useMutation({ mutationFn: (id: string) => del(`/admin/academy/courses/${id}`), onSuccess: refresh })
  const addResource = useMutation({
    mutationFn: () => post('/admin/academy/resources', resource),
    onSuccess: () => {
      toast.success('Ressource ajoutée')
      setResource({ title: '', description: '', fileUrl: '', category: 'recette', type: 'pdf' })
      refresh()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const removeResource = useMutation({ mutationFn: (id: string) => del(`/admin/academy/resources/${id}`), onSuccess: refresh })
  const setLiveState = useMutation({
    mutationFn: (isLive: boolean) => put('/admin/academy/live', { isLive, title: live.title, description: live.description, streamUrl: live.streamUrl || undefined }),
    onSuccess: (_d, isLive) => (toast.success(isLive ? 'Direct lancé : visible par tous' : 'Direct terminé'), refresh()),
    onError: (e) => toast.error(errorMessage(e)),
  })

  const open = (c: AcademyCourse | 'new') => {
    setEditing(c)
    setCourse(
      c === 'new'
        ? emptyCourse
        : {
            ...c,
            modules: c.modules.map((m) => `${m.title} | ${m.duration}`).join('\n'),
            perks: c.perks.join('\n'),
            seats: c.seats ? String(c.seats) : '',
            schedule: c.schedule ?? '',
          },
    )
  }

  return (
    <div>
      <AdminHeader title="Académie & direct" />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'live', label: 'Studio en direct' },
          { value: 'courses', label: 'Formations' },
          { value: 'enrollments', label: 'Inscriptions' },
          { value: 'resources', label: 'Ressources' },
        ]}
      />

      {tab === 'live' && (
        <Card className="max-w-2xl space-y-4 p-6">
          <p className="flex items-center gap-2 font-semibold">
            <Radio className={session.data?.isLive ? 'h-5 w-5 animate-pulse text-danger' : 'h-5 w-5 text-muted'} />
            {session.data?.isLive ? 'En direct actuellement' : 'Hors ligne'}
          </p>
          <Field label="Titre du direct">{(p) => <Input {...p} value={live.title} onChange={(e) => setLive({ ...live, title: e.target.value })} />}</Field>
          <Field label="Description">{(p) => <Textarea {...p} rows={2} value={live.description} onChange={(e) => setLive({ ...live, description: e.target.value })} />}</Field>
          <Field label="Lien du flux (YouTube Live…)">{(p) => <Input {...p} type="url" value={live.streamUrl} onChange={(e) => setLive({ ...live, streamUrl: e.target.value })} />}</Field>
          <div className="flex gap-2">
            {session.data?.isLive ? (
              <>
                <Button variant="secondary" onClick={() => setLiveState.mutate(true)} loading={setLiveState.isPending}>
                  Mettre à jour
                </Button>
                <Button variant="danger" onClick={() => setLiveState.mutate(false)}>
                  Terminer le direct
                </Button>
              </>
            ) : (
              <Button onClick={() => setLiveState.mutate(true)} loading={setLiveState.isPending} disabled={!live.title}>
                Lancer le direct
              </Button>
            )}
          </div>
        </Card>
      )}

      {tab === 'courses' &&
        (!courses.data ? (
          <PageLoader />
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <Button onClick={() => open('new')}>
                <Plus className="h-4 w-4" /> Nouvelle formation
              </Button>
            </div>
            <Table head={['Formation', 'Lieu', 'Niveau', 'Prix', 'Places', '']}>
              {courses.data.map((c) => (
                <tr key={c.id}>
                  <Td className="font-semibold">
                    {c.title}
                    {c.featured && <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">Recommandée</span>}
                  </Td>
                  <Td>{c.onSite ? 'Au restaurant' : 'En ligne'}</Td>
                  <Td>{c.level}</Td>
                  <Td className="tabular">{gnf(c.price)}</Td>
                  <Td className="tabular">{c.seats === null ? '—' : `${c.seatsLeft} / ${c.seats}`}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => open(c)} className="rounded-full p-2 hover:bg-text/10" aria-label={`Modifier ${c.title}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => removeCourse.mutate(c.id)} className="rounded-full p-2 text-danger hover:bg-danger/10" aria-label={`Supprimer ${c.title}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          </>
        ))}

      {tab === 'enrollments' && <Enrollments />}

      {tab === 'resources' && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
            {resources.data?.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-4">
                <div className="flex-1">
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-sm text-muted">
                    {r.category} · {r.type} ·{' '}
                    <a href={r.fileUrl} target="_blank" rel="noopener" className="text-primary hover:underline">
                      ouvrir
                    </a>
                  </p>
                </div>
                <button type="button" onClick={() => removeResource.mutate(r.id)} className="rounded-full p-2 text-danger hover:bg-danger/10" aria-label={`Supprimer ${r.title}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
            {resources.data?.length === 0 && <li className="p-6 text-center text-sm text-muted">Aucune ressource</li>}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              addResource.mutate()
            }}
          >
            <Card className="space-y-4 p-5">
              <p className="font-semibold">Ajouter une ressource</p>
              <Field label="Titre">{(p) => <Input {...p} required value={resource.title} onChange={(e) => setResource({ ...resource, title: e.target.value })} />}</Field>
              <Field label="Description">{(p) => <Textarea {...p} rows={2} required value={resource.description} onChange={(e) => setResource({ ...resource, description: e.target.value })} />}</Field>
              <Field label="Lien du fichier">{(p) => <Input {...p} required value={resource.fileUrl} onChange={(e) => setResource({ ...resource, fileUrl: e.target.value })} />}</Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Catégorie">{(p) => <Input {...p} required value={resource.category} onChange={(e) => setResource({ ...resource, category: e.target.value })} />}</Field>
                <Field label="Type">
                  {(p) => (
                    <Select {...p} value={resource.type} onChange={(e) => setResource({ ...resource, type: e.target.value })}>
                      <option value="pdf">PDF</option>
                      <option value="video">Vidéo</option>
                      <option value="link">Lien</option>
                      <option value="image">Image</option>
                    </Select>
                  )}
                </Field>
              </div>
              <Button type="submit" loading={addResource.isPending}>
                Ajouter
              </Button>
            </Card>
          </form>
        </div>
      )}

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nouvelle formation' : 'Modifier la formation'} className="w-[min(720px,calc(100vw-2rem))]">
        <form
          className="grid gap-4 p-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            saveCourse.mutate()
          }}
        >
          <Field label="Titre" className="sm:col-span-2">{(p) => <Input {...p} required value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} />}</Field>
          <Field label="Formateur">{(p) => <Input {...p} required value={course.instructor} onChange={(e) => setCourse({ ...course, instructor: e.target.value })} />}</Field>
          <Field label="Catégorie">{(p) => <Input {...p} required value={course.category} onChange={(e) => setCourse({ ...course, category: e.target.value })} />}</Field>
          <Field label="Niveau">{(p) => <Input {...p} required value={course.level} onChange={(e) => setCourse({ ...course, level: e.target.value })} />}</Field>
          <Field label="Durée">{(p) => <Input {...p} required value={course.duration} onChange={(e) => setCourse({ ...course, duration: e.target.value })} />}</Field>
          <Field label="Leçons">{(p) => <Input {...p} type="number" min={0} value={course.lessons} onChange={(e) => setCourse({ ...course, lessons: Number(e.target.value) })} />}</Field>
          <Field label="Prix (GNF)">{(p) => <Input {...p} type="number" min={0} value={course.price} onChange={(e) => setCourse({ ...course, price: Number(e.target.value) })} />}</Field>
          <Field label="Image (URL)" className="sm:col-span-2">{(p) => <Input {...p} required value={course.imageUrl} onChange={(e) => setCourse({ ...course, imageUrl: e.target.value })} />}</Field>
          <Field label="Description" className="sm:col-span-2">{(p) => <Textarea {...p} rows={3} required value={course.description} onChange={(e) => setCourse({ ...course, description: e.target.value })} />}</Field>
          <div className="flex flex-wrap gap-6 sm:col-span-2">
            <Checkbox label="Formule donnée au restaurant" checked={course.onSite} onChange={(e) => setCourse({ ...course, onSite: e.target.checked })} />
            <Checkbox label="Formule recommandée (mise en avant)" checked={course.featured} onChange={(e) => setCourse({ ...course, featured: e.target.checked })} />
          </div>
          <Field label="Horaires et lieu" hint="Ex. : Samedi 9 h – 12 h, au restaurant">
            {(p) => <Input {...p} value={course.schedule ?? ''} onChange={(e) => setCourse({ ...course, schedule: e.target.value })} />}
          </Field>
          <Field label="Places par session" hint="Vide = illimité">
            {(p) => <Input {...p} type="number" min={1} value={course.seats} onChange={(e) => setCourse({ ...course, seats: e.target.value })} />}
          </Field>
          <Field label="Ce qui est inclus" hint="Un élément par ligne" className="sm:col-span-2">
            {(p) => <Textarea {...p} rows={3} value={course.perks} onChange={(e) => setCourse({ ...course, perks: e.target.value })} />}
          </Field>
          <Field label="Programme" hint="Un module par ligne : Titre | durée" className="sm:col-span-2">
            {(p) => <Textarea {...p} rows={4} value={course.modules} onChange={(e) => setCourse({ ...course, modules: e.target.value })} />}
          </Field>
          <Button type="submit" className="sm:col-span-2" loading={saveCourse.isPending}>
            Enregistrer
          </Button>
        </form>
      </Dialog>
    </div>
  )
}

type AdminEnrollment = CourseEnrollment & { user: { firstName: string; lastName: string; email: string; phone: string | null } }

const ENROLLMENT_STATUS = {
  CONFIRMED: { label: 'Payée', className: 'bg-success/20 text-success' },
  PENDING_PAYMENT: { label: 'En attente de paiement', className: 'bg-accent/15 text-accent' },
  CANCELLED: { label: 'Annulée', className: 'bg-text/10 text-muted' },
} as const

/** Inscriptions aux formations : qui, quoi, combien, par quel moyen. */
function Enrollments() {
  const { data } = useQuery({ queryKey: ['admin', 'academy', 'enrollments'], queryFn: () => get<AdminEnrollment[]>('/admin/academy/enrollments') })
  if (!data) return <PageLoader />
  const paid = data.filter((e) => e.status === 'CONFIRMED')
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {paid.length} inscription(s) payée(s) · {gnf(paid.reduce((sum, e) => sum + e.amount, 0))} encaissés
      </p>
      <Table head={['N°', 'Élève', 'Formation', 'Montant', 'Paiement', 'Statut', 'Date']}>
        {data.map((e) => {
          const status = ENROLLMENT_STATUS[e.status]
          return (
            <tr key={e.id}>
              <Td className="tabular">{e.number}</Td>
              <Td>
                <p className="font-semibold">
                  {e.user.firstName} {e.user.lastName}
                </p>
                <p className="text-xs text-muted">
                  {e.user.email}
                  {e.user.phone ? ` · ${e.user.phone}` : ''}
                </p>
              </Td>
              <Td>{e.courseTitle}</Td>
              <Td className="tabular">{gnf(e.amount)}</Td>
              <Td>{e.payment ? PAYMENT_PROVIDER[e.payment.provider] : '—'}</Td>
              <Td>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>
              </Td>
              <Td className="tabular">{formatDate(e.createdAt)}</Td>
            </tr>
          )
        })}
        {data.length === 0 && (
          <tr>
            <Td colSpan={7} className="py-8 text-center text-muted">
              Aucune inscription pour l’instant.
            </Td>
          </tr>
        )}
      </Table>
    </div>
  )
}
