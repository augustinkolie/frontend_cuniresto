'use client'

import { BookOpen, Check, Clock, Star, Users } from 'lucide-react'
import Image from '@/components/ui/photo'
import { useMemo, useState } from 'react'
import { Button, LinkButton } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { cn } from '@/lib/cn'
import { gnf } from '@/lib/format'
import type { AcademyCourse } from '@/lib/types'

export function CourseList({ courses }: { courses: AcademyCourse[] }) {
  const [category, setCategory] = useState('Toutes')
  const [open, setOpen] = useState<AcademyCourse | null>(null)
  const categories = useMemo(() => ['Toutes', ...new Set(courses.map((c) => c.category))], [courses])
  const shown = category === 'Toutes' ? courses : courses.filter((c) => c.category === category)
  const popularId = useMemo(() => [...courses].sort((a, b) => b.students - a.students)[0]?.id, [courses])

  return (
    <>
      <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={cn(
              'h-9 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors',
              category === c ? 'border-primary bg-primary text-on-primary' : 'border-line text-muted hover:text-text',
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => (
          <li key={c.id} className="flex">
            <CourseOffer course={c} popular={c.id === popularId} onDetails={() => setOpen(c)} />
          </li>
        ))}
      </ul>

      <Dialog open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''}>
        {open && (
          <div className="space-y-5 p-5">
            <div className="relative aspect-video overflow-hidden rounded-[var(--radius-control)]">
              <Image src={open.imageUrl} alt="" fill sizes="560px" className="object-cover" />
            </div>
            <p className="text-muted">{open.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4 text-accent" /> {open.students} élèves
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4 text-accent" /> {open.duration}
              </span>
              <span>Formateur : {open.instructor}</span>
            </div>
            <div>
              <h3 className="mb-2 font-sans text-base font-semibold">Programme</h3>
              <ol className="divide-y divide-line rounded-[var(--radius-control)] border border-line">
                {open.modules.map((m, i) => (
                  <li key={m.title} className="flex justify-between gap-3 px-4 py-2.5 text-sm">
                    <span>
                      {i + 1}. {m.title}
                    </span>
                    <span className="tabular text-muted">{m.duration}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
              <span className="tabular text-2xl font-semibold text-primary">{gnf(open.price)}</span>
              <LinkButton href={enrolHref(open)}>S’inscrire</LinkButton>
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}

const LEVEL_DOT: Record<string, string> = { Débutant: 'bg-success', Intermédiaire: 'bg-accent', Avancé: 'bg-tomato' }

const enrolHref = (c: AcademyCourse) => `/academie/inscription?formation=${c.id}`

/** Une formation présentée comme une offre : ce qu'on apprend, avec qui, combien. */
function CourseOffer({ course: c, popular, onDetails }: { course: AcademyCourse; popular: boolean; onDetails: () => void }) {
  const shownModules = c.modules.slice(0, 3)
  return (
    <article
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-[var(--radius-card)] border bg-surface transition-shadow hover:shadow-xl hover:shadow-black/10',
        popular ? 'border-primary ring-1 ring-primary' : 'border-line',
      )}
    >
      <button type="button" onClick={onDetails} className="group relative block aspect-[16/9] overflow-hidden" aria-label={`Détails : ${c.title}`}>
        <Image src={c.imageUrl} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-bg/90 px-2.5 py-1 text-xs font-semibold text-text shadow">
          <span className={cn('h-2 w-2 rounded-full', LEVEL_DOT[c.level] ?? 'bg-muted')} aria-hidden />
          {c.level}
        </span>
        {popular && (
          <span className="absolute right-3 top-3 rounded-full bg-bg px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-primary shadow">
            Le plus suivi
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{c.category}</p>
        <h3 className="mt-2 font-display text-2xl font-semibold leading-tight">{c.title}</h3>
        <p className="mt-1 text-sm text-muted">avec {c.instructor}</p>

        {c.students > 0 && (
        <p className="mt-3 flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 font-semibold text-accent">
            <Star className="h-4 w-4" fill="currentColor" /> {c.rating.toFixed(1)}
          </span>
          <span className="text-muted">· {c.students.toLocaleString('fr-FR')} élèves formés</span>
        </p>
        )}

        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Au programme</p>
          <ul className="space-y-1.5 text-sm">
            {shownModules.map((m) => (
              <li key={m.title} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{m.title}</span>
              </li>
            ))}
          </ul>
          {c.modules.length > shownModules.length && (
            <button type="button" onClick={onDetails} className="mt-2 text-sm font-semibold text-primary hover:underline">
              + {c.modules.length - shownModules.length} autre{c.modules.length - shownModules.length > 1 ? 's' : ''} module{c.modules.length - shownModules.length > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Bas de carte aligné sur toutes les offres */}
        <div className="mt-auto pt-6">
          <div className="flex items-end justify-between gap-3 border-t border-dashed border-line pt-4">
            <div>
              <p className="price text-2xl text-primary">{gnf(c.price)}</p>
              <p className="inline-flex items-center gap-1 text-xs text-muted">
                <BookOpen className="h-3.5 w-3.5" /> Formation complète · {c.lessons} leçons
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Clock className="h-3.5 w-3.5" /> {c.duration}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <LinkButton href={enrolHref(c)} size="sm">
              S’inscrire
            </LinkButton>
            <Button variant="secondary" size="sm" onClick={onDetails}>
              Détails
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
