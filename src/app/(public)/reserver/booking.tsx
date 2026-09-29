'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, CalendarDays } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'
import { Button, LinkButton } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Card, QuantityStepper } from '@/components/ui/misc'
import { Skeleton } from '@/components/ui/spinner'
import { useSession } from '@/hooks/use-session'
import { errorMessage, get, post } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatDate, todayIso } from '@/lib/format'
import { reservationSchema } from '@/lib/schemas'
import type { Availability, Reservation } from '@/lib/types'

const DAYS_SHOWN = 14

function nextDays(count: number): string[] {
  const base = new Date(`${todayIso()}T00:00:00Z`)
  return Array.from({ length: count }, (_, i) => new Date(base.getTime() + i * 86_400_000).toISOString().slice(0, 10))
}

export function Booking() {
  const params = useSearchParams()
  const { user } = useSession()
  const initialDate = params.get('date') ?? todayIso()
  const [date, setDate] = useState(initialDate >= todayIso() ? initialDate : todayIso())
  const [partySize, setPartySize] = useState(Math.min(20, Math.max(1, Number(params.get('couverts')) || 2)))
  const [slot, setSlot] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<Reservation | null>(null)
  const days = useMemo(() => nextDays(DAYS_SHOWN), [])

  // Disponibilités en direct, sans cache (§4.1).
  const { data, isFetching } = useQuery({
    queryKey: ['public', 'availability', date, partySize],
    queryFn: () => get<Availability>('/reservations/availability', { date, partySize }),
    staleTime: 0,
    refetchInterval: 60_000,
  })

  useEffect(() => setSlot(null), [date, partySize])

  const form = useForm<z.infer<typeof reservationSchema>>({ resolver: zodResolver(reservationSchema) })
  const { errors, isSubmitting } = form.formState

  useEffect(() => {
    if (!user) return
    form.reset({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone ?? '' })
  }, [user, form])

  const submit = form.handleSubmit(async (values) => {
    if (!slot) return toast.error('Choisissez un horaire')
    try {
      const reservation = await post<Reservation>('/reservations', { ...values, date, timeSlot: slot, partySize })
      setConfirmed(reservation)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  })

  if (confirmed) {
    return (
      <Card className="mx-auto max-w-xl space-y-5 p-8 text-center">
        <CalendarCheck className="mx-auto h-12 w-12 text-success" />
        <h2 className="text-3xl font-semibold">Demande envoyée !</h2>
        <p className="text-muted">
          Table pour <strong className="text-text">{confirmed.partySize}</strong> le{' '}
          <strong className="text-text">{formatDate(`${date}T12:00:00Z`, { weekday: 'long' })}</strong> à{' '}
          <strong className="text-text">{confirmed.timeSlot}</strong>. Un e-mail de confirmation vous a été envoyé à {confirmed.email}.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {user && <LinkButton href="/compte/reservations">Mes réservations</LinkButton>}
          <LinkButton href="/carte" variant="secondary">
            Voir la carte
          </LinkButton>
        </div>
      </Card>
    )
  }

  const freeSlots = data?.slots.filter((s) => s.available) ?? []
  const services = [
    { name: 'Midi', slots: freeSlots.filter((s) => s.time < '15:00') },
    { name: 'Soir', slots: freeSlots.filter((s) => s.time >= '15:00') },
  ].filter((g) => g.slots.length > 0)
  const stepTitle = 'flex items-baseline gap-3 font-display text-2xl'
  const stepNumber = 'font-mono text-sm text-primary'

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
      <div className="min-w-0">
        {/* 01 — Date */}
        <section aria-labelledby="date-label" className="border-t border-line pt-6">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 id="date-label" className={stepTitle}>
              <span className={stepNumber}>01</span> La date
            </h2>
            <label className="relative inline-flex cursor-pointer items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted hover:text-primary">
              <CalendarDays className="h-4 w-4" aria-hidden />
              Autre date
              <input
                type="date"
                min={todayIso()}
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Choisir une autre date"
              />
            </label>
          </div>
          <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0" role="radiogroup" aria-labelledby="date-label">
            {days.map((d) => {
              const dt = new Date(`${d}T12:00:00Z`)
              const selected = d === date
              return (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setDate(d)}
                  className={cn(
                    'flex w-14 shrink-0 flex-col items-center gap-1 rounded-[var(--radius-control)] py-2.5 transition-colors',
                    selected ? 'bg-primary text-on-primary' : 'hover:bg-text/5',
                  )}
                >
                  <span className={cn('font-mono text-[10px] uppercase tracking-wider', !selected && 'text-muted')}>
                    {dt.toLocaleDateString('fr-FR', { weekday: 'short', timeZone: 'UTC' }).replace('.', '')}
                  </span>
                  <span className="font-display text-2xl leading-none">{dt.getUTCDate()}</span>
                  <span className={cn('font-mono text-[10px]', !selected && 'text-muted')}>
                    {dt.toLocaleDateString('fr-FR', { month: 'short', timeZone: 'UTC' }).replace('.', '')}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* 02 — Couverts */}
        <section className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
          <h2 className={stepTitle}>
            <span className={stepNumber}>02</span> Les couverts
          </h2>
          <QuantityStepper value={partySize} min={1} max={20} onChange={setPartySize} label="Nombre de couverts" />
        </section>

        {/* 03 — Horaire : seulement les créneaux libres, regroupés par service */}
        <section aria-labelledby="slot-label" className="mt-10 border-t border-line pt-6">
          <h2 id="slot-label" className={cn(stepTitle, 'mb-5')}>
            <span className={stepNumber}>03</span> L’horaire
          </h2>
          {!data ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-20" />
              ))}
            </div>
          ) : !data.isOpen || services.length === 0 ? (
            <p className="font-display text-lg italic text-muted">
              {data.isOpen ? 'Plus aucune table libre ce jour-là.' : `Fermé ce jour-là${data.closureReason ? ` (${data.closureReason})` : ''}.`} Choisissez une
              autre date.
            </p>
          ) : (
            <div className={cn('space-y-4', isFetching && 'opacity-70')} role="radiogroup" aria-labelledby="slot-label">
              {services.map((g) => (
                <div key={g.name} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                  <p className="w-14 shrink-0 font-mono text-xs uppercase tracking-widest text-muted sm:pt-3.5">{g.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {g.slots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        role="radio"
                        aria-checked={slot === s.time}
                        onClick={() => setSlot(s.time)}
                        title={`${s.remaining} places restantes`}
                        className={cn(
                          'tabular h-11 w-20 rounded-[var(--radius-control)] border font-mono text-sm transition-colors',
                          slot === s.time ? 'border-primary bg-primary text-on-primary' : 'border-line hover:border-primary hover:text-primary',
                        )}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 04 — Récapitulatif façon ticket, puis coordonnées */}
      <form onSubmit={submit} className="min-w-0 lg:sticky lg:top-28 lg:self-start" noValidate>
        <div className="rounded-sm border border-line bg-surface">
          <dl className="space-y-2 border-b border-dashed border-line px-6 py-5 font-mono text-sm">
            {[
              ['Date', formatDate(`${date}T12:00:00Z`, { weekday: 'long' })],
              ['Couverts', `${partySize} pers.`],
              ['Heure', slot ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline">
                <dt className="text-muted">{label}</dt>
                <span className="leader" aria-hidden />
                <dd className={cn(label === 'Heure' && slot && 'text-primary')}>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="space-y-4 p-6">
            <h2 className={stepTitle}>
              <span className={stepNumber}>04</span> Vos coordonnées
            </h2>
            <div className="space-y-4">
              <Field label="Prénom" error={errors.firstName?.message}>
                {(p) => <Input {...p} autoComplete="given-name" {...form.register('firstName')} />}
              </Field>
              <Field label="Nom" error={errors.lastName?.message}>
                {(p) => <Input {...p} autoComplete="family-name" {...form.register('lastName')} />}
              </Field>
            </div>
            <Field label="E-mail" error={errors.email?.message}>
              {(p) => <Input {...p} type="email" autoComplete="email" {...form.register('email')} />}
            </Field>
            <Field label="Téléphone" error={errors.phone?.message}>
              {(p) => <Input {...p} type="tel" autoComplete="tel" {...form.register('phone')} />}
            </Field>
            <Field label="Message (facultatif)" error={errors.message?.message}>
              {(p) => <Textarea {...p} rows={2} placeholder="Anniversaire, chaise bébé, allergie…" {...form.register('message')} />}
            </Field>
            <Button type="submit" className="w-full" loading={isSubmitting} disabled={!slot}>
              {slot ? `Réserver pour ${slot}` : 'Choisissez un horaire'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
