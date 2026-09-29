'use client'

import { useQuery } from '@tanstack/react-query'
import { FlaskConical } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { errorMessage, get, post } from '@/lib/api'
import { gnf } from '@/lib/format'
import { PAYMENT_PROVIDER } from '@/lib/labels'
import type { CourseEnrollment, Order } from '@/lib/types'

/** Page de développement : remplace le prestataire quand ses clés ne sont pas configurées. */
function Simulation() {
  const params = useSearchParams()
  const router = useRouter()
  const id = params.get('commande') ?? ''
  const enrollmentId = params.get('inscription') ?? ''
  const [pending, setPending] = useState(false)
  const { data: order, isLoading } = useQuery({ queryKey: ['orders', id], queryFn: () => get<Order>(`/orders/${id}`), enabled: !!id })
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ['academy', 'enrollment', enrollmentId],
    queryFn: () => get<CourseEnrollment>(`/academy/enrollments/${enrollmentId}`),
    enabled: !!enrollmentId,
  })

  const decide = async (succeeded: boolean) => {
    setPending(true)
    try {
      if (enrollmentId) {
        await post(`/payments/enrollments/${enrollmentId}/simulate`, { succeeded })
        router.replace(`/academie/inscription/${enrollmentId}?paiement=retour`)
        return
      }
      await post(`/payments/${id}/simulate`, { succeeded })
      router.replace(`/commande/${id}?paiement=retour`)
    } catch (error) {
      toast.error(errorMessage(error))
      setPending(false)
    }
  }

  if ((id && isLoading) || (enrollmentId && enrollmentLoading)) return <PageLoader />
  const subject = order
    ? { provider: order.payment?.provider, amount: order.total, label: `Commande n° ${order.number}` }
    : enrollment
      ? { provider: enrollment.payment?.provider, amount: enrollment.amount, label: `Inscription n° ${enrollment.number} — ${enrollment.courseTitle}` }
      : null
  if (!subject) return <p className="text-center text-muted">Paiement introuvable.</p>

  return (
    <Card className="mx-auto max-w-md space-y-6 p-8 text-center">
      <FlaskConical className="mx-auto h-10 w-10 text-accent" />
      <div>
        <h1 className="text-3xl font-semibold">Paiement simulé</h1>
        <p className="mt-2 text-muted">
          Les identifiants {subject.provider && PAYMENT_PROVIDER[subject.provider]} ne sont pas configurés : aucun argent ne sera débité.
        </p>
      </div>
      <p className="tabular text-3xl font-semibold text-primary">{gnf(subject.amount)}</p>
      <p className="text-sm text-muted">{subject.label}</p>
      <div className="grid gap-3">
        <Button onClick={() => void decide(true)} loading={pending}>
          Simuler un paiement réussi
        </Button>
        <Button variant="secondary" onClick={() => void decide(false)} disabled={pending}>
          Simuler un refus
        </Button>
      </div>
    </Card>
  )
}

export default function SimulationPage() {
  return (
    <div className="px-4 pb-8 pt-32">
      <Suspense>
        <Simulation />
      </Suspense>
    </div>
  )
}
