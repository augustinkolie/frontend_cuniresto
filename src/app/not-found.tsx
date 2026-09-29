import Link from 'next/link'
import { Flame } from '@/components/brand/logo'

export default function NotFound() {
  return (
    <main id="contenu" className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Flame className="h-16 w-16" />
      <p className="font-display text-7xl text-primary">404</p>
      <h1 className="text-3xl font-semibold">Cette page s’est envolée en fumée</h1>
      <p className="max-w-md text-muted">La page demandée n’existe pas ou a été déplacée.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex h-12 items-center rounded-[var(--radius-control)] bg-primary px-5 font-semibold text-on-primary">
          Accueil
        </Link>
        <Link href="/carte" className="inline-flex h-12 items-center rounded-[var(--radius-control)] border border-text/40 px-5 font-semibold">
          Voir la carte
        </Link>
      </div>
    </main>
  )
}
