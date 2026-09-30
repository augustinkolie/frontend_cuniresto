import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import { Card } from '@/components/ui/misc'
import { DAY_NAMES } from '@/lib/format'
import { pageContent, publicFetch } from '@/lib/server-api'
import type { OpeningHours, RestaurantSettings } from '@/lib/types'
import { ContactForm } from './contact-form'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Adresse, téléphone, horaires et formulaire de contact de Maison Braise à Conakry.',
}

/** Plan OpenStreetMap intégrable (sans clé ni bandeau de consentement), centré sur le restaurant. */
function osmEmbed(lat: number, lng: number): string {
  const bbox = [lng - 0.006, lat - 0.0035, lng + 0.006, lat + 0.0035].map((n) => n.toFixed(5)).join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
}

export default async function ContactPage() {
  const [settings, hours, content] = await Promise.all([
    publicFetch<{ restaurant: RestaurantSettings }>('/settings/public', ['content']),
    publicFetch<OpeningHours>('/opening-hours', ['content']),
    pageContent('contact'),
  ])
  const { header, map } = content
  const r = settings?.restaurant
  // Position du restaurant (Administration > Paramètres) ; par défaut, Kaloum.
  const lat = r?.latitude ?? 9.5092
  const lng = r?.longitude ?? -13.7122

  const jsonLd = r && {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: r.name,
    servesCuisine: ['Guinéenne', 'Africaine de l’Ouest'],
    telephone: r.phone,
    email: r.email,
    priceRange: 'GNF',
    address: { '@type': 'PostalAddress', streetAddress: r.address, addressLocality: r.city, addressCountry: 'GN' },
    acceptsReservations: true,
    openingHoursSpecification: hours?.hours
      .filter((h) => !h.isClosed)
      .map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][h.dayOfWeek],
        opens: h.opensAt,
        closes: h.closesAt,
      })),
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-28 lg:px-8 lg:pt-36">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      {header.visible && (
        <header className="mb-10 max-w-2xl">
          {header.eyebrow && <p className="eyebrow">{header.eyebrow}</p>}
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02] lg:text-[64px]">{header.title}</h1>
          {header.text && <p className="mt-4 text-muted">{header.text}</p>}
        </header>
      )}

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="min-w-0 space-y-4">
          {r && (
            <Card className="space-y-4 p-6">
              <p className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-accent" />
                <span>
                  {r.address}
                  <br />
                  {r.city}, Guinée
                </span>
              </p>
              <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 hover:text-primary">
                <Phone className="h-5 w-5 text-accent" /> {r.phone}
              </a>
              {r.whatsapp && (
                <a href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`} className="flex items-center gap-3 hover:text-primary" target="_blank" rel="noopener">
                  <MessageCircle className="h-5 w-5 text-accent" /> WhatsApp
                </a>
              )}
              <a href={`mailto:${r.email}`} className="flex items-center gap-3 hover:text-primary">
                <Mail className="h-5 w-5 text-accent" /> {r.email}
              </a>
            </Card>
          )}
          {hours && (
            <Card className="p-6">
              <h2 className="mb-3 flex items-center gap-2 font-sans text-base font-semibold">
                <Clock className="h-5 w-5 text-accent" /> Horaires
              </h2>
              <ul className="tabular space-y-1 text-muted">
                {[...hours.hours.slice(1), hours.hours[0]!].map((h) => (
                  <li key={h.dayOfWeek} className="flex justify-between">
                    <span>{DAY_NAMES[h.dayOfWeek]}</span>
                    <span>{h.isClosed ? 'Fermé' : `${h.opensAt} – ${h.closesAt}`}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        {/* Hauteur naturelle (pas étirée à celle de la colonne voisine) et visible au défilement. */}
        <Card className="p-6 lg:sticky lg:top-28 lg:p-8">
          <ContactForm />
        </Card>
      </div>

      {map.visible && r && (
        <section className="mt-10" aria-label="Plan d’accès">
          <iframe
            title="Plan d’accès à Maison Braise"
            src={osmEmbed(lat, lng)}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-[var(--radius-card)] border border-line sm:aspect-[21/9]"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <p>
              {r.address}, {r.city}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              <MapPin className="h-4 w-4" /> Itinéraire dans Google Maps
            </a>
          </div>
        </section>
      )}
    </div>
  )
}
