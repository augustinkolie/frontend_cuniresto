'use client'

import { useQueryClient } from '@tanstack/react-query'
import {
  BarChart3,
  Bike,
  BookOpen,
  Building2,
  CalendarDays,
  FileText,
  ChefHat,
  Clapperboard,
  Gift,
  LayoutDashboard,
  Menu as MenuIcon,
  MessageSquareText,
  QrCode,
  Receipt,
  Settings,
  Store,
  UtensilsCrossed,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Logo } from '@/components/brand/logo'
import { NotificationBell } from '@/components/layout/notification-bell'
import { UserMenu } from '@/components/layout/user-menu'
import { PageLoader } from '@/components/ui/spinner'
import { STAFF_ROLES, useLogout, useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { useSocketEvent } from '@/hooks/use-socket-event'
import { cn } from '@/lib/cn'
import type { Role } from '@/lib/types'

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  roles: Role[]
}

const M: Role[] = ['MANAGER']
const SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Service',
    items: [
      { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['MANAGER', 'WAITER'] },
      { href: '/admin/cuisine', label: 'Cuisine', icon: ChefHat, roles: ['MANAGER', 'KITCHEN', 'WAITER'] },
      { href: '/admin/commandes', label: 'Commandes', icon: Receipt, roles: ['MANAGER', 'WAITER'] },
      { href: '/admin/reservations', label: 'Réservations', icon: CalendarDays, roles: ['MANAGER', 'WAITER'] },
      { href: '/admin/salle', label: 'Salle & QR codes', icon: QrCode, roles: ['MANAGER', 'WAITER'] },
      { href: '/admin/livraisons', label: 'Livraisons', icon: Bike, roles: M },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { href: '/admin/carte', label: 'Carte', icon: UtensilsCrossed, roles: M },
      { href: '/admin/entreprises', label: 'Entreprises', icon: Building2, roles: M },
      { href: '/admin/rapports', label: 'Rapports', icon: BarChart3, roles: M },
    ],
  },
  {
    title: 'Communauté',
    items: [
      { href: '/admin/avis', label: 'Avis', icon: MessageSquareText, roles: M },
      { href: '/admin/fidelite', label: 'Fidélité', icon: Gift, roles: M },
      { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users, roles: ['ADMIN'] },
    ],
  },
  {
    title: 'Contenus',
    items: [
      { href: '/admin/contenus', label: 'Vidéos du chef', icon: Clapperboard, roles: M },
      { href: '/admin/academie', label: 'Académie & direct', icon: BookOpen, roles: M },
      { href: '/admin/pages', label: 'Pages du site', icon: FileText, roles: M },
      { href: '/admin/site', label: 'Horaires & newsletter', icon: Store, roles: M },
      { href: '/admin/parametres', label: 'Paramètres', icon: Settings, roles: ['ADMIN'] },
    ],
  },
]

/** Bip court pour les nouvelles commandes (Web Audio, sans fichier). */
function beep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // Son bloqué tant que l'utilisateur n'a pas interagi avec la page.
  }
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const client = useQueryClient()
  const [open, setOpen] = useState(false)
  const logout = useLogout()
  const allowed = !!user && STAFF_ROLES.includes(user.role)

  useEffect(() => {
    if (!isLoading && !user) router.replace(`/connexion?suite=${encodeURIComponent(pathname)}`)
  }, [isLoading, user, router, pathname])

  useEffect(() => setOpen(false), [pathname])

  useSocketEvent<{ number: number; type: string }>(
    'order:placed',
    (e) => {
      beep()
      toast(`Nouvelle commande n° ${e.number}`, { action: { label: 'Cuisine', onClick: () => router.push('/admin/cuisine') } })
      void client.invalidateQueries({ queryKey: ['admin'] })
    },
    allowed,
  )
  useSocketEvent<{ tableNumber: number }>(
    'waiter:called',
    (e) => {
      beep()
      toast.warning(`Table ${e.tableNumber} appelle un serveur`, { action: { label: 'Voir', onClick: () => router.push('/admin/salle') } })
      void client.invalidateQueries({ queryKey: ['admin', 'waiter-calls'] })
    },
    allowed,
  )
  useSocketEvent('reservation:created', () => {
    toast('Nouvelle réservation', { action: { label: 'Voir', onClick: () => router.push('/admin/reservations') } })
    void client.invalidateQueries({ queryKey: ['admin', 'reservations'] })
  }, allowed)
  useSocketEvent('order:updated', () => void client.invalidateQueries({ queryKey: ['admin'] }), allowed)
  useSocketEvent('delivery:updated', () => void client.invalidateQueries({ queryKey: ['admin', 'deliveries'] }), allowed)

  if (isLoading || !user) {
    return (
      <div data-theme="light" className="min-h-dvh bg-bg text-text">
        <PageLoader />
      </div>
    )
  }

  // Connecté avec un compte sans accès : on l'explique au lieu de rediriger en silence.
  if (!allowed) {
    return (
      <div data-theme="light" className="flex min-h-dvh items-center justify-center bg-bg px-4 text-text">
        <div className="w-full max-w-sm text-center">
          <Logo className="justify-center" />
          <h1 className="mt-8 font-display text-3xl font-bold">Accès réservé</h1>
          <p className="mt-3 text-muted">
            Vous êtes connecté avec <strong className="text-text">{user.email}</strong>, qui n’a pas accès à l’administration.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={() => logout.mutate(undefined, { onSettled: () => router.replace('/connexion?suite=/admin') })} loading={logout.isPending}>
              Changer de compte
            </Button>
            <Link href={user.role === 'DRIVER' ? '/livreur' : '/compte'} className="py-2 text-sm text-muted hover:text-text">
              Aller à mon espace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const can = (item: NavItem) => user.role === 'ADMIN' || item.roles.includes(user.role)

  const nav = (
    <nav aria-label="Administration" className="space-y-6">
      {SECTIONS.map((section) => {
        const items = section.items.filter(can)
        if (items.length === 0) return null
        return (
          <div key={section.title}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted">{section.title}</p>
            <ul className="space-y-0.5">
              {items.map(({ href, label, icon: Icon }) => {
                const active = href === '/admin' ? pathname === href : pathname.startsWith(href)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-semibold transition-colors',
                        active ? 'bg-primary text-on-primary' : 'text-text/80 hover:bg-text/5',
                      )}
                    >
                      <Icon className="h-4 w-4" /> {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )

  return (
    // Administration en thème clair : lisible en cuisine et au comptoir (§3.1).
    <div data-theme="light" className="min-h-dvh bg-bg text-text">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 overflow-y-auto border-r border-line bg-surface px-3 py-5 lg:block">
        <Logo href="/admin" className="mb-8 px-3" />
        {nav}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-label="Fermer le menu" />
          <aside className="relative h-full w-72 overflow-y-auto bg-surface px-3 py-5 shadow-2xl">
            <div className="mb-8 flex items-center justify-between px-3">
              <Logo href="/admin" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer le menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur lg:px-8">
          <button type="button" className="rounded-full p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            <MenuIcon className="h-5 w-5" />
          </button>
          <Link href="/" className="text-sm font-semibold text-muted hover:text-text">
            ← Voir le site
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <UserMenu user={user} />
          </div>
        </header>
        <main id="contenu" className="px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
