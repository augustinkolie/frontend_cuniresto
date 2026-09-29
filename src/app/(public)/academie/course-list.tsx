'use client'

import { BookOpen, Clock, Star, Users } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { LinkButton } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/misc'
import { cn } from '@/lib/cn'
import { gnf } from '@/lib/format'
import type { AcademyCourse } from '@/lib/types'

export function CourseList({ courses }: { courses: AcademyCourse[] }) {
  const [category, setCategory] = useState('Toutes')
  const [open, setOpen] = useState<AcademyCourse | null>(null)
  const categories = useMemo(() => ['Toutes', ...new Set(courses.map((c) => c.category))], [courses])
  const shown = category === 'Toutes' ? courses : courses.filter((c) => c.category === category)

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
              'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold',
              category === c ? 'border-primary bg-primary text-on-primary' : 'border-line text-muted hover:text-text',
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => setOpen(c)} className="group block w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface text-left hover:border-primary/50">
              <div className="relative aspect-[16/10]">
                <Image src={c.imageUrl} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <Badge tone="accent" className="absolute left-3 top-3 bg-bg/80">
                  {c.level}
                </Badge>
              </div>
              <div className="space-y-2 p-5">
                <p className="text-sm text-muted">{c.category}</p>
                <h3 className="text-xl font-medium">{c.title}</h3>
                <p className="text-sm text-muted">{c.instructor}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {c.duration}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-4 w-4" /> {c.lessons} leçons
                  </span>
                  <span className="inline-flex items-center gap-1 text-accent">
                    <Star className="h-4 w-4" fill="currentColor" /> {c.rating.toFixed(1)}
                  </span>
                </div>
                <p className="tabular pt-2 text-lg font-semibold text-primary">{gnf(c.price)}</p>
              </div>
            </button>
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
              <LinkButton href={`/contact?sujet=${encodeURIComponent(`Inscription : ${open.title}`)}`}>S’inscrire</LinkButton>
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}
