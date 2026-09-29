import { Facebook, Instagram, MapPin, Music2, Phone } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { DAY_NAMES } from '@/lib/format'
import { publicFetch } from '@/lib/server-api'
import type { OpeningHours, RestaurantSettings } from '@/lib/types'
import { NewsletterForm } from './newsletter-form'

export async function SiteFooter() {
  const [settings, hours] = await Promise.all([
    publicFetch<{ restaurant: RestaurantSettings }>('/settings/public', ['content']),
    publicFetch<OpeningHours>('/opening-hours', ['content']),
  ])
  const r = settings?.restaurant
  // Lundi en premier.
  const days = hours ? [...hours.hours.slice(1), hours.hours[0]!] : []

  return (
    <footer className="mt-24 border-t border-line bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <Logo />
          <p className="text-muted">{r?.tagline ?? 'Le lapin braisé et la cuisine guinéenne au feu de bois.'}</p>
          <div className="flex gap-2">
            {r?.socials.facebook && (
              <a href={r.socials.facebook} className="rounded-full p-2 hover:bg-text/10" aria-label="Facebook" rel="noopener" target="_blank">
                <Facebook className="h-5 w-5" />
              </a>
            )}
            {r?.socials.instagram && (
              <a href={r.socials.instagram} className="rounded-full p-2 hover:bg-text/10" aria-label="Instagram" rel="noopener" target="_blank">
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {r?.socials.tiktok && (
              <a href={r.socials.tiktok} className="rounded-full p-2 hover:bg-text/10" aria-label="TikTok" rel="noopener" target="_blank">
                <Music2 className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl">Nous trouver</h2>
          {r && (
            <address className="space-y-2 not-italic text-muted">
              <p className="flex gap-2">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-accent" />
                <span>
                  {r.address}
                  <br />
                  {r.city}, Guinée
                </span>
              </p>
              <p>
                <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-text">
                  <Phone className="h-4 w-4 text-accent" /> {r.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${r.email}`} className="hover:text-text">
                  {r.email}
                </a>
              </p>
            </address>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl">Horaires</h2>
          <ul className="tabular space-y-1 text-sm text-muted">
            {days.map((d) => (
              <li key={d.dayOfWeek} className="flex justify-between gap-4">
                <span>{DAY_NAMES[d.dayOfWeek]}</span>
                <span>{d.isClosed ? 'Fermé' : `${d.opensAt} – ${d.closesAt}`}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl">Newsletter</h2>
          <p className="text-sm text-muted">Nouveaux plats, soirées et offres réservées aux abonnés.</p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-muted md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} Maison Braise. Tous droits réservés.</p>
          <nav aria-label="Liens légaux" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/aide" className="hover:text-text">
              Aide
            </Link>
            <Link href="/entreprises" className="hover:text-text">
              Entreprises
            </Link>
            <Link href="/conditions" className="hover:text-text">
              Conditions et confidentialité
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
