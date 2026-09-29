'use client'

import { useState } from 'react'
import { QuantityStepper } from '@/components/ui/misc'
import { gnf } from '@/lib/format'
import type { Dish } from '@/lib/types'
import { AddToCartButton } from './add-to-cart-button'

export function DishPurchase({ dish }: { dish: Dish }) {
  const [quantity, setQuantity] = useState(1)
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <QuantityStepper value={quantity} min={1} max={Math.min(50, Math.max(1, dish.stock))} onChange={setQuantity} label="Quantité" />
      <AddToCartButton
        dish={dish}
        quantity={quantity}
        size="md"
        className="flex-1"
        label={`Ajouter · ${gnf(dish.price * quantity)}`}
      />
    </div>
  )
}
