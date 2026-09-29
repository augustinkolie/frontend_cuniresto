'use client'

import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, CalendarDays, Hourglass, MapPin, XCircle } from 'lucide-react'
import { useParams } from 'next/navigation'
import { LinkButton } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { get } from '@/lib/api'
import { gnf } from '@/lib/format'
import { PAYMENT_PROVIDER } from '@/lib/labels'
import type { CourseEnrollment } from '@/lib/types'

/** Suivi d'une inscription : l'état se met à jour dès que le prestataire confirme le paiement. */
export default function EnrollmentStatusPage() {
  const { id } = useParams<{ id: string }>()
  const { data: e, isLoading } = useQuery({
    queryKey: ['academy', 'enrollment', id],
    queryFn: () => get<CourseEnrollment>(`/academy/enrollments/${id}`),
    refetchInterval: (q) => (q.state.data?.status === 'PENDING_PAYMENT' ? 3000 : false),
  })

  return (
    <div className="mx-auto max-w-xl px-4 pb-16 pt-28 lg:pt-36">
      {isLoading ? (
        <PageLoader />
      ) : !e ? (
        <p className="text-center text-muted">Inscription introuvable.</p>
      ) : (
        <Card className="space-y-6 p-8 text-center">
          {e.status === 'CONFIRMED' ? (
            <>
              <CalendarCheck className="mx-auto h-12 w-12 text-success" />
              <div>
                <h1 className="font-display text-4xl font-bold">Votre place est réservée</h1>
                <p className="mt-2 text-muted">Paiement reçu. Un e-mail de confirmation vient de vous être envoyé.</p>
              </div>
            </>
          ) : e.status === 'PENDING_PAYMENT' ? (
            <>
              <Hourglass className="mx-auto h-12 w-12 animate-pulse text-accent" />
              <div>
                <h1 className="font-display text-4xl font-bold">Paiement en cours</h1>
                <p className="mt-2 text-muted">Nous attendons la confirmation de votre paiement. Cette page se met à jour toute seule.</p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="mx-auto h-12 w-12 text-danger" />
              <div>
                <h1 className="font-display text-4xl font-bold">Paiement non abouti</h1>
                <p className="mt-2 text-muted">Aucun montant n’a été débité. Vous pouvez réessayer avec le même moyen ou un autre.</p>
              </div>
            </>
          )}

          <dl className="space-y-2 text-left font-mono text-sm">
            {[
              ['Formation', e.courseTitle],
              ['Inscription n°', String(e.number)],
              ['Montant', gnf(e.amount)],
              ['Paiement', e.payment ? PAYMENT_PROVIDER[e.payment.provider] : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline">
                <dt className="shrink-0 text-muted">{label}</dt>
                <span className="leader" aria-hidden />
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>

          {e.course && (
            <ul className="space-y-1 text-sm text-muted">
              {e.course.schedule && (
                <li className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" /> {e.course.schedule}
                </li>
              )}
              {e.course.onSite && (
                <li className="flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Au restaurant Maison Braise
                </li>
              )}
            </ul>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            {e.status === 'PENDING_PAYMENT' && e.payment?.checkoutUrl && <LinkButton href={e.payment.checkoutUrl}>Reprendre le paiement</LinkButton>}
            {e.status === 'CANCELLED' && e.courseId && <LinkButton href={`/academie/inscription?formation=${e.courseId}`}>Réessayer</LinkButton>}
            <LinkButton href="/compte/formations" variant="secondary">
              Mes formations
            </LinkButton>
          </div>
        </Card>
      )}
    </div>
  )
}
