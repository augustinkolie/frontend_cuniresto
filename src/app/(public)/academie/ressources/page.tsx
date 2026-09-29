import { ExternalLink, FileText, Image as ImageIcon, Link2, Video } from 'lucide-react'
import type { Metadata } from 'next'
import { EmptyState } from '@/components/ui/misc'
import { formatDate } from '@/lib/format'
import { publicFetch } from '@/lib/server-api'
import type { AcademyResource } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Ressources de l’académie',
  description: 'Guides, fiches recettes et supports de cours à télécharger.',
}

const ICONS = { pdf: FileText, video: Video, link: Link2, image: ImageIcon } as const

export default async function ResourcesPage() {
  const resources = (await publicFetch<AcademyResource[]>('/academy/resources', ['content'])) ?? []
  const categories = [...new Set(resources.map((r) => r.category))]

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-28 lg:px-8 lg:pt-36">
      <header className="mb-12">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">Académie</p>
        <h1 className="text-[40px] font-semibold lg:text-[56px]">Ressources</h1>
        <p className="mt-3 text-muted">Guides, fiches recettes et supports de cours proposés par nos chefs.</p>
      </header>
      {resources.length === 0 ? (
        <EmptyState icon={<FileText className="h-10 w-10" />} title="Aucune ressource pour le moment" />
      ) : (
        <div className="space-y-10">
          {categories.map((cat) => (
            <section key={cat}>
              <h2 className="mb-4 text-2xl font-medium capitalize">{cat}</h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {resources
                  .filter((r) => r.category === cat)
                  .map((r) => {
                    const Icon = ICONS[r.type as keyof typeof ICONS] ?? FileText
                    return (
                      <li key={r.id}>
                        <a
                          href={r.fileUrl}
                          target="_blank"
                          rel="noopener"
                          className="flex h-full gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 hover:border-primary/50"
                        >
                          <Icon className="h-8 w-8 shrink-0 text-accent" aria-hidden />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">{r.title}</p>
                            <p className="mt-1 text-sm text-muted">{r.description}</p>
                            <p className="mt-2 text-xs uppercase text-muted">
                              {r.type} · {formatDate(r.createdAt)}
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                        </a>
                      </li>
                    )
                  })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
