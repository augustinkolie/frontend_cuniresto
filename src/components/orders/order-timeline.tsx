import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { trackingSteps } from '@/lib/labels'
import type { OrderStatus, OrderType } from '@/lib/types'

const ORDER: OrderStatus[] = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'SERVED',
  'DELIVERED',
  'COMPLETED',
]

/** Frise de 4 étapes, l'étape en cours en Safran animée (§3.4). */
export function OrderTimeline({ type, status }: { type: OrderType; status: OrderStatus }) {
  const steps = trackingSteps(type)
  const rank = ORDER.indexOf(status)
  const currentIndex = steps.findIndex((s) => s.status.includes(status))
  const reached = (i: number) => {
    const first = steps[i]!.status[0]!
    return rank >= ORDER.indexOf(first)
  }

  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Avancement de la commande">
      {steps.map((step, i) => {
        const done = reached(i) && i !== currentIndex
        const current = i === currentIndex
        return (
          <li key={step.label} className="flex flex-col items-center gap-2 text-center" aria-current={current ? 'step' : undefined}>
            <div className="flex w-full items-center">
              <span className={cn('h-0.5 flex-1', i === 0 ? 'opacity-0' : reached(i) ? 'bg-accent' : 'bg-line')} />
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
                  done && 'border-accent bg-accent text-bg',
                  current && 'animate-pulse-dot border-accent bg-accent/20 text-accent',
                  !done && !current && 'border-line text-muted',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn('h-0.5 flex-1', i === steps.length - 1 ? 'opacity-0' : reached(i + 1) ? 'bg-accent' : 'bg-line')} />
            </div>
            <span className={cn('text-xs font-semibold sm:text-sm', current ? 'text-accent' : done ? 'text-text' : 'text-muted')}>
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
