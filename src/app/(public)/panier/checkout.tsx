'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Bike, CreditCard, Package, ShoppingBag, Smartphone, Store, Trash2, Wallet, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, LinkButton } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Card, EmptyState, QuantityStepper } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useSession } from '@/hooks/use-session'
import { errorMessage, get, post } from '@/lib/api'
import { cn } from '@/lib/cn'
import { gnf } from '@/lib/format'
import { type CheckoutValues, checkoutSchema } from '@/lib/schemas'
import type { Address, PaymentMethod, PlaceOrderResult } from '@/lib/types'
import { cartTotals, useCart } from '@/stores/cart'

const PAYMENT_UI = {
  ORANGE_MONEY: { label: 'Orange Money', hint: 'Paiement mobile, validé sur votre téléphone', icon: Smartphone },
  CARD: { label: 'Carte bancaire', hint: 'Visa, Mastercard — paiement sécurisé Stripe', icon: CreditCard },
  PAYPAL: { label: 'PayPal', hint: 'Compte PayPal ou carte via PayPal', icon: Wallet },
} as const

function Choice({
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

export function Checkout() {
  const { user, isLoading } = useSession()
  const { lines, setQuantity, remove } = useCart()
  const router = useRouter()
  const params = useSearchParams()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const status = params.get('paiement')
    if (status === 'annule') toast.error('Paiement annulé. Votre panier est conservé.')
    if (status === 'erreur') toast.error('Le paiement n’a pas abouti.')
  }, [params])

  const { data: methods } = useQuery({
    queryKey: ['public', 'payment-methods'],
    queryFn: () => get<PaymentMethod[]>('/payments/methods'),
  })
  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => get<Address[]>('/me/addresses'),
    enabled: !!user,
  })

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { type: 'DELIVERY', mode: 'STANDARD', paymentMethod: 'ORANGE_MONEY' },
  })
  const [type, mode, paymentMethod] = useWatch({ control: form.control, name: ['type', 'mode', 'paymentMethod'] })
  const { errors, isSubmitting } = form.formState

  useEffect(() => {
    if (!user) return
    form.setValue('contactName', `${user.firstName} ${user.lastName}`)
    if (user.phone) form.setValue('contactPhone', user.phone)
    if (user.orangeMoneyNumber) form.setValue('orangeMoneyPhone', user.orangeMoneyNumber)
  }, [user, form])

  useEffect(() => {
    const def = addresses?.find((a) => a.isDefault) ?? addresses?.[0]
    if (def && !form.getValues('street')) {
      form.setValue('street', def.street)
      form.setValue('city', def.city)
    }
  }, [addresses, form])

  const { data: estimate } = useQuery({
    queryKey: ['public', 'estimate', mode],
    queryFn: () => get<{ fee: number; estimatedMinutes: number }>('/orders/delivery-estimate', { mode }),
    enabled: type === 'DELIVERY',
  })

  if (!mounted || isLoading) return <PageLoader />

  const { count, subtotal } = cartTotals(lines)
  const fee = type === 'DELIVERY' ? (estimate?.fee ?? 0) : 0

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-10 w-10" />}
        title="Votre panier est vide"
        action={<LinkButton href="/carte">Découvrir la carte</LinkButton>}
      >
        Ajoutez des plats depuis la carte pour passer commande.
      </EmptyState>
    )
  }

  const submit = form.handleSubmit(async (v) => {
    try {
      const result = await post<PlaceOrderResult>('/orders', {
        type: v.type,
        items: lines.map((l) => ({ dishId: l.dishId, quantity: l.quantity })),
        contactName: v.contactName || undefined,
        contactPhone: v.contactPhone,
        delivery: v.type === 'DELIVERY' ? { mode: v.mode, street: v.street, city: v.city } : undefined,
        instructions: v.instructions || undefined,
        tastePreferences: v.tastePreferences || undefined,
        paymentMethod: v.paymentMethod,
        orangeMoneyPhone: v.paymentMethod === 'ORANGE_MONEY' ? v.orangeMoneyPhone || v.contactPhone : undefined,
      })
      useCart.getState().clear()
      if (result.payment.checkoutUrl) {
        window.location.href = result.payment.checkoutUrl
      } else {
        router.push(`/commande/${result.orderId}`)
      }
    } catch (error) {
      toast.error(errorMessage(error))
    }
  })

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]" noValidate>
      <div className="min-w-0 space-y-10">
        <section aria-labelledby="articles">
          <h2 id="articles" className="mb-4 text-2xl font-medium">
            Vos articles ({count})
          </h2>
          <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line">
            {lines.map((l) => (
              <li key={l.dishId} className="flex items-center gap-4 p-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <Image src={l.imageUrl} alt={l.imageAlt} fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/carte/${l.slug}`} className="font-semibold hover:text-primary">
                    {l.name}
                  </Link>
                  <p className="tabular text-sm text-muted">{gnf(l.price)}</p>
                </div>
                <QuantityStepper value={l.quantity} min={1} onChange={(q) => setQuantity(l.dishId, q)} label={`Quantité de ${l.name}`} />
                <button type="button" onClick={() => remove(l.dishId)} className="rounded-full p-2 text-muted hover:text-danger" aria-label={`Retirer ${l.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {!user ? (
          <Card className="p-6">
            <h2 className="text-2xl font-medium">Connectez-vous pour commander</h2>
            <p className="mt-2 text-muted">Votre panier est conservé. Le suivi de commande et les points de fidélité nécessitent un compte.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton href="/connexion?suite=/panier">Se connecter</LinkButton>
              <LinkButton href="/inscription?suite=/panier" variant="secondary">
                Créer un compte
              </LinkButton>
            </div>
          </Card>
        ) : (
          <>
            <section aria-labelledby="mode">
              <h2 id="mode" className="mb-4 text-2xl font-medium">
                Livraison ou retrait
              </h2>
              <div role="radiogroup" aria-labelledby="mode" className="grid gap-3 sm:grid-cols-2">
                <Choice selected={type === 'DELIVERY'} onSelect={() => form.setValue('type', 'DELIVERY')} icon={Bike} title="Livraison" hint="Chez vous ou au bureau" />
                <Choice selected={type === 'PICKUP'} onSelect={() => form.setValue('type', 'PICKUP')} icon={Store} title="À emporter" hint="Retrait au restaurant" aside="Gratuit" />
              </div>
              {type === 'DELIVERY' && (
                <div className="mt-5 space-y-4">
                  <div role="radiogroup" aria-label="Rapidité" className="grid gap-3 sm:grid-cols-2">
                    <Choice selected={mode === 'STANDARD'} onSelect={() => form.setValue('mode', 'STANDARD')} icon={Package} title="Standard" hint="Environ 30 min" aside={gnf(3000)} />
                    <Choice selected={mode === 'EXPRESS'} onSelect={() => form.setValue('mode', 'EXPRESS')} icon={Zap} title="Express" hint="Environ 15 min" aside={gnf(5000)} />
                  </div>
                  {addresses && addresses.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {addresses.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            form.setValue('street', a.street)
                            form.setValue('city', a.city)
                            if (a.instructions) form.setValue('instructions', a.instructions)
                          }}
                          className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:border-accent"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                    <Field label="Adresse" error={errors.street?.message}>
                      {(p) => <Input {...p} autoComplete="street-address" placeholder="Quartier, rue, repère" {...form.register('street')} />}
                    </Field>
                    <Field label="Ville" error={errors.city?.message}>
                      {(p) => <Input {...p} autoComplete="address-level2" placeholder="Conakry" {...form.register('city')} />}
                    </Field>
                  </div>
                </div>
              )}
            </section>

            <section aria-labelledby="contact" className="space-y-4">
              <h2 id="contact" className="text-2xl font-medium">
                Contact
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom" error={errors.contactName?.message}>
                  {(p) => <Input {...p} autoComplete="name" {...form.register('contactName')} />}
                </Field>
                <Field label="Téléphone" error={errors.contactPhone?.message}>
                  {(p) => <Input {...p} type="tel" autoComplete="tel" placeholder="620 00 00 00" {...form.register('contactPhone')} />}
                </Field>
              </div>
              <Field label="Instructions (facultatif)" hint="Code d’accès, étage, suppléments…" error={errors.instructions?.message}>
                {(p) => <Textarea {...p} rows={2} {...form.register('instructions')} />}
              </Field>
              <Field label="Préférences de goût (facultatif)" hint="Peu pimenté, sans oignon…" error={errors.tastePreferences?.message}>
                {(p) => <Input {...p} {...form.register('tastePreferences')} />}
              </Field>
            </section>

            <section aria-labelledby="paiement" className="space-y-4">
              <h2 id="paiement" className="text-2xl font-medium">
                Paiement
              </h2>
              <div role="radiogroup" aria-labelledby="paiement" className="space-y-3">
                {(methods ?? []).map((m) => {
                  const ui = PAYMENT_UI[m.provider]
                  return (
                    <Choice
                      key={m.provider}
                      selected={paymentMethod === m.provider}
                      onSelect={() => form.setValue('paymentMethod', m.provider)}
                      icon={ui.icon}
                      title={ui.label}
                      hint={m.simulated ? `${ui.hint} (mode simulation)` : ui.hint}
                      disabled={!m.enabled}
                    />
                  )
                })}
              </div>
              {paymentMethod === 'ORANGE_MONEY' && (
                <Field label="Numéro Orange Money" hint="Laissez vide pour utiliser votre téléphone de contact" error={errors.orangeMoneyPhone?.message}>
                  {(p) => <Input {...p} type="tel" placeholder="620 00 00 00" {...form.register('orangeMoneyPhone')} />}
                </Field>
              )}
            </section>
          </>
        )}
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <Card className="space-y-3 p-6">
          <h2 className="text-2xl font-medium">Récapitulatif</h2>
          <dl className="tabular space-y-2">
            <div className="flex justify-between">
              <dt className="text-muted">Sous-total</dt>
              <dd>{gnf(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{type === 'DELIVERY' ? 'Livraison' : 'Retrait'}</dt>
              <dd>{fee ? gnf(fee) : 'Gratuit'}</dd>
            </div>
            {type === 'DELIVERY' && estimate && (
              <p className="text-sm text-muted">Livraison estimée en {estimate.estimatedMinutes} min après préparation.</p>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-xl font-semibold">
              <dt>Total</dt>
              <dd className="text-primary">{gnf(subtotal + fee)}</dd>
            </div>
          </dl>
          {user && (
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Payer {gnf(subtotal + fee)}
            </Button>
          )}
          <p className="text-center text-xs text-muted">Paiement sécurisé. Vous gagnez des points de fidélité à chaque commande.</p>
        </Card>
      </aside>
    </form>
  )
}
