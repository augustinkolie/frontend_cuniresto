'use client'

import { useQuery } from '@tanstack/react-query'
import { Building2, CalendarClock, FileText, Percent } from 'lucide-react'
import { useState } from 'react'
import { LinkButton } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useSession } from '@/hooks/use-session'
import { get } from '@/lib/api'
import type { Company } from '@/lib/types'
import { CompanySpace } from './company-space'

const BENEFITS = [
  { icon: Percent, title: 'Tarifs négociés', text: 'Remise sur toute la carte ou prix spécifiques par plat.' },
  { icon: CalendarClock, title: 'Commandes récurrentes', text: 'Déjeuners d’équipe livrés chaque jour ou certains jours de la semaine.' },
  { icon: FileText, title: 'Facturation mensuelle', text: 'Une facture unique avec TVA, téléchargeable en PDF, paiement à 30 jours.' },
  { icon: Building2, title: 'Gestion des équipes', text: 'Ajoutez vos collaborateurs : chacun commande, vous suivez tout.' },
]

export default function CorporatePage() {
  const { user, isLoading } = useSession()
  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => get<Company[]>('/companies'),
    enabled: !!user,
  })
  const [selected, setSelected] = useState<string | null>(null)
  const current = selected ?? companies?.[0]?.id ?? null

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-28 lg:px-8 lg:pt-36">
      <header className="mb-10 max-w-3xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">Entreprises</p>
        <h1 className="text-[40px] font-semibold lg:text-[64px]">Les repas de vos équipes, simplifiés</h1>
      </header>

      {isLoading || (user && loadingCompanies) ? (
        <PageLoader />
      ) : current ? (
        <>
          {companies && companies.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {companies.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={c.id === current}
                  onClick={() => setSelected(c.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${c.id === current ? 'border-primary bg-primary text-on-primary' : 'border-line'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
          <CompanySpace companyId={current} />
        </>
      ) : (
        <>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Card className="h-full p-6">
                  <Icon className="h-7 w-7 text-primary" aria-hidden />
                  <h2 className="mt-4 text-xl">{title}</h2>
                  <p className="mt-2 text-muted">{text}</p>
                </Card>
              </li>
            ))}
          </ul>
          <Card className="mt-10 flex flex-wrap items-center justify-between gap-6 p-8">
            <div>
              <h2 className="text-2xl font-medium">Ouvrir un compte entreprise</h2>
              <p className="mt-2 text-muted">
                {user
                  ? 'Votre compte n’est rattaché à aucune entreprise. Contactez-nous pour ouvrir un compte ou demandez à votre responsable de vous ajouter.'
                  : 'Déjà client entreprise ? Connectez-vous pour accéder à votre espace.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/contact">Nous contacter</LinkButton>
              {!user && (
                <LinkButton href="/connexion?suite=/entreprises" variant="secondary">
                  Se connecter
                </LinkButton>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
