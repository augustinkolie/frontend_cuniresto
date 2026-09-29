'use client'

import { type Bike, CreditCard, Smartphone, Wallet } from 'lucide-react'
import { cn } from '@/lib/cn'

// Choix d'une option (moyen de paiement, livraison…) : partagé par le panier et les inscriptions.

export const PAYMENT_UI = {
  ORANGE_MONEY: { label: 'Orange Money', hint: 'Paiement mobile, validé sur votre téléphone', icon: Smartphone },
  CARD: { label: 'Carte bancaire', hint: 'Visa, Mastercard — paiement sécurisé Stripe', icon: CreditCard },
  PAYPAL: { label: 'PayPal', hint: 'Compte PayPal ou carte via PayPal', icon: Wallet },
} as const

export function Choice({
  selected,
  onSelect,
  icon: Icon,
  title,
  hint,
  aside,
  disabled,
}: {
  selected: boolean
  onSelect: () => void
  icon: typeof Bike
  title: string
  hint: string
  aside?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-4 rounded-[var(--radius-control)] border p-4 text-left transition-colors disabled:opacity-40',
        selected ? 'border-primary bg-primary/10' : 'border-line hover:border-text/40',
      )}
    >
      <Icon className={cn('h-6 w-6 shrink-0', selected ? 'text-primary' : 'text-muted')} aria-hidden />
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{hint}</span>
      </span>
      {aside && <span className="tabular text-sm font-semibold">{aside}</span>}
    </button>
  )
}
