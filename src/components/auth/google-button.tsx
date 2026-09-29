'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { errorMessage, post } from '@/lib/api'
import type { User } from '@/lib/types'

interface GoogleId {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }) => void
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void
    }
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export const googleEnabled = !!CLIENT_ID

/**
 * « Continuer avec Google » (Google Identity Services). Le jeton est vérifié par l'API ;
 * le script n'est chargé qu'au besoin et n'affecte pas l'affichage initial.
 */
export function GoogleButton({ onSuccess, mode = 'signin' }: { onSuccess: (user: User, isNew: boolean) => void; mode?: 'signin' | 'signup' }) {
  const ref = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const google = (window as unknown as { google?: GoogleId }).google
    if (!loaded || !CLIENT_ID || !google || !ref.current) return
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async ({ credential }) => {
        try {
          const { user } = await post<{ user: User }>('/auth/google', { credential })
          onSuccess(user, mode === 'signup')
        } catch (error) {
          toast.error(errorMessage(error))
        }
      },
    })
    google.accounts.id.renderButton(ref.current, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: mode === 'signup' ? 'signup_with' : 'continue_with',
      locale: 'fr',
      width: Math.min(400, ref.current.offsetWidth),
    })
  }, [loaded, onSuccess, mode])

  if (!CLIENT_ID) return null
  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setLoaded(true)} />
      <div ref={ref} className="flex min-h-11 w-full justify-center" />
    </>
  )
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted" role="separator">
      <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
    </div>
  )
}
