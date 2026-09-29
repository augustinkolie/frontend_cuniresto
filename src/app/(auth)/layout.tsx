import type { ReactNode } from 'react'
import { Flame } from '@/components/brand/logo'

/** Connexion, inscription, mot de passe oublié : une carte centrée, sobre, sur le fond du site. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main id="contenu" className="flex min-h-dvh items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-line bg-surface px-6 py-8 shadow-2xl shadow-black/20 sm:px-8">
        <Flame className="mx-auto mb-4 h-10 w-10" />
        {children}
      </div>
    </main>
  )
}
