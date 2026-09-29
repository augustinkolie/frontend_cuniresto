'use client'

import { Search, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Pagination } from '@/components/ui/pagination'
import { cn } from '@/lib/cn'
import { ALLERGEN, TAG } from '@/lib/labels'
import type { Category, Dish } from '@/lib/types'
import { MenuCard } from './menu-card'
import { groupByCategory } from './printed-menu'

const DIET_FILTERS = ['vegetarian', 'spicy', 'signature'] as const
const PAGE_SIZE = 12

const normalize = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Carte interactive : filtrée côté client, sans nouvel appel réseau (recherche instantanée). */
export function MenuBrowser({ dishes, categories }: { dishes: Dish[]; categories: Category[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const active = params.get('categorie') ?? 'tout'
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [tags, setTags] = useState<string[]>([])
  const [excluded, setExcluded] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const top = useRef<HTMLDivElement>(null)

  const allergens = useMemo(() => [...new Set(dishes.flatMap((d) => d.allergens))].sort(), [dishes])
  const order = useMemo(() => new Map(categories.map((c) => [c.slug, c.position])), [categories])
  const descriptions = useMemo(() => Object.fromEntries(categories.map((c) => [c.slug, c.description])), [categories])

  const filtered = useMemo(() => {
    const q = normalize(search.trim())
    return dishes
      .filter(
        (d) =>
          (active === 'tout' || d.category.slug === active) &&
          (!q || normalize(`${d.name} ${d.description} ${d.category.name}`).includes(q)) &&
          tags.every((t) => d.tags.includes(t)) &&
          !d.allergens.some((a) => excluded.includes(a)),
      )
      .sort((a, b) => (order.get(a.category.slug) ?? 99) - (order.get(b.category.slug) ?? 99))
  }, [dishes, active, search, tags, excluded, order])

  useEffect(() => setPage(1), [active, search, tags, excluded])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const sections = groupByCategory(filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), descriptions)

  const goTo = (next: number) => {
    setPage(next)
    const y = top.current?.getBoundingClientRect().top
    if (y !== undefined) window.scrollTo({ top: window.scrollY + y - 110, behavior: 'smooth' })
  }

  const selectCategory = (slug: string) => {
    const next = new URLSearchParams(params)
    if (slug === 'tout') next.delete('categorie')
    else next.set('categorie', slug)
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false })
  }

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  const hasFilters = tags.length + excluded.length > 0 || !!search

  return (
    <div>
      {/* Sommaire des catégories, collant, façon index de carte imprimée. */}
      <div ref={top} className="sticky top-16 z-30 -mx-4 border-y border-line bg-bg/95 px-4 backdrop-blur lg:top-20 lg:mx-0 lg:px-0">
        <nav aria-label="Catégories" className="scrollbar-none flex items-center gap-1 overflow-x-auto py-2.5 lg:justify-center">
          {[{ slug: 'tout', name: 'Toute la carte' }, ...categories].map((c, i) => (
            <span key={c.slug} className="flex shrink-0 items-center">
              {i > 0 && <span className="mx-1 text-primary/50" aria-hidden>·</span>}
              <button
                type="button"
                onClick={() => selectCategory(c.slug)}
                aria-current={active === c.slug ? 'true' : undefined}
                className={cn(
                  'rounded-sm px-2.5 py-1.5 font-display text-[17px] italic transition-colors',
                  active === c.slug ? 'text-primary underline decoration-2 underline-offset-8' : 'text-muted hover:text-text',
                )}
              >
                {c.name}
              </button>
            </span>
          ))}
        </nav>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="menu-search" className="sr-only">
            Rechercher un plat
          </label>
          <input
            id="menu-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Chercher un plat, un ingrédient…"
            className="h-11 w-full border-b border-line bg-transparent pl-7 pr-2 placeholder:text-muted/70 focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-wider">
          {DIET_FILTERS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tags.includes(t)}
              onClick={() => toggle(tags, setTags, t)}
              className={cn('border-b-2 py-1 transition-colors', tags.includes(t) ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text')}
            >
              {TAG[t]}
            </button>
          ))}
          <span className="text-line" aria-hidden>
            |
          </span>
          <span className="text-muted">sans :</span>
          {allergens.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={excluded.includes(a)}
              onClick={() => toggle(excluded, setExcluded, a)}
              className={cn('border-b-2 py-1 transition-colors', excluded.includes(a) ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text')}
            >
              {ALLERGEN[a] ?? a}
            </button>
          ))}
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setTags([])
                setExcluded([])
                setSearch('')
              }}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <X className="h-3.5 w-3.5" /> effacer
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted" aria-live="polite">
        {filtered.length} plat{filtered.length > 1 ? 's' : ''}
        {pageCount > 1 && ` — page ${current} / ${pageCount}`}
      </p>

      <div className="mt-8">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-display text-3xl italic">Rien de tel à la carte ce soir…</p>
            <p className="mt-2 text-muted">Essayez un autre mot-clé ou retirez un filtre.</p>
          </div>
        ) : (
          <>
            <div className="space-y-14">
              {sections.map((section, s) => (
                <section key={section.title} aria-labelledby={`sec-${section.title}`}>
                  <div className="ornament mb-2" aria-hidden>
                    <span className="text-xs">◆</span>
                  </div>
                  <h2 id={`sec-${section.title}`} className="text-center font-display text-3xl font-semibold italic lg:text-4xl">
                    {section.title}
                  </h2>
                  {section.subtitle && <p className="mt-1 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted">{section.subtitle}</p>}
                  <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {section.dishes.map((dish, i) => (
                      <li key={dish.id} className="flex">
                        <MenuCard dish={dish} priority={current === 1 && s === 0 && i < 3} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <Pagination className="mt-14" page={current} total={pageCount} onChange={goTo} />
          </>
        )}
      </div>
    </div>
  )
}
