'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ApiError, get, post } from '@/lib/api'
import type { Role, User } from '@/lib/types'
import { useCart } from '@/stores/cart'

export const SESSION_KEY = ['session'] as const

/** Utilisateur connecté (null si visiteur). */
export function useSession() {
  const query = useQuery({
    queryKey: SESSION_KEY,
    queryFn: async () => {
      try {
        return (await get<{ user: User }>('/auth/me')).user
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null
        throw e
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  })
  const user = query.data ?? null
  return {
    user,
    isLoading: query.isLoading,
    isAuthenticated: !!user,
    hasRole: (...roles: Role[]) => !!user && (user.role === 'ADMIN' || roles.includes(user.role)),
  }
}

export const STAFF_ROLES: Role[] = ['ADMIN', 'MANAGER', 'KITCHEN', 'WAITER']

export function useLogout() {
  const client = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: () => post('/auth/logout'),
    onSettled: () => {
      client.setQueryData(SESSION_KEY, null)
      client.removeQueries({ predicate: (q) => q.queryKey[0] !== 'public' })
      useCart.getState().clear()
      router.push('/')
      router.refresh()
    },
  })
}

/** Page d'accueil selon le rôle après connexion. */
export function homeFor(role: Role): string {
  if (role === 'DRIVER') return '/livreur'
  if (role === 'KITCHEN') return '/admin/cuisine'
  if (role === 'CUSTOMER') return '/compte'
  return '/admin'
}
