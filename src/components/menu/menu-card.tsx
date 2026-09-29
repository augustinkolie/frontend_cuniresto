'use client'

import { Clock, Flame, Leaf, Plus, Star } from 'lucide-react'
import Image from '@/components/ui/photo'
import Link from 'next/link'
import { toast } from 'sonner'
import { gnf } from '@/lib/format'
import type { Dish } from '@/lib/types'
import { useCart } from '@/stores/cart'
import { FavoriteButton } from './favorite-button'

/** Carte d'un plat pour la page Carte : photo, catégorie, nom, infos, prix. */
export function MenuCard({ dish, priority = false }: { dish: Dish; priority?: boolean }) {
  const add = useCart((s) => s.add)
  const open = useCart((s) => s.open)

  return (
    <article className="group relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-line bg-surface transition-shadow hover:shadow-xl hover:shadow-black/10">
      <Link href={`/carte/${dish.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-surface-2" tabIndex={-1} aria-hidden>
        <Image
          src={dish.imageUrl}
          alt={dish.imageAlt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {dish.tags.includes('signature') && (
          <span className="absolute left-3 top-3 rounded-sm bg-tomato px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-on-tomato">
            Signature
          </span>
        )}
      </Link>
      <FavoriteButton dishId={dish.id} name={dish.name} className="absolute right-3 top-3 z-10" />

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm text-muted">{dish.category.name}</p>
        <h3 className="mt-2 font-display text-2xl font-semibold leading-tight">
          <Link href={`/carte/${dish.slug}`} className="hover:text-primary">
            {dish.name}
          </Link>
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden /> {dish.prepTimeMinutes} min
          </span>
          {dish.ratingCount > 0 && (
            <span className="inline-flex items-center gap-1 text-accent">
              <Star className="h-4 w-4" fill="currentColor" aria-hidden /> {dish.ratingAvg.toFixed(1)}
              <span className="sr-only">sur 5</span>
            </span>
          )}
          {dish.tags.includes('vegetarian') && (
            <span className="inline-flex items-center gap-1 text-success">
              <Leaf className="h-4 w-4" aria-hidden /> Végétarien
            </span>
          )}
          {dish.tags.includes('spicy') && (
            <span className="inline-flex items-center gap-1 text-accent">
              <Flame className="h-4 w-4" aria-hidden /> Épicé
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="price text-xl font-medium text-primary">{gnf(dish.price)}</span>
          {dish.isAvailable ? (
            <button
              type="button"
              onClick={() => {
                add({ dishId: dish.id, slug: dish.slug, name: dish.name, price: dish.price, imageUrl: dish.imageUrl, imageAlt: dish.imageAlt })
                toast.success(`${dish.name} ajouté au panier`, { action: { label: 'Voir', onClick: open } })
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/60 text-primary transition-colors hover:bg-primary hover:text-on-primary"
              aria-label={`Ajouter ${dish.name} au panier`}
            >
              <Plus className="h-5 w-5" />
            </button>
          ) : (
            <span className="font-mono text-xs uppercase text-muted">Épuisé</span>
          )}
        </div>
      </div>
    </article>
  )
}
