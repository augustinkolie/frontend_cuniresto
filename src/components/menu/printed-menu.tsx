'use client'

import { Flame, Leaf, Plus } from 'lucide-react'
import Image from '@/components/ui/photo'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'
import { gnf } from '@/lib/format'
import { ALLERGEN } from '@/lib/labels'
import type { Dish } from '@/lib/types'
import { useCart } from '@/stores/cart'
import { FavoriteButton } from './favorite-button'

export interface MenuSection {
  title: string
  subtitle?: string | null
  dishes: Dish[]
}

/** Pictogrammes discrets, comme les symboles d'une carte imprimée. */
function DietMarks({ dish }: { dish: Dish }) {
  return (
    <span className="ml-2 inline-flex translate-y-[-0.1em] gap-1 align-middle">
      {dish.tags.includes('vegetarian') && (
        <span title="Végétarien" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-success/60 text-success">
          <Leaf className="h-3 w-3" aria-label="Végétarien" />
        </span>
      )}
      {dish.tags.includes('spicy') && (
        <span title="Épicé" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-accent/60 text-accent">
          <Flame className="h-3 w-3" aria-label="Épicé" />
        </span>
      )}
      {dish.tags.includes('signature') && (
        <span className="rounded-sm bg-tomato px-1.5 py-px font-mono text-[10px] uppercase tracking-widest text-on-tomato">Signature</span>
      )}
    </span>
  )
}

function AddButton({ dish }: { dish: Dish }) {
  const add = useCart((s) => s.add)
  const open = useCart((s) => s.open)
  if (!dish.isAvailable) return <span className="font-mono text-xs uppercase text-muted">épuisé</span>
  return (
    <button
      type="button"
      onClick={() => {
        add({ dishId: dish.id, slug: dish.slug, name: dish.name, price: dish.price, imageUrl: dish.imageUrl, imageAlt: dish.imageAlt })
        toast.success(`${dish.name} ajouté au panier`, { action: { label: 'Voir', onClick: open } })
      }}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/60 text-primary transition-colors hover:bg-primary hover:text-on-primary"
      aria-label={`Ajouter ${dish.name} au panier`}
    >
      <Plus className="h-4 w-4" />
    </button>
  )
}

