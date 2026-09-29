'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, Clock, Lock, MapPin } from 'lucide-react'
import Image from '@/components/ui/photo'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Choice, PAYMENT_UI } from '@/components/payment/payment-choice'
import { Button, LinkButton } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Card } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useSession } from '@/hooks/use-session'
import { errorMessage, get, post } from '@/lib/api'
import { gnf } from '@/lib/format'
import type { AcademyCourse, EnrollResult, PaymentMethod } from '@/lib/types'

type Method = PaymentMethod['provider']

/** Inscription payante à une formation : choix du moyen de paiement puis redirection vers le prestataire. */
function Enrollment() {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const courseId = params.get('formation') ?? ''
  const { user, isLoading: sessionLoading } = useSession()
  const [method, setMethod] = useState<Method>('ORANGE_MONEY')
  const [phone, setPhone] = useState('')
  const [pending, setPending] = useState(false)

  const { data: courses, isLoading } = useQuery({ queryKey: ['public', 'academy', 'courses'], queryFn: () => get<AcademyCourse[]>('/academy/courses') })
  const { data: methods } = useQuery({ queryKey: ['public', 'payment-methods'], queryFn: () => get<PaymentMethod[]>('/payments/methods') })
  const course = courses?.find((c) => c.id === courseId)

  useEffect(() => {
    if (user?.phone) setPhone(user.phone)
  }, [user])

  if (isLoading || sessionLoading) return <PageLoader />
  if (!course) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-3xl italic">Formation introuvable</p>
        <LinkButton href="/academie" className="mt-6">
          Voir les formations
        </LinkButton>
      </div>
    )
  }

  const full = course.seatsLeft === 0

  const pay = async () => {
    if (method === 'ORANGE_MONEY' && !phone.trim()) return toast.error('Indiquez votre numéro Orange Money')
    setPending(true)
    try {
      const result = await post<EnrollResult>(`/academy/courses/${course.id}/enroll`, {
        paymentMethod: method,
        phone: method === 'ORANGE_MONEY' ? phone.trim() : undefined,
      })
      if (result.checkoutUrl) window.location.href = result.checkoutUrl
      else router.push(`/academie/inscription/${result.enrollmentId}`)
    } catch (error) {
      toast.error(errorMessage(error))
      setPending(false)
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0 space-y-8">
        <Link href="/academie" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-text">
          <ArrowLeft className="h-4 w-4" /> Toutes les formations
        </Link>
        <header>
          <p className="eyebrow">Inscription</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight lg:text-5xl">{course.title}</h1>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <li className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> {course.duration}
            </li>
            {course.schedule && (
              <li className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> {course.schedule}
              </li>
            )}
            <li className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> {course.onSite ? 'Au restaurant Maison Braise' : 'En ligne'}
            </li>
          </ul>
        </header>

        {!user ? (
          <Card className="space-y-4 p-6">
            <h2 className="text-2xl font-medium">Connectez-vous pour réserver votre place</h2>
            <p className="text-muted">Votre inscription et votre reçu seront rattachés à votre compte.</p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href={`/connexion?suite=${encodeURIComponent(`${pathname}?formation=${course.id}`)}`}>Se connecter</LinkButton>
              <LinkButton href={`/inscription?suite=${encodeURIComponent(`${pathname}?formation=${course.id}`)}`} variant="secondary">
                Créer un compte
              </LinkButton>
            </div>
          </Card>
        ) : full ? (
          <Card className="p-6">
            <p className="font-semibold">Cette session est complète.</p>
            <p className="mt-1 text-muted">Écrivez-nous pour être prévenu de la prochaine session.</p>
          </Card>
        ) : (
          <section aria-labelledby="paiement" className="space-y-4">
            <h2 id="paiement" className="text-2xl font-medium">
              Moyen de paiement
            </h2>
            <div role="radiogroup" aria-labelledby="paiement" className="space-y-3">
              {(methods ?? []).map((m) => {
                const ui = PAYMENT_UI[m.provider]
                return (
                  <Choice
                    key={m.provider}
                    selected={method === m.provider}
                    onSelect={() => setMethod(m.provider)}
                    icon={ui.icon}
                    title={ui.label}
                    hint={m.simulated ? `${ui.hint} (mode simulation)` : ui.hint}
                    disabled={!m.enabled}
                  />
                )
              })}
            </div>
            {method === 'ORANGE_MONEY' && (
              <Field label="Numéro Orange Money" hint="La demande de paiement arrive sur ce téléphone">
                {(p) => <Input {...p} type="tel" placeholder="620 00 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} />}
              </Field>
            )}
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <Card className="overflow-hidden">
          <div className="relative aspect-[16/9]">
            <Image src={course.imageUrl} alt="" fill sizes="400px" className="object-cover" />
          </div>
          <div className="space-y-4 p-6">
            <dl className="space-y-2 font-mono text-sm">
              <div className="flex items-baseline">
                <dt className="text-muted">Formation</dt>
                <span className="leader" aria-hidden />
                <dd className="max-w-[60%] text-right">{course.title.split(' — ')[0]}</dd>
              </div>
              <div className="flex items-baseline">
                <dt className="text-muted">Participants</dt>
                <span className="leader" aria-hidden />
                <dd>1 pers.</dd>
              </div>
              <div className="flex items-baseline border-t border-dashed border-line pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <span className="leader" aria-hidden />
                <dd className="font-semibold text-primary">{gnf(course.price)}</dd>
              </div>
            </dl>
            {user && !full && (
              <Button className="w-full" onClick={() => void pay()} loading={pending}>
                Payer {gnf(course.price)}
              </Button>
            )}
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
              <Lock className="h-3.5 w-3.5" /> Paiement sécurisé · reçu envoyé par e-mail
            </p>
          </div>
        </Card>
      </aside>
    </div>
  )
}

export default function EnrollmentPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-28 lg:px-8 lg:pt-36">
      <Suspense fallback={<PageLoader />}>
        <Enrollment />
      </Suspense>
    </div>
  )
}
