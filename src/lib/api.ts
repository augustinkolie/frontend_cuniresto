// Client HTTP du navigateur : même origine (rewrites Next.js), cookies httpOnly,
// rafraîchissement automatique de la session sur 401 et erreurs RFC 9457.

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors?: string[],
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type Body = Record<string, unknown> | unknown[] | FormData | undefined

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: Body
  query?: Record<string, string | number | boolean | string[] | undefined | null>
  signal?: AbortSignal
}

let refreshing: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  refreshing ??= fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      setTimeout(() => (refreshing = null), 0)
    })
  return refreshing
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `/api/v1${path}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v)) {
      if (v.length > 0) params.set(k, v.join(','))
    } else params.set(k, String(v))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

async function toError(res: Response): Promise<ApiError> {
  // Limite anti-force-brute de l'API (connexion, réinitialisation…).
  if (res.status === 429) return new ApiError(429, 'Trop de tentatives. Patientez une minute puis réessayez.')
  try {
    const problem = (await res.json()) as { detail?: string; message?: string; errors?: string[] }
    const detail = problem.errors?.[0] ?? problem.detail ?? problem.message ?? 'Une erreur est survenue'
    return new ApiError(res.status, detail, problem.errors)
  } catch {
    return new ApiError(res.status, res.status >= 500 ? 'Service momentanément indisponible' : 'Requête refusée')
  }
}

export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options
  const isForm = body instanceof FormData
  const init: RequestInit = {
    method,
    credentials: 'include',
    signal,
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  }
  const url = buildUrl(path, query)

  let res = await fetch(url, init)
  if (res.status === 401 && !path.startsWith('/auth/')) {
    if (await refreshSession()) res = await fetch(url, init)
  }
  if (!res.ok) throw await toError(res)
  if (res.status === 204) return undefined as T
  const type = res.headers.get('content-type') ?? ''
  return (type.includes('json') ? await res.json() : await res.text()) as T
}

export const get = <T>(path: string, query?: RequestOptions['query']) => api<T>(path, { query })
export const post = <T>(path: string, body?: Body) => api<T>(path, { method: 'POST', body })
export const put = <T>(path: string, body?: Body) => api<T>(path, { method: 'PUT', body })
export const patch = <T>(path: string, body?: Body) => api<T>(path, { method: 'PATCH', body })
export const del = <T = void>(path: string) => api<T>(path, { method: 'DELETE' })

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.name !== 'AbortError') return 'Connexion impossible, vérifiez votre réseau'
  return 'Une erreur est survenue'
}
