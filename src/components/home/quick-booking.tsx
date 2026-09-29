'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { todayIso } from '@/lib/format'

/** Widget de réservation rapide : pré-remplit la page de réservation. */
export function QuickBooking() {
  const router = useRouter()
  const [date, setDate] = useState(todayIso())
  const [partySize, setPartySize] = useState(2)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        router.push(`/reserver?date=${date}&couverts=${partySize}`)
      }}
      className="grid gap-3 sm:grid-cols-[minmax(11rem,1fr)_auto_auto] sm:items-end lg:w-[34rem]"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="qb-date" className="font-mono text-xs uppercase tracking-widest text-muted">
          Date
        </label>
        <input
          id="qb-date"
          type="date"
          min={todayIso()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-12 rounded-[var(--radius-control)] border border-line bg-bg px-4 focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase tracking-widest text-muted" id="qb-guests">
          Couverts
        </span>
        <div className="flex h-12 items-center rounded-[var(--radius-control)] border border-line bg-bg" role="group" aria-labelledby="qb-guests">
          <button type="button" className="h-full w-11 text-lg" onClick={() => setPartySize((p) => Math.max(1, p - 1))} aria-label="Moins de couverts">
            −
          </button>
          <span className="tabular w-8 text-center font-semibold" aria-live="polite">
            {partySize}
          </span>
          <button type="button" className="h-full w-11 text-lg" onClick={() => setPartySize((p) => Math.min(20, p + 1))} aria-label="Plus de couverts">
            +
          </button>
        </div>
      </div>
      <button type="submit" className="h-12 whitespace-nowrap rounded-[var(--radius-control)] bg-primary px-6 font-semibold text-on-primary hover:bg-primary-strong">
        Voir les créneaux
      </button>
    </form>
  )
}
