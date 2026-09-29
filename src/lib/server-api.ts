import { cookies } from 'next/headers'

// Appels à l'API depuis les Server Components uniquement (next/headers échoue côté client).
// Contenu public : mis en cache avec des tags, vidés par l'API via /api/revalidate.

const API_URL = process.env.API_URL ?? 'http://localhost:4100'

export async function publicFetch<T>(
  path: string,
  tags: string[],
  query?: Record<string, string | number | boolean | undefined>,
): Promise<T | null> {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) params.set(k, String(v))
  const qs = params.toString()
  try {
    const res = await fetch(`${API_URL}/api/v1${path}${qs ? `?${qs}` : ''}`, {
      next: { tags, revalidate: 3600 },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    // API indisponible au moment du rendu : la page s'affiche sans ces données.
    return null
  }
}

/**
 * Pour les pages de détail : `null` seulement si la ressource n'existe pas (404).
 * Si l'API est arrêtée ou en erreur, on lève une erreur au lieu d'afficher un faux « introuvable ».
 */
export async function publicFetchOrThrow<T>(path: string, tags: string[]): Promise<T | null> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, { next: { tags, revalidate: 3600 } })
  } catch {
    throw new Error('API indisponible')
  }
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`API en erreur (${res.status})`)
  return (await res.json()) as T
}

/** Requête authentifiée avec les cookies du visiteur (jamais mise en cache). */
export async function sessionFetch<T>(path: string): Promise<T | null> {
  const jar = await cookies()
  const cookieHeader = jar
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join('; ')
  try {
    const res = await fetch(`${API_URL}/api/v1${path}`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}
