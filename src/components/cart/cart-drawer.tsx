'use client'

import { ShoppingBag, Trash2 } from 'lucide-react'
import Image from '@/components/ui/photo'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LinkButton } from '@/components/ui/button'
import { ResponsiveDrawer } from '@/components/ui/dialog'
import { EmptyState, QuantityStepper } from '@/components/ui/misc'
import { gnf } from '@/lib/format'
import { cartTotals, useCart } from '@/stores/cart'

/** Tiroir latéral (ordinateur) / feuille inférieure (mobile), total toujours visible. */
export function CartDrawer() {
  const { lines, isOpen, close, setQuantity, remove } = useCart()
  const router = useRouter()
  const { count, subtotal } = cartTotals(lines)

  return (
    <ResponsiveDrawer open={isOpen} onClose={close} title={`Votre panier${count ? ` (${count})` : ''}`}>
      <div className="flex h-full flex-col">
        {lines.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={<ShoppingBag className="h-10 w-10" />} title="Votre panier est vide">
              Parcourez la carte et ajoutez vos plats préférés.
            </EmptyState>
            <LinkButton href="/carte" className="mt-4 w-full" onClick={close}>
              Voir la carte
            </LinkButton>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map((line) => (
                <li key={line.dishId} className="flex gap-4 py-4">
                  <Link href={`/carte/${line.slug}`} onClick={close} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    <Image src={line.imageUrl} alt={line.imageAlt} fill sizes="80px" className="object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/carte/${line.slug}`} onClick={close} className="font-semibold leading-tight hover:text-primary">
                        {line.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(line.dishId)}
                        className="rounded-full p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                        aria-label={`Retirer ${line.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <QuantityStepper
                        value={line.quantity}
                        min={1}
                        onChange={(q) => setQuantity(line.dishId, q)}
                        label={`Quantité de ${line.name}`}
                      />
                      <span className="tabular font-semibold text-primary">{gnf(line.price * line.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="sticky bottom-0 space-y-3 border-t border-line bg-surface p-5">
              <div className="flex items-center justify-between text-lg">
                <span>Sous-total</span>
                <span className="tabular font-semibold">{gnf(subtotal)}</span>
              </div>
              <p className="text-sm text-muted">Frais de livraison calculés à l’étape suivante.</p>
              <button
                type="button"
                onClick={() => {
                  close()
                  router.push('/panier')
                }}
                className="h-12 w-full rounded-[var(--radius-control)] bg-primary font-semibold text-on-primary hover:bg-primary-strong"
              >
                Commander · {gnf(subtotal)}
              </button>
            </div>
          </>
        )}
      </div>
    </ResponsiveDrawer>
  )
}
