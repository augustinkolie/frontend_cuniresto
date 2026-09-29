import type { Metadata } from 'next'
import { Suspense } from 'react'
import { MenuBrowser } from '@/components/menu/menu-browser'
import { PageLoader } from '@/components/ui/spinner'
import { publicFetch } from '@/lib/server-api'
import type { Category, CursorPage, Dish } from '@/lib/types'

export const metadata: Metadata = {
  title: 'La carte',
  description: 'Lapin braisé, atiéké, nouilles, sandwichs, boissons et desserts : toute la carte de Maison Braise avec prix en GNF.',
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'

/** Page statique régénérée à la demande quand la carte change (tag « menu »). */
export default async function MenuPage() {
  const [dishes, categories] = await Promise.all([
    publicFetch<CursorPage<Dish>>('/dishes', ['menu'], { limit: 100 }),
    publicFetch<Category[]>('/categories', ['menu']),
  ])
  const items = dishes?.items ?? []

  // Données structurées Schema.org : Menu.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: 'Carte Maison Braise',
    hasMenuSection: (categories ?? []).map((c) => ({
      '@type': 'MenuSection',
      name: c.name,
      hasMenuItem: items
        .filter((d) => d.category.slug === c.slug)
        .map((d) => ({
          '@type': 'MenuItem',
          name: d.name,
          description: d.description,
          url: `${SITE_URL}/carte/${d.slug}`,
          offers: { '@type': 'Offer', price: d.price, priceCurrency: 'GNF' },
        })),
    })),
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-28 lg:px-8 lg:pt-36">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* En-tête façon carte imprimée : titre centré entre deux filets. */}
      <header className="mb-10 text-center">
        <p className="eyebrow">Maison Braise · Conakry</p>
        <h1 className="mt-3 font-display text-[64px] font-bold leading-none tracking-tight lg:text-[120px]">
          La <em className="font-medium text-primary">Carte</em>
        </h1>
        <div className="ornament mx-auto mt-5 max-w-md" aria-hidden>
          <span className="text-xs">◆ ◆ ◆</span>
        </div>
        <p className="mx-auto mt-4 max-w-xl font-display text-lg italic text-muted">
          Cuit au feu de bois, servi avec générosité. Prix en francs guinéens, service compris.
        </p>
      </header>
      <Suspense fallback={<PageLoader />}>
        <MenuBrowser dishes={items} categories={categories ?? []} />
      </Suspense>
    </div>
  )
}
