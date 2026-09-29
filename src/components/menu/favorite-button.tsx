'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSession } from '@/hooks/use-session'
import { errorMessage, get, post } from '@/lib/api'
import { cn } from '@/lib/cn'
import type { Dish } from '@/lib/types'

export function useFavorites() {
  const { user } = useSession()
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => get<Dish[]>('/me/favorites'),
    enabled: !!user,
    staleTime: 5 * 60_000,
  })
}

export function FavoriteButton({ dishId, name, className }: { dishId: string; name: string; className?: string }) {
  const { user } = useSession()
  const router = useRouter()
  const client = useQueryClient()
  const { data } = useFavorites()
  const isFavorite = !!data?.some((d) => d.id === dishId)

  const toggle = useMutation({
    mutationFn: () => post<{ isFavorite: boolean }>(`/me/favorites/${dishId}`),
    onSuccess: (r) => {
      void client.invalidateQueries({ queryKey: ['favorites'] })
      toast.success(r.isFavorite ? 'Ajouté à vos favoris' : 'Retiré de vos favoris')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        if (!user) {
          router.push('/connexion?suite=/compte/favoris')
          return
        }
        toggle.mutate()
      }}
      className={cn(
        'rounded-full bg-bg/70 p-2 backdrop-blur transition-colors hover:bg-bg',
        isFavorite ? 'text-primary' : 'text-text',
        className,
      )}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Retirer ${name} des favoris` : `Ajouter ${name} aux favoris`}
    >
      <Heart className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} />
    </button>
  )
}
