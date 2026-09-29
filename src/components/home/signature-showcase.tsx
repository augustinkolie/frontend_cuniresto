'use client'

import Image from '@/components/ui/photo'
import Link from 'next/link'
import { useState } from 'react'
import { AddToCartButton } from '@/components/menu/add-to-cart-button'
import { cn } from '@/lib/cn'
import { gnf } from '@/lib/format'
import type { Dish } from '@/lib/types'

/**
 * Les plats signatures, présentés comme une page de carte : liste numérotée à gauche,
 * un seul tirage photo encadré à droite qui suit le plat survolé.
 */
export function SignatureShowcase({ dishes }: { dishes: Dish[] }) {
  const [activeId, setActiveId] = useState(dishes[0]?.id)
  const active = dishes.find((d) => d.id === activeId) ?? dishes[0]
  if (!active) return null
  const activeIndex = dishes.indexOf(active)

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <ol className="divide-y divide-line border-y border-line lg:col-span-7">
        {dishes.map((dish, i) => {
          const isActive = dish.id === active.id
          return (
            <li
              key={dish.id}
              onMouseEnter={() => setActiveId(dish.id)}
              onFocusCapture={() => setActiveId(dish.id)}
              className="group py-8"
            >
              {/* Sur mobile, chaque plat a sa photo ; sur ordinateur, elle s'affiche dans le cadre de droite. */}
              <Link href={`/carte/${dish.slug}`} className="relative mb-5 block aspect-[16/10] overflow-hidden rounded-sm lg:hidden" tabIndex={-1} aria-hidden>
                <Image src={dish.imageUrl} alt="" fill sizes="100vw" className="object-cover" />
              </Link>
              <div className="flex gap-5 sm:gap-8">
                <span
                  className={cn(
                    'w-14 shrink-0 font-display text-5xl font-bold italic leading-none transition-colors sm:w-16 sm:text-6xl',
                    isActive ? 'text-primary' : 'text-line',
                  )}
                  aria-hidden
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="eyebrow">{dish.category.name}</p>
                  <div className="mt-2 flex items-baseline">
                    <h3 className="min-w-0 font-display text-3xl font-bold leading-tight lg:text-4xl">
                      <Link href={`/carte/${dish.slug}`} className="decoration-primary decoration-2 underline-offset-[6px] hover:underline">
                        {dish.name}
                      </Link>
                    </h3>
                    <span className="leader hidden sm:block" aria-hidden />
                    <span className="price ml-auto shrink-0 pl-4 text-xl text-primary sm:ml-0 sm:pl-0 lg:text-2xl">{gnf(dish.price)}</span>
                  </div>
                  <p className="mt-3 max-w-xl font-display text-lg italic text-muted">{dish.description}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <AddToCartButton dish={dish} />
                    <Link href={`/carte/${dish.slug}`} className="font-mono text-xs uppercase tracking-widest text-muted hover:text-primary">
                      Voir le plat →
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Tirage photo encadré, taille contenue, légende façon carte. */}
      <figure className="hidden lg:col-span-5 lg:block">
        <div className="sticky top-32">
          <div className="rotate-[1.5deg] bg-surface p-3 shadow-2xl shadow-black/25 ring-1 ring-line">
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image key={active.id} src={active.imageUrl} alt={active.imageAlt} fill sizes="(min-width: 1280px) 440px, 36vw" className="animate-slow-zoom object-cover" />
            </div>
            <figcaption className="flex items-baseline justify-between gap-3 px-1 pb-1 pt-3">
              <span className="font-display text-lg italic">{active.name}</span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted">n° {String(activeIndex + 1).padStart(2, '0')}</span>
            </figcaption>
          </div>
        </div>
      </figure>
    </div>
  )
}
