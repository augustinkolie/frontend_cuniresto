import { ArrowLeft, Clock, Star } from 'lucide-react'
import type { Metadata } from 'next'
import Image from '@/components/ui/photo'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PrintedMenu } from '@/components/menu/printed-menu'
import { DishPurchase } from '@/components/menu/dish-purchase'
import { DishReviews } from '@/components/menu/dish-reviews'
import { FavoriteButton } from '@/components/menu/favorite-button'
import { Badge } from '@/components/ui/misc'
import { gnf } from '@/lib/format'
import { ALLERGEN, TAG } from '@/lib/labels'
import { publicFetch, publicFetchOrThrow } from '@/lib/server-api'
import type { CursorPage, Dish } from '@/lib/types'

type Params = { params: Promise<{ slug: string }> }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'

/** Une page statique par plat, régénérée quand le plat change (tag « dish:{slug} »). */
export async function generateStaticParams() {
  const slugs = await publicFetch<Array<{ slug: string }>>('/dishes/slugs', ['menu'])
  return (slugs ?? []).map(({ slug }) => ({ slug }))
}

export const dynamicParams = true

async function loadDish(slug: string) {
  return publicFetchOrThrow<Dish>(`/dishes/${encodeURIComponent(slug)}`, ['menu', `dish:${slug}`])
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const dish = await loadDish((await params).slug)
  if (!dish) return { title: 'Plat introuvable' }
  return {
    title: dish.name,
    description: `${dish.description} — ${gnf(dish.price)}`,
    openGraph: { title: dish.name, description: dish.description, images: [{ url: dish.imageUrl, alt: dish.imageAlt }] },
    alternates: { canonical: `/carte/${dish.slug}` },
  }
}

export default async function DishPage({ params }: Params) {
  const { slug } = await params
  const dish = await loadDish(slug)
  if (!dish) notFound()
  const related = await publicFetch<CursorPage<Dish>>('/dishes', ['menu'], { category: dish.category.slug, limit: 5 })
  const others = (related?.items ?? []).filter((d) => d.id !== dish.id).slice(0, 4)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: dish.name,
    description: dish.description,
    image: `${SITE_URL}${dish.imageUrl}`,
    offers: { '@type': 'Offer', price: dish.price, priceCurrency: 'GNF', availability: dish.isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
    ...(dish.ratingCount > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: dish.ratingAvg, reviewCount: dish.ratingCount } } : {}),
  }

  const diet = dish.tags.filter((t) => t !== 'signature')

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-24 lg:px-8 lg:pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Fil d’Ariane" className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/carte" className="inline-flex items-center gap-1.5 font-semibold hover:text-text">
          <ArrowLeft className="h-4 w-4" /> La carte
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/carte?categorie=${dish.category.slug}`} className="hover:text-text">
          {dish.category.name}
        </Link>
      </nav>

      {/* Présentation épurée : photo à gauche, informations empilées à droite, aucun chevauchement. */}
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="relative lg:sticky lg:top-28">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-2">
            <Image src={dish.imageUrl} alt={dish.imageAlt} fill priority sizes="(min-width: 1024px) 540px, 100vw" className="object-cover" />
          </div>
          <FavoriteButton dishId={dish.id} name={dish.name} className="absolute right-3 top-3" />
          {dish.tags.includes('signature') && (
            <span className="absolute left-3 top-3 rounded-sm bg-tomato px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-on-tomato">
              Signature
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <p className="eyebrow">{dish.category.name}</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight lg:text-5xl">{dish.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            {dish.ratingCount > 0 && (
              <a href="#avis" className="inline-flex items-center gap-1 text-accent hover:underline">
                <Star className="h-4 w-4" fill="currentColor" aria-hidden /> {dish.ratingAvg.toFixed(1)} ({dish.ratingCount})
              </a>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden /> {dish.prepTimeMinutes} min
            </span>
            {diet.map((t) => (
              <span key={t}>{TAG[t] ?? t}</span>
            ))}
            {!dish.isAvailable && <span className="text-danger">Indisponible</span>}
          </div>

          <p className="mt-6 text-lg leading-relaxed text-text/85">{dish.description}</p>

          <p className="price mt-8 text-3xl text-primary">{gnf(dish.price)}</p>
          <div className="mt-4">
            <DishPurchase dish={dish} />
          </div>

          {dish.allergens.length > 0 && (
            <div className="mt-8">
              <p className="mb-2 text-sm font-semibold">Allergènes</p>
              <ul className="flex flex-wrap gap-2">
                {dish.allergens.map((a) => (
                  <li key={a}>
                    <Badge tone="danger">{ALLERGEN[a] ?? a}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dish.options.length > 0 && (
            <div className="mt-8">
              <p className="mb-2 text-sm font-semibold">Suppléments</p>
              <ul className="divide-y divide-line rounded-md border border-line text-sm">
                {dish.options.map((o) => (
                  <li key={o.id} className="flex justify-between px-3 py-2">
                    <span>{o.name}</span>
                    <span className="price text-muted">+ {gnf(o.extraPrice)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dish.chefVideoUrl && (
            <video src={dish.chefVideoUrl} controls preload="none" poster={dish.imageUrl} className="mt-8 aspect-video w-full rounded-lg bg-black">
              <track kind="captions" />
            </video>
          )}
        </div>
      </div>

      <div className="mt-16 max-w-3xl border-t border-line pt-12">
        <DishReviews dishId={dish.id} dishSlug={dish.slug} />
      </div>

      {others.length > 0 && (
        <section className="mt-16 border-t border-line pt-12" aria-labelledby="suggestions">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 id="suggestions" className="text-[28px] font-medium">
              Dans la même catégorie
            </h2>
            <Link href={`/carte?categorie=${dish.category.slug}`} className="text-sm font-semibold text-accent hover:underline">
              Tout voir · {dish.category.name}
            </Link>
          </div>
          <PrintedMenu preview={false} sections={[{ title: dish.category.name, dishes: others }]} />
        </section>
      )}
    </div>
  )
}
