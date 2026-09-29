import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/components/brand/logo'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      {/* Panneau visuel minimal : logo, un tirage photo, une phrase. Hauteur bornée à l'écran. */}
      <aside data-theme="dark" className="relative hidden h-dvh overflow-hidden bg-bg text-text lg:sticky lg:top-0 lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-8 lg:p-12">
        <Logo className="absolute left-12 top-10" />
        <figure className="w-[min(460px,80%)] rotate-[-1.5deg] bg-text p-2.5 shadow-2xl shadow-black/50">
          <div className="relative aspect-[4/3] max-h-[50vh] overflow-hidden">
            <Image src="/images/about/braised_rabbit_aerial.png" alt="" fill priority sizes="460px" className="object-cover" />
          </div>
        </figure>
        <p className="font-display text-3xl font-bold xl:text-4xl">
          Bienvenue <em className="font-medium text-primary">à table.</em>
        </p>
      </aside>

      <main id="contenu" className="flex min-h-dvh flex-col bg-bg px-6 py-6">
        <div className="flex items-center justify-between">
          <Logo className="lg:invisible" />
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-[340px] flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  )
}
