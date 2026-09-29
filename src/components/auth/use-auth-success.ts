'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { homeFor, SESSION_KEY } from '@/hooks/use-session'
import type { User } from '@/lib/types'

/** Accepte uniquement une redirection interne (évite les redirections ouvertes). */
export function safeNext(value: string | null): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null
}

/** Après connexion ou inscription : session en cache, puis retour à la page demandée. */
export function useAuthSuccess() {
  const client = useQueryClient()
  const router = useRouter()
  const next = safeNext(useSearchParams().get('suite'))

  return useCallback(
    (user: User, isNew = false) => {
      client.setQueryData(SESSION_KEY, user)
      toast.success(isNew ? `Bienvenue chez Maison Braise, ${user.firstName} !` : `Bon retour, ${user.firstName} !`)
      router.replace(next ?? homeFor(user.role))
      router.refresh()
    },
    [client, next, router],
  )
}

/** Conserve le paramètre « suite » d'une page d'authentification à l'autre. */
export function withNext(path: string, next: string | null): string {
  return next ? `${path}?suite=${encodeURIComponent(next)}` : path
}
