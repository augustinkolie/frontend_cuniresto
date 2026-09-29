import { ArrowRight, Clock, Phone, Play } from 'lucide-react'
import Image from '@/components/ui/photo'
import Link from 'next/link'
import { QuickBooking } from '@/components/home/quick-booking'
import { SignatureShowcase } from '@/components/home/signature-showcase'
import { PrintedMenu } from '@/components/menu/printed-menu'
import { LinkButton } from '@/components/ui/button'
import { Stars } from '@/components/ui/misc'
import { cn } from '@/lib/cn'
import { DAY_NAMES, formatDate } from '@/lib/format'
import { pageContent, publicFetch } from '@/lib/server-api'
import type { Category, ChefContent, CursorPage, Dish, OpeningHours, RestaurantSettings, Review } from '@/lib/types'

export default async function HomePage() {
  // Textes, photos et sections visibles : modifiables dans Administration > Pages du site.
  const c = await pageContent('home')
  const extractSlugs = c.menuExtract.categories
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4)

  const [signature, categories, reviews, summary, hours, settings, videos, ...extracts] = await Promise.all([
    publicFetch<CursorPage<Dish>>('/dishes', ['menu'], { featured: true, limit: 3 }),
    publicFetch<Category[]>('/categories', ['menu']),
    publicFetch<Review[]>('/reviews/latest', ['menu']),
    publicFetch<{ average: number; count: number }>('/reviews/summary', ['menu']),
    publicFetch<OpeningHours>('/opening-hours', ['content']),
    publicFetch<{ restaurant: RestaurantSettings }>('/settings/public', ['content']),
    publicFetch<CursorPage<ChefContent>>('/chef-content', ['content'], { limit: 3 }),
    ...(c.menuExtract.visible ? extractSlugs : []).map((slug) => publicFetch<CursorPage<Dish>>('/dishes', ['menu'], { category: slug, limit: 5 })),
  ])
  const today = hours?.hours.find((h) => h.dayOfWeek === new Date().getUTCDay())
  const closure = hours?.closures.find((cl) => cl.date.slice(0, 10) === new Date().toISOString().slice(0, 10))
  const restaurant = settings?.restaurant
  const tonight = closure
    ? `Fermé aujourd’hui — ${closure.reason}`
    : today
      ? today.isClosed
        ? `Fermé le ${DAY_NAMES[today.dayOfWeek]?.toLowerCase()}`
        : `Ce soir · ${today.opensAt} – ${today.closesAt}`
      : 'Ouvert 7 jours sur 7'
  const menuSections = extractSlugs
    .map((slug, i) => {
      const category = categories?.find((cat) => cat.slug === slug)
      const dishes = extracts[i]?.items ?? []
      return category && dishes.length > 0 ? { title: category.name, subtitle: category.description, dishes } : null
    })
    .filter((s) => s !== null)

  const { hero, menuExtract, signatures, story, booking } = c

  return (
    <div className="overflow-x-clip">
      {/* ─── Ouverture : titre géant qui chevauche une grande photo débordante (pas de photo plein écran) */}
      {hero.visible && (
        <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-28 lg:px-8 lg:pb-32 lg:pt-36">
          <div className={cn('grid items-center gap-10', hero.image && 'lg:grid-cols-12')}>
            <div className="relative z-10 lg:col-span-7">
              {hero.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}
              <h1 className="mt-5 font-display text-[56px] font-bold leading-[0.9] tracking-tight sm:text-[80px] lg:-mr-40 lg:text-[124px]">
                {hero.titleLine1}
                {hero.titleLine2 && (
                  <>
                    <br />
                    {hero.titleLine2}
                  </>
                )}
                {hero.titleHighlight && (
                  <>
                    <br />
                    <em className="font-medium text-primary">{hero.titleHighlight}</em>
                  </>
                )}
              </h1>
              {hero.text && <p className="mt-8 max-w-md text-lg text-text/80">{hero.text}</p>}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {hero.primaryCta && <LinkButton href="/reserver">{hero.primaryCta}</LinkButton>}
                {hero.secondaryCta && (
                  <Link href="/carte" className="group inline-flex h-12 items-center gap-2 px-2 font-display text-lg italic hover:text-primary">
                    {hero.secondaryCta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
              </div>
              <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-2 font-mono text-sm text-muted">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" aria-hidden />
                  <dt className="sr-only">Horaires</dt>
                  <dd>{tonight}</dd>
                </div>
                {restaurant && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" aria-hidden />
                    <dt className="sr-only">Téléphone</dt>
                    <dd>
                      <a href={`tel:${restaurant.phone.replace(/\s/g, '')}`} className="hover:text-text">
                        {restaurant.phone}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {hero.image && (
              <div className="relative lg:col-span-5">
                {/* La grande photo déborde de sa colonne vers la droite. */}
                <div className="group relative aspect-[4/5] overflow-hidden rounded-sm shadow-2xl shadow-black/50 lg:-mr-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:rotate-[1.5deg]">
                  <Image
                    src={hero.image}
                    alt={hero.imageAlt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                  />
                </div>
                {/* Second cliché, façon tirage posé sur la table. */}
                {hero.smallImage && (
                  <div className="absolute -bottom-12 -left-6 hidden w-48 -rotate-[4deg] border-[6px] border-text bg-text shadow-xl sm:block lg:-left-24 lg:w-56">
                    <div className="relative aspect-square">
                      <Image src={hero.smallImage} alt={hero.smallImageAlt} fill sizes="224px" className="object-cover" />
                    </div>
                    {hero.smallImageCaption && <p className="py-1.5 text-center font-display text-sm italic text-bg">{hero.smallImageCaption}</p>}
                  </div>
                )}
                {hero.badge && (
                  <span className="absolute -top-6 right-4 flex h-24 w-24 rotate-12 items-center justify-center rounded-full bg-tomato px-3 text-center font-mono text-[10px] uppercase leading-tight tracking-widest text-on-tomato shadow-lg lg:-right-4">
                    {hero.badge}
                  </span>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Extrait de la carte, présenté comme une carte imprimée */}
      {menuExtract.visible && menuSections.length > 0 && (
        <section className="border-y border-line bg-surface/50 py-20" aria-labelledby="extrait">
          <div className="mx-auto max-w-6xl px-4 lg:px-8">
            <div className="text-center">
              {menuExtract.eyebrow && <p className="eyebrow">{menuExtract.eyebrow}</p>}
              <h2 id="extrait" className="mt-3 font-display text-5xl font-bold lg:text-7xl">
                {menuExtract.title} {menuExtract.titleHighlight && <em className="font-medium text-primary">{menuExtract.titleHighlight}</em>}
              </h2>
            </div>
            <div className={cn('mt-12 grid gap-x-16 gap-y-10', menuSections.length > 1 && 'lg:grid-cols-2')}>
              {menuSections.map((section) => (
                <PrintedMenu key={section.title} preview={false} sections={[section]} />
              ))}
            </div>
            {menuExtract.linkLabel && (
              <div className="mt-12 text-center">
                <Link href="/carte" className="group inline-flex items-center gap-2 font-display text-xl italic hover:text-primary">
                  {menuExtract.linkLabel} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Signatures : liste numérotée façon carte, tirage photo qui suit le plat survolé */}
      {signatures.visible && signature && signature.items.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-24 lg:px-8" aria-labelledby="signatures">
          <div className="mb-16 max-w-xl">
            {signatures.eyebrow && <p className="eyebrow">{signatures.eyebrow}</p>}
            <h2 id="signatures" className="mt-3 font-display text-5xl font-bold leading-none lg:text-7xl">
              {signatures.title} {signatures.titleHighlight && <em className="font-medium text-primary">{signatures.titleHighlight}</em>}
            </h2>
          </div>
          <SignatureShowcase dishes={signature.items} />
        </section>
      )}

      {/* ─── La maison : photo et texte côte à côte, sans superposition */}
      {story.visible && (
        <section className={cn('mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:gap-20 lg:px-8', story.image && 'md:grid-cols-2')}>
          {story.image && (
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
              <Image src={story.image} alt={story.imageAlt} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
            </div>
          )}
          <div>
            {story.eyebrow && <p className="eyebrow">{story.eyebrow}</p>}
            <blockquote className="mt-5 font-display text-4xl font-medium italic leading-[1.1] lg:text-5xl">
              {story.quote} {story.quoteHighlight && <span className="text-primary">{story.quoteHighlight}</span>}
            </blockquote>
            <div className="my-8 h-px w-16 bg-primary" aria-hidden />
            {story.text && <p className="max-w-md text-text/80">{story.text}</p>}
            {story.linkLabel && (
              <Link href="/a-propos" className="group mt-6 inline-flex items-center gap-2 font-display text-lg italic hover:text-primary">
                {story.linkLabel} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ─── Vidéos du chef : liste éditoriale */}
      {c.videos.visible && videos && videos.items.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8" aria-labelledby="gestes">
          <div className="ornament mb-4" aria-hidden>
            <span className="text-xs">◆</span>
          </div>
          <h2 id="gestes" className="text-center font-display text-4xl font-bold italic">
            {c.videos.title}
          </h2>
          <ul className="mt-10 grid gap-8 md:grid-cols-3">
            {videos.items.map((v, i) => (
              <li key={v.id} className={cn(i === 1 && 'md:mt-12')}>
                <Link href={`/academie/videos/${v.id}`} className="group block">
                  <div className="relative aspect-video overflow-hidden rounded-sm">
                    <Image src={v.thumbnailUrl} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute bottom-3 left-3 rounded-full bg-primary p-2.5 text-on-primary">
                      <Play className="h-4 w-4" fill="currentColor" />
                    </span>
                  </div>
                  <p className="mt-3 font-display text-xl font-semibold group-hover:text-primary">{v.title}</p>
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">{v.chefName}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── Avis : citations, pas de cartes */}
      {c.reviews.visible && reviews && reviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8" aria-labelledby="avis-titre">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
            <h2 id="avis-titre" className="font-display text-5xl font-bold leading-none lg:text-6xl">
              {c.reviews.title} {c.reviews.titleHighlight && <em className="font-medium text-primary">{c.reviews.titleHighlight}</em>}
            </h2>
            {summary && summary.count > 0 && (
              <p className="flex items-center gap-3">
                <span className="price text-4xl text-primary">{summary.average.toFixed(1)}</span>
                <span>
                  <Stars value={summary.average} size={16} />
                  <span className="block font-mono text-xs uppercase tracking-widest text-muted">{summary.count} avis</span>
                </span>
              </p>
            )}
          </div>
          <ul className="grid divide-line md:grid-cols-3 md:divide-x">
            {reviews.map((r) => (
              <li key={r.id} className="py-8 md:px-8 md:first:pl-0 md:last:pr-0">
                <p className="font-display text-2xl italic leading-snug">« {r.comment} »</p>
                <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted">
                  {r.user.firstName} {r.user.lastName[0]}. —{' '}
                  {r.dish && (
                    <Link href={`/carte/${r.dish.slug}`} className="text-primary hover:underline">
                      {r.dish.name}
                    </Link>
                  )}{' '}
                  · {formatDate(r.createdAt, { year: undefined })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── Réservation : bandeau sobre, titre à gauche, formulaire sur une ligne à droite */}
      {booking.visible && (
        <section className="mx-auto max-w-6xl px-4 pb-24 pt-8 lg:px-8">
          <div className="flex flex-col gap-8 rounded-sm border border-line bg-surface px-6 py-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
            <div>
              {booking.eyebrow && <p className="eyebrow">{booking.eyebrow}</p>}
              <h2 className="mt-2 font-display text-4xl font-bold">
                {booking.title} {booking.titleHighlight && <em className="font-medium text-primary">{booking.titleHighlight}</em>}
              </h2>
              <p className="mt-2 font-mono text-sm text-muted">{tonight}</p>
            </div>
            <QuickBooking />
          </div>
        </section>
      )}
    </div>
  )
}
