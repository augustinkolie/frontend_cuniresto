'use client'

import { Heart } from 'lucide-react'
import { useFavorites } from '@/components/menu/favorite-button'
import { groupByCategory, PrintedMenu } from '@/components/menu/printed-menu'
import { LinkButton } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'

export default function FavoritesPage() {
  const { data, isLoading } = useFavorites()
  return (
    <div>
      <h1 className="mb-6 font-display text-5xl font-bold">
        Mes <em className="font-medium text-primary">favoris</em>
      </h1>
      {isLoading ? (
        <PageLoader />
      ) : !data?.length ? (
        <EmptyState icon={<Heart className="h-10 w-10" />} title="Aucun favori" action={<LinkButton href="/carte">Explorer la carte</LinkButton>}>
          Touchez le cœur sur un plat pour le retrouver ici.
        </EmptyState>
      ) : (
        <PrintedMenu sections={groupByCategory(data)} />
      )}
    </div>
  )
}
