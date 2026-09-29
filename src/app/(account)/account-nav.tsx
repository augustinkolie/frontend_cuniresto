'use client'

import { CalendarDays, Gift, GraduationCap, Heart, MapPin, MessageCircle, Receipt, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

const LINKS = [
  { href: '/compte', label: 'Profil', icon: User },
  { href: '/compte/commandes', label: 'Commandes', icon: Receipt },
  { href: '/compte/reservations', label: 'Réservations', icon: CalendarDays },
  { href: '/compte/formations', label: 'Formations', icon: GraduationCap },
  { href: '/compte/fidelite', label: 'Fidélité', icon: Gift },
  { href: '/compte/favoris', label: 'Favoris', icon: Heart },
  { href: '/compte/adresses', label: 'Adresses', icon: MapPin },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/compte/parametres', label: 'Paramètres', icon: Settings },
]

export function AccountNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Mon compte" className="lg:sticky lg:top-28 lg:self-start">
      <ul className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === '/compte' ? pathname === href : pathname.startsWith(href)
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-[var(--radius-control)] px-4 py-2.5 text-sm font-semibold transition-colors',
                  active ? 'bg-primary/15 text-primary' : 'text-muted hover:bg-text/5 hover:text-text',
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
