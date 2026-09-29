import { CalendarDays, Check, Clock, MapPin, Users } from 'lucide-react'
import Image from '@/components/ui/photo'
import { LinkButton } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { gnf } from '@/lib/format'
import type { AcademyCourse } from '@/lib/types'

/** « Découverte — Initiation… » → nom de la formule et sous-titre. */
function splitTitle(title: string): [string, string | null] {
  const [name, ...rest] = title.split(' — ')
  return [name ?? title, rest.length ? rest.join(' — ') : null]
}

/** Formules de cuisine africaine données au restaurant, présentées comme une grille tarifaire. */
export function OnSiteOffers({ offers }: { offers: AcademyCourse[] }) {
  return (
    <ul className="grid items-stretch gap-6 lg:grid-cols-3">
      {offers.map((offer) => {
        const [name, subtitle] = splitTitle(offer.title)
        const full = offer.seatsLeft === 0
        const fewLeft = offer.seatsLeft !== null && offer.seatsLeft > 0 && offer.seatsLeft <= 3
        return (
          <li key={offer.id} className="flex">
            <article
              className={cn(
                'relative flex w-full flex-col overflow-hidden rounded-[var(--radius-card)] border bg-surface',
                offer.featured ? 'border-primary shadow-2xl shadow-black/20 ring-1 ring-primary lg:-my-4' : 'border-line',
              )}
            >
              {offer.featured && (
                <p className="bg-primary py-1.5 text-center font-mono text-[11px] font-semibold uppercase tracking-widest text-on-primary">
                  La plus choisie
                </p>
              )}
              <div className="relative aspect-[16/9]">
                <Image src={offer.imageUrl} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover object-[center_25%]" />
                <span className="absolute left-3 top-3 rounded-full bg-bg/90 px-2.5 py-1 text-xs font-semibold text-text shadow">{offer.level}</span>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-3xl font-bold">{name}</h3>
                {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}

                <p className="mt-5 flex items-baseline gap-2">
                  <span className="price text-4xl text-primary">{gnf(offer.price)}</span>
                  <span className="text-sm text-muted">/ personne</span>
                </p>

                <ul className="mt-5 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden /> {offer.duration}
                  </li>
                  {offer.schedule && (
                    <li className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden /> {offer.schedule}
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden /> Au restaurant, avec notre brigade
                  </li>
                  {offer.seats !== null && (
                    <li className={cn('flex items-center gap-2', (full || fewLeft) && 'font-semibold text-accent')}>
                      <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {full ? 'Session complète' : fewLeft ? `Plus que ${offer.seatsLeft} place${offer.seatsLeft! > 1 ? 's' : ''}` : `${offer.seats} places par session`}
                    </li>
                  )}
                </ul>

                {offer.perks.length > 0 && (
                  <div className="mt-5 border-t border-line pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Inclus</p>
                    <ul className="space-y-1.5 text-sm">
                      {offer.perks.map((perk) => (
                        <li key={perk} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /> {perk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {offer.modules.length > 0 && (
                  <details className="group mt-4 border-t border-line pt-4 text-sm">
                    <summary className="cursor-pointer list-none font-semibold text-primary">
                      Programme ({offer.modules.length} étapes) <span className="inline-block transition-transform group-open:rotate-90">›</span>
                    </summary>
                    <ol className="mt-2 space-y-1 text-muted">
                      {offer.modules.map((m, i) => (
                        <li key={m.title} className="flex justify-between gap-3">
                          <span>
                            {i + 1}. {m.title}
                          </span>
                          <span className="tabular shrink-0">{m.duration}</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}

                <div className="mt-auto pt-6">
                  {full ? (
                    <p className="rounded-[var(--radius-control)] border border-line py-3 text-center text-sm font-semibold text-muted">Complet — prochaine session bientôt</p>
                  ) : (
                    <LinkButton href={`/academie/inscription?formation=${offer.id}`} variant={offer.featured ? 'primary' : 'secondary'} className="w-full">
                      Réserver ma place
                    </LinkButton>
                  )}
                  <p className="mt-2 text-center text-xs text-muted">Orange Money · Carte bancaire · PayPal</p>
                </div>
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
