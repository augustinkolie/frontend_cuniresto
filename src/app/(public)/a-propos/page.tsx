import type { Metadata } from 'next'
import Image from 'next/image'
import { LinkButton } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/misc'
import { publicFetch } from '@/lib/server-api'

export const metadata: Metadata = {
  title: 'À propos',
  description: 'L’histoire de Maison Braise, notre chef, notre brigade et nos valeurs : produits frais, cuisson au feu, accueil guinéen.',
}

interface AboutContent {
  title?: string
  intro?: string
  story?: string[]
}

const VALUES = [
  { title: 'Le feu, lentement', text: 'Charbon de bois, marinade d’une nuit, cuisson maîtrisée : la braise fait le goût.' },
  { title: 'Produits d’ici', text: 'Lapins d’élevages locaux, légumes et épices achetés chaque matin sur les marchés de Conakry.' },
  { title: 'Hospitalité', text: 'On vous reçoit comme en famille, que vous veniez seul, à deux ou pour un grand repas.' },
]

export default async function AboutPage() {
  const content = await publicFetch<{ value: AboutContent | null }>('/content/about', ['content'])
  const about = content?.value ?? {}

  return (
    <div className="pb-8 pt-28 lg:pt-36">
      {/* En-tête : texte à gauche, mosaïque de trois photos à droite (chef, plat, équipe). */}
      <header className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <p className="eyebrow">À propos</p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02] lg:text-[64px]">
            {about.title ?? (
              <>
                Une maison, un feu, <em className="font-medium text-primary">une famille.</em>
              </>
            )}
          </h1>
          <p className="mt-6 max-w-md text-lg text-text/80">
            {about.intro ??
              'Maison Braise est née d’une passion : partager le lapin braisé tel qu’on le prépare à la maison, avec le temps qu’il faut.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkButton href="/reserver">Réserver une table</LinkButton>
            <LinkButton href="/carte" variant="ghost">
              Lire la carte →
            </LinkButton>
          </div>
        </div>

        <div className="grid h-[440px] grid-cols-5 grid-rows-2 gap-3 sm:h-[520px]">
          <div className="relative col-span-3 row-span-2 overflow-hidden rounded-lg">
            <Image src="/images/about/chef.png" alt="Notre chef en cuisine" fill priority sizes="(min-width: 1024px) 30vw, 60vw" className="object-cover" />
          </div>
          <div className="relative col-span-2 overflow-hidden rounded-lg">
            <Image src="/images/about/rabbit_riz_au_gras.png" alt="Lapin braisé et riz au gras" fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-cover" />
          </div>
          <div className="relative col-span-2 overflow-hidden rounded-lg">
            <Image src="/images/about/team.png" alt="La brigade de Maison Braise" fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-cover" />
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-24 lg:grid-cols-2 lg:px-8">
        <SectionHeading eyebrow="Notre histoire" title="De la cour familiale à votre table" />
        <div className="space-y-5 text-lg text-text/90">
          {(about.story ?? [
            'Tout a commencé dans une cour de Conakry, autour d’un brasero et d’une recette transmise de génération en génération.',
            'Les amis sont venus, puis les amis des amis. Nous avons ouvert Maison Braise pour que chacun puisse goûter ce lapin mariné toute une nuit, puis cuit lentement sur la braise.',
            'Aujourd’hui, notre brigade prépare chaque jour lapin, atiéké, nouilles sautées et sandwichs, avec la même exigence et le même plaisir de recevoir.',
          ]).map((p) => (
            <p key={p.slice(0, 20)}>{p}</p>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-8" aria-labelledby="valeurs">
        <h2 id="valeurs" className="sr-only">
          Nos valeurs
        </h2>
        <ul className="grid gap-5 md:grid-cols-3">
          {VALUES.map((v) => (
            <li key={v.title} className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
              <h3 className="text-2xl">{v.title}</h3>
              <p className="mt-2 text-muted">{v.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 lg:grid-cols-2 lg:px-8">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
          <Image src="/images/about/ingredients.png" alt="Épices et produits frais de la marinade" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div>
          <SectionHeading eyebrow="L’équipe" title="Une brigade soudée">
            En cuisine comme en salle, une équipe formée à nos recettes et à notre accueil. Notre académie transmet aussi ce savoir-faire à
            celles et ceux qui veulent apprendre.
          </SectionHeading>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/reserver">Réserver une table</LinkButton>
            <LinkButton href="/academie" variant="secondary">
              L’académie
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  )
}