function MenuRow({ dish, active, onActivate }: { dish: Dish; active: boolean; onActivate: () => void }) {
  return (
    <li
      onMouseEnter={onActivate}
      onFocusCapture={onActivate}
      className={cn('group relative py-4 transition-colors', active && 'lg:before:absolute lg:before:-left-5 lg:before:top-6 lg:before:h-2 lg:before:w-2 lg:before:rotate-45 lg:before:bg-primary')}
    >
      <div className="flex gap-4">
        {/* Sur mobile, une vignette par plat ; sur ordinateur, la photo s'affiche dans le cadre latéral. */}
        <Link href={`/carte/${dish.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm lg:hidden" tabIndex={-1} aria-hidden>
          <Image src={dish.imageUrl} alt="" fill sizes="80px" className="object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline">
            <h3 className="min-w-0 font-display text-xl font-semibold leading-tight lg:text-[22px]">
              <Link href={`/carte/${dish.slug}`} className="decoration-primary decoration-2 underline-offset-4 hover:underline">
                {dish.name}
              </Link>
              <DietMarks dish={dish} />
            </h3>
            <span className="leader hidden sm:block" aria-hidden />
            <span className="price ml-auto shrink-0 pl-3 text-lg text-primary sm:ml-0 sm:pl-0">{gnf(dish.price)}</span>
          </div>
          {/* Description : toujours visible sur mobile, dévoilée au survol sur ordinateur. */}
          <div className="grid transition-[grid-template-rows,opacity] duration-300 ease-out lg:grid-rows-[0fr] lg:opacity-0 lg:group-focus-within:grid-rows-[1fr] lg:group-focus-within:opacity-100 lg:group-hover:grid-rows-[1fr] lg:group-hover:opacity-100">
            <div className="overflow-hidden">
              <p className="mt-1.5 font-display text-[15px] italic leading-snug text-muted">{dish.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs uppercase tracking-wider text-muted">
                <span>{dish.prepTimeMinutes} min</span>
                {dish.allergens.length > 0 && <span>contient : {dish.allergens.map((a) => ALLERGEN[a] ?? a).join(', ').toLowerCase()}</span>}
                {dish.ratingCount > 0 && <span className="text-primary">★ {dish.ratingAvg.toFixed(1)}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 pt-1">
          <AddButton dish={dish} />
        </div>
      </div>
    </li>
  )
}

/**
 * Tirage photo encadré, à taille contenue : la photo du plat survolé zoome doucement,
 * la légende (nom, description, lien) est placée sous l'image, jamais par-dessus.
 * Positionné sous la barre de catégories collante.
 */
function PreviewFrame({ dish }: { dish: Dish | undefined }) {
  if (!dish) return null
  return (
    <div className="sticky top-44">
      <figure className="mx-auto max-w-[420px] rotate-[1.5deg] bg-surface p-3 shadow-2xl shadow-black/25 ring-1 ring-line">
        <div className="relative aspect-[4/5] overflow-hidden">
          {/* La clé relance le zoom lent à chaque nouveau plat. */}
          <Image key={dish.id} src={dish.imageUrl} alt={dish.imageAlt} fill sizes="420px" className="animate-slow-zoom object-cover" />
          <FavoriteButton dishId={dish.id} name={dish.name} className="absolute right-3 top-3" />
        </div>
        <figcaption key={`t-${dish.id}`} className="animate-rise px-1 pb-1 pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-xl font-semibold leading-tight">{dish.name}</span>
            <span className="price shrink-0 text-primary">{gnf(dish.price)}</span>
          </div>
          <p className="mt-1 line-clamp-2 font-display text-[15px] italic text-muted">{dish.description}</p>
          <Link href={`/carte/${dish.slug}`} className="mt-2 inline-block font-mono text-xs uppercase tracking-widest text-primary hover:underline">
            Voir le plat →
          </Link>
        </figcaption>
      </figure>
    </div>
  )
}

export function PrintedMenu({ sections, preview = true }: { sections: MenuSection[]; preview?: boolean }) {
  const first = sections.find((s) => s.dishes.length > 0)?.dishes[0]
  const [activeId, setActiveId] = useState<string | undefined>(first?.id)
  const all = sections.flatMap((s) => s.dishes)
  const active = all.find((d) => d.id === activeId) ?? first

  return (
    <div className={cn('grid gap-10', preview && 'lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14')}>
      <div className="min-w-0 space-y-14">
        {sections.map((section) =>
          section.dishes.length === 0 ? null : (
            <section key={section.title} aria-labelledby={`sec-${section.title}`}>
              <div className="ornament mb-2" aria-hidden>
                <span className="text-xs">◆</span>
              </div>
              <h2 id={`sec-${section.title}`} className="text-center font-display text-3xl font-semibold italic lg:text-4xl">
                {section.title}
              </h2>
              {section.subtitle && <p className="mt-1 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted">{section.subtitle}</p>}
              <ul className="mt-4 divide-y divide-dashed divide-line">
                {section.dishes.map((dish) => (
                  <MenuRow key={dish.id} dish={dish} active={preview && dish.id === active?.id} onActivate={() => setActiveId(dish.id)} />
                ))}
              </ul>
            </section>
          ),
        )}
      </div>
      {preview && (
        <aside className="hidden lg:block" aria-label="Aperçu du plat">
          <PreviewFrame dish={active} />
        </aside>
      )}
    </div>
  )
}

/** Regroupe des plats par catégorie, dans l'ordre d'apparition. */
export function groupByCategory(dishes: Dish[], descriptions: Record<string, string | null> = {}): MenuSection[] {
  const map = new Map<string, MenuSection>()
  for (const d of dishes) {
    const key = d.category.slug
    if (!map.has(key)) map.set(key, { title: d.category.name, subtitle: descriptions[key] ?? null, dishes: [] })
    map.get(key)!.dishes.push(d)
  }
  return [...map.values()]
}
