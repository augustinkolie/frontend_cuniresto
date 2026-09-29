import { FileText, Play, Quote, Radio } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { LinkButton } from '@/components/ui/button'
import { Avatar, SectionHeading } from '@/components/ui/misc'
import { publicFetch } from '@/lib/server-api'
import type { AcademyCourse, ChefContent, CursorPage, LiveSession } from '@/lib/types'
import { CourseList } from './course-list'

export const metadata: Metadata = {
  title: 'Académie culinaire',
  description: 'Formations de cuisine africaine, pâtisserie, découpe et grillades avec les chefs de Maison Braise. Vidéos, ressources et cours en direct.',
}

const TESTIMONIALS = [
  { name: 'Fatou Sow', role: 'Étudiante en hôtellerie', text: 'Cette académie a transformé ma façon de cuisiner. Les vidéos sont d’une grande qualité et les chefs très pédagogues.', image: '/images/avatars/cus1.jpg' },
  { name: 'Marc Aurèle', role: 'Amateur passionné', text: 'J’ai enfin réussi à maîtriser les sauces grâce au cours du chef Amadou. Le support PDF est un vrai plus.', image: '/images/avatars/cus2.jpg' },
]

export default async function AcademyPage() {
  const [courses, videos, live] = await Promise.all([
    publicFetch<AcademyCourse[]>('/academy/courses', ['content']),
    publicFetch<CursorPage<ChefContent>>('/chef-content', ['content'], { limit: 6 }),
    publicFetch<LiveSession>('/academy/live', ['content']),
  ])
  const list = courses ?? []
  const students = list.reduce((sum, c) => sum + c.students, 0)

  return (
    <div className="pb-8">
      {/* Composition asymétrique : titre qui chevauche une photo débordante. */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-28 lg:grid-cols-12 lg:px-8 lg:pt-36">
        <div className="relative aspect-[4/3] overflow-hidden rounded-sm shadow-2xl shadow-black/40 lg:order-2 lg:col-span-6 lg:-mr-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:-rotate-1">
          <Image src="/images/academy/hero-academy.png" alt="Atelier de cuisine de l’académie" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="relative z-10 lg:order-1 lg:col-span-6">
          <p className="eyebrow">Académie Maison Braise</p>
          <h1 className="mt-4 font-display text-[52px] font-bold leading-[0.92] tracking-tight lg:-mr-32 lg:text-[96px]">
            Apprenez les gestes <em className="font-medium text-primary">de nos chefs</em>
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="#formations">Voir les formations</LinkButton>
            <LinkButton href="/academie/ressources" variant="secondary">
              <FileText className="h-4 w-4" /> Ressources
            </LinkButton>
          </div>
          <dl className="tabular mt-10 grid max-w-2xl grid-cols-3 gap-6">
            {[
              [`${students.toLocaleString('fr-FR')}+`, 'élèves formés'],
              [String(list.length), 'formations'],
              [list.length ? (list.reduce((s, c) => s + c.rating, 0) / list.length).toFixed(1) : '—', 'note moyenne'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-3xl text-primary lg:text-4xl">{value}</dd>
                <dd className="text-sm text-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {live?.isLive && (
        <div className="mx-auto mt-8 max-w-7xl px-4 lg:px-8">
          <Link href="/academie/direct" className="flex items-center gap-4 rounded-[var(--radius-card)] border border-danger/50 bg-danger/10 p-5 hover:bg-danger/15">
            <Radio className="h-6 w-6 animate-pulse text-danger" />
            <div className="flex-1">
              <p className="font-semibold">En direct maintenant : {live.title}</p>
              <p className="text-sm text-muted">{live.description}</p>
            </div>
            <span className="font-semibold text-danger">Rejoindre →</span>
          </Link>
        </div>
      )}

      <section id="formations" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 lg:px-8">
        <SectionHeading eyebrow="Formations" title="Des cours pour tous les niveaux" className="mb-8" />
        <CourseList courses={list} />
      </section>

      {videos && videos.items.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <SectionHeading eyebrow="Vidéos" title="Les tutoriels du chef" className="mb-8" />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.items.map((v) => (
              <li key={v.id}>
                <Link href={`/academie/videos/${v.id}`} className="group block">
                  <div className="relative aspect-video overflow-hidden rounded-[var(--radius-card)]">
                    <Image src={v.thumbnailUrl} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-bg/30 group-hover:bg-bg/10">
                      <span className="rounded-full bg-primary p-3 text-on-primary">
                        <Play className="h-6 w-6" fill="currentColor" />
                      </span>
                    </span>
                  </div>
                  <p className="mt-3 font-semibold group-hover:text-primary">{v.title}</p>
                  <p className="text-sm text-muted">
                    {v.chefName} · {v.views} vues
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8" aria-labelledby="temoignages">
        <h2 id="temoignages" className="mb-8 text-[28px] font-medium lg:text-[44px]">
          Ils se sont formés chez nous
        </h2>
        <ul className="grid gap-5 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <li key={t.name} className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
              <Quote className="mb-3 h-6 w-6 text-primary" aria-hidden />
              <p className="text-text/90">{t.text}</p>
              <div className="mt-4 flex items-center gap-3">
                <Avatar src={t.image} firstName={t.name} />
                <div className="text-sm">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-muted">{t.role}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
