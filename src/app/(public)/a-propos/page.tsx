import type { Metadata } from 'next'
import Image from '@/components/ui/photo'
import { LinkButton } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/misc'
import { cn } from '@/lib/cn'
import { pageContent } from '@/lib/server-api'

export const metadata: Metadata = {
  title: 'À propos',
  description: 'L’histoire de Maison Braise, notre chef, notre brigade et nos valeurs : produits frais, cuisson au feu, accueil guinéen.',
}

export default async function AboutPage() {
  // Textes, photos et sections visibles : modifiables dans Administration > Pages du site.
  const { header, story, values, team } = await pageContent('about')
  const sidePhotos = [
    { src: header.image2, alt: header.image2Alt },
    { src: header.image3, alt: header.image3Alt },
  ].filter((p) => p.src)
  const hasPhotos = !!header.image1 || sidePhotos.length > 0

  return (
    <div className="pb-8 pt-28 lg:pt-36">
      {/* En-tête : texte à gauche, mosaïque de photos à droite. */}
      {header.visible && (
        <header className={cn('mx-auto grid max-w-7xl items-center gap-12 px-4 lg:gap-16 lg:px-8', hasPhotos && 'lg:grid-cols-2')}>
          <div>
            {header.eyebrow && <p className="eyebrow">{header.eyebrow}</p>}
            <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02] lg:text-[64px]">
              {header.title} {header.titleHighlight && <em className="font-medium text-primary">{header.titleHighlight}</em>}
            </h1>
            {header.intro && <p className="mt-6 max-w-md text-lg text-text/80">{header.intro}</p>}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href="/reserver">Réserver une table</LinkButton>
              <LinkButton href="/carte" variant="ghost">
                Lire la carte →
              </LinkButton>
            </div>
          </div>

          {hasPhotos && (
            <div className="grid h-[440px] grid-cols-5 grid-rows-2 gap-3 sm:h-[520px]">
              {header.image1 && (
                <div className={cn('relative row-span-2 overflow-hidden rounded-lg', sidePhotos.length > 0 ? 'col-span-3' : 'col-span-5')}>
                  <Image src={header.image1} alt={header.image1Alt} fill priority sizes="(min-width: 1024px) 30vw, 60vw" className="object-cover" />
                </div>
              )}
              {sidePhotos.map((p) => (
                <div
                  key={p.src}
                  className={cn(
                    'relative overflow-hidden rounded-lg',
                    header.image1 ? 'col-span-2' : 'col-span-5',
                    sidePhotos.length === 1 && 'row-span-2',
                  )}
                >
                  <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </header>
      )}

      {story.visible && (
        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-24 lg:grid-cols-2 lg:px-8">
          <SectionHeading eyebrow={story.eyebrow} title={story.title} />
          <div className="space-y-5 text-lg text-text/90">
            {story.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </section>
      )}

      {values.visible && values.items.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 lg:px-8" aria-labelledby="valeurs">
          <h2 id="valeurs" className="sr-only">
            Nos valeurs
          </h2>
          <ul className="grid gap-5 md:grid-cols-3">
            {values.items.map((v) => (
              <li key={v.title} className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
                <h3 className="text-2xl">{v.title}</h3>
                <p className="mt-2 text-muted">{v.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {team.visible && (
        <section className={cn('mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 lg:px-8', team.image && 'lg:grid-cols-2')}>
          {team.image && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
              <Image src={team.image} alt={team.imageAlt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[center_35%]" />
            </div>
          )}
          <div>
            <SectionHeading eyebrow={team.eyebrow} title={team.title}>
              {team.text}
            </SectionHeading>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/reserver">Réserver une table</LinkButton>
              <LinkButton href="/academie" variant="secondary">
                L’académie
              </LinkButton>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
