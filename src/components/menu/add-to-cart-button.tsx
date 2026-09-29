'use client'

import { Check, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import type { Dish } from '@/lib/types'
import { useCart } from '@/stores/cart'

type DishLike = Pick<Dish, 'id' | 'slug' | 'name' | 'price' | 'imageUrl' | 'imageAlt' | 'isAvailable'>

export function AddToCartButton({
  dish,
  quantity = 1,
  size = 'sm',
  className,
  label = 'Ajouter',
}: {
  dish: DishLike
  quantity?: number
  size?: 'sm' | 'md'
  className?: string
  label?: string
}) {
  const add = useCart((s) => s.add)
  const open = useCart((s) => s.open)
  const [added, setAdded] = useState(false)

  if (!dish.isAvailable) {
    return (
      <Button size={size} variant="secondary" disabled className={className}>
        Indisponible
      </Button>
    )
  }

  return (
    <Button
      size={size}
      className={cn('shrink-0', className)}
      onClick={() => {
        add({ dishId: dish.id, slug: dish.slug, name: dish.name, price: dish.price, imageUrl: dish.imageUrl, imageAlt: dish.imageAlt }, quantity)
        setAdded(true)
        setTimeout(() => setAdded(false), 1400)
        toast.success(`${quantity > 1 ? `${quantity} × ` : ''}${dish.name} ajouté au panier`, {
          action: { label: 'Voir', onClick: open },
        })
      }}
      aria-label={`${label} ${dish.name} au panier`}
    >
      {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {label}
    </Button>
  )
}
