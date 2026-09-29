import type { Metadata, Viewport } from 'next'
import { DM_Mono, Playfair_Display, Work_Sans } from 'next/font/google'
import type { ReactNode } from 'react'
import { Providers } from './providers'
import './globals.css'

// Polices auto-hébergées par next/font : aucune requête vers Google au chargement.
// Direction « carte de bistrot éditoriale » : titres Playfair Display à fort contraste,
// texte Work Sans, prix en monospace. Auto-hébergées par next/font (aucune requête Google).
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap', style: ['normal', 'italic'] })
const workSans = Work_Sans({ subsets: ['latin'], variable: '--font-work-sans', display: 'swap' })
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-dm-mono', display: 'swap' })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Maison Braise — Lapin braisé et cuisine guinéenne à Conakry', template: '%s · Maison Braise' },
  description:
    'Restaurant à Conakry : lapin braisé, atiéké, spécialités guinéennes cuites au feu. Réservez une table ou commandez en ligne, payez par Orange Money, carte ou PayPal.',
  applicationName: 'Maison Braise',
  openGraph: { type: 'website', locale: 'fr_GN', siteName: 'Maison Braise' },
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#2B1D16',
  width: 'device-width',
  initialScale: 1,
}

// Appliqué avant l'affichage pour éviter un flash de thème.
const themeScript = `try{var t=localStorage.getItem('mb-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" data-theme="dark" className={`${playfair.variable} ${workSans.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
        >
          Aller au contenu
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
