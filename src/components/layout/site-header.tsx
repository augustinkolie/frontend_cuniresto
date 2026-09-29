'use client'

import { Menu, ShoppingBag, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/brand/logo'
import { LinkButton } from '@/components/ui/button'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib/cn'
import { cartTotals, useCart } from '@/stores/cart'
import { NotificationBell } from './notification-bell'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'

const NAV = [
  { href: '/carte', label: 'Carte' },
  { href: '/reserver', label: 'Réserver' },
  { href: '/academie', label: 'Académie' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/contact', label: 'Contact' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { user, isLoading } = useSession()
  const lines = useCart((s) => s.lines)
  const openCart = useCart((s) => s.open)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const count = mounted ? cartTotals(lines).count : 0

  // En-tête transparent sur le hero de l'accueil, opaque ailleurs ou après défilement.
  const transparent = pathname === '/' && !scrolled && !mobileOpen

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMobileOpen(false), [pathname])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-colors duration-300',
        transparent ? 'bg-transparent text-text' : 'border-b border-line bg-bg/90 text-text backdrop-blur-md',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:h-20 lg:px-8">
        <Logo />
        <nav aria-label="Navigation principale" className="ml-8 hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-[15px] font-medium transition-colors hover:text-primary',
                    pathname.startsWith(item.href) && 'text-primary',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={openCart}
            className="relative rounded-full p-2.5 text-muted hover:bg-text/10 hover:text-text"
            aria-label={`Panier (${count} article${count > 1 ? 's' : ''})`}
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="tabular absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
                {count}
              </span>
            )}
          </button>
          {user && <NotificationBell />}
          {user ? (
            <UserMenu user={user} />
          ) : (
            !isLoading && (
              <Link href="/connexion" className="hidden rounded-full px-3 py-2 text-sm font-semibold hover:text-primary sm:block">
                Connexion
              </Link>
            )
          )}
          <LinkButton href="/carte" size="sm" className="ml-2 hidden sm:inline-flex">
            Commander
          </LinkButton>
          <button
            type="button"
            className="rounded-full p-2.5 lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav aria-label="Navigation mobile" className="border-t border-line bg-bg px-4 pb-6 pt-2 lg:hidden">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block border-b border-line/60 py-4 font-display text-2xl">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex gap-3">
            <LinkButton href="/carte" className="flex-1">
              Commander
            </LinkButton>
            {!user && (
              <LinkButton href="/connexion" variant="secondary" className="flex-1">
                Connexion
              </LinkButton>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
