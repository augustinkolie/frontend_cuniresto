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
import type { Order } from '@/lib/types'

/** Page de développement : remplace le prestataire quand ses clés ne sont pas configurées. */
function Simulation() {
  const params = useSearchParams()
  const router = useRouter()
  const id = params.get('commande') ?? ''
  const [pending, setPending] = useState(false)
  const { data: order, isLoading } = useQuery({ queryKey: ['orders', id], queryFn: () => get<Order>(`/orders/${id}`), enabled: !!id })

  const decide = async (succeeded: boolean) => {
    setPending(true)
    try {
      await post(`/payments/${id}/simulate`, { succeeded })
      router.replace(`/commande/${id}?paiement=retour`)
    } catch (error) {
      toast.error(errorMessage(error))
      setPending(false)
    }
  }

  if (isLoading) return <PageLoader />
  if (!order) return <p className="text-center text-muted">Commande introuvable.</p>

  return (
    <Card className="mx-auto max-w-md space-y-6 p-8 text-center">
      <FlaskConical className="mx-auto h-10 w-10 text-accent" />
      <div>
        <h1 className="text-3xl font-semibold">Paiement simulé</h1>
        <p className="mt-2 text-muted">
          Les identifiants {order.payment && PAYMENT_PROVIDER[order.payment.provider]} ne sont pas configurés : aucun argent ne sera débité.
        </p>
      </div>
      <p className="tabular text-3xl font-semibold text-primary">{gnf(order.total)}</p>
      <p className="text-sm text-muted">Commande n° {order.number}</p>
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
