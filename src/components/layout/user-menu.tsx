'use client'

import {
  Building2,
  CalendarDays,
  ChefHat,
  Gift,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Receipt,
  Settings,
  Truck,
  User as UserIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Avatar } from '@/components/ui/misc'
import { STAFF_ROLES, useLogout } from '@/hooks/use-session'
import { ROLE } from '@/lib/labels'
import type { User } from '@/lib/types'

export function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const logout = useLogout()

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const links = [
    ...(STAFF_ROLES.includes(user.role) ? [{ href: '/admin', label: 'Administration', icon: LayoutDashboard }] : []),
    ...(user.role === 'KITCHEN' ? [{ href: '/admin/cuisine', label: 'Écran cuisine', icon: ChefHat }] : []),
    ...(user.role === 'DRIVER' ? [{ href: '/livreur', label: 'Mes livraisons', icon: Truck }] : []),
    { href: '/compte', label: 'Mon profil', icon: UserIcon },
    { href: '/compte/commandes', label: 'Mes commandes', icon: Receipt },
    { href: '/compte/reservations', label: 'Mes réservations', icon: CalendarDays },
    { href: '/compte/formations', label: 'Mes formations', icon: GraduationCap },
    { href: '/compte/fidelite', label: 'Fidélité', icon: Gift },
    { href: '/compte/favoris', label: 'Favoris', icon: Heart },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
    { href: '/entreprises', label: 'Espace entreprise', icon: Building2 },
    { href: '/compte/parametres', label: 'Paramètres', icon: Settings },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-1 pr-1 hover:bg-text/10 md:pr-3"
        aria-expanded={open}
        aria-label="Menu du compte"
      >
        <Avatar src={user.avatarUrl} firstName={user.firstName} lastName={user.lastName} size={34} />
        <span className="hidden text-sm font-semibold md:inline">{user.firstName}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface py-2 shadow-2xl">
          <div className="border-b border-line px-4 pb-3 pt-1">
            <p className="font-semibold">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-sm text-muted">{user.email}</p>
            {user.role !== 'CUSTOMER' && <p className="mt-1 text-xs font-semibold text-accent">{ROLE[user.role]}</p>}
          </div>
          <ul className="py-1">
            {links.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-text/5">
                  <Icon className="h-4 w-4 text-muted" /> {label}
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="flex w-full items-center gap-3 border-t border-line px-4 py-2.5 text-sm text-danger hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4" /> Se déconnecter
          </button>
        </div>
      )}
    </div>
  )
}
