'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, LifeBuoy, Moon, ShieldOff, Trash2, UserX } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/field'
import { Avatar, Card } from '@/components/ui/misc'
import { useLogout, useSession } from '@/hooks/use-session'
import { del, errorMessage, get, post } from '@/lib/api'
import type { PublicUser } from '@/lib/types'

export default function SettingsPage() {
  const { user } = useSession()
  const client = useQueryClient()
  const logout = useLogout()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const blocked = useQuery({ queryKey: ['blocked'], queryFn: () => get<PublicUser[]>('/me/blocked') })

  const changePassword = useMutation({
    mutationFn: () => post('/auth/change-password', { currentPassword: current || undefined, newPassword: next }),
    onSuccess: () => {
      toast.success('Mot de passe modifié')
      setCurrent('')
      setNext('')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const unblock = useMutation({
    mutationFn: (id: string) => del(`/me/blocked/${id}`),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['blocked'] }),
  })
  const deleteAccount = useMutation({
    mutationFn: () => del('/me'),
    onSuccess: () => {
      toast.success('Votre compte a été supprimé')
      logout.mutate()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-[36px] font-semibold">Paramètres</h1>

      <Card className="flex items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-3">
          <Moon className="h-5 w-5 text-accent" />
          <div>
            <p className="font-semibold">Apparence</p>
            <p className="text-sm text-muted">Thème sombre (soirée) ou clair</p>
          </div>
        </div>
        <ThemeToggle />
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-lg font-semibold">
          <KeyRound className="h-5 w-5 text-accent" /> {user?.hasPassword ? 'Changer le mot de passe' : 'Définir un mot de passe'}
        </h2>
        {!user?.hasPassword && <p className="mb-4 text-sm text-muted">Vous vous connectez avec Google : ajoutez un mot de passe pour vous connecter aussi par e-mail.</p>}
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            changePassword.mutate()
          }}
        >
          {user?.hasPassword && (
            <Field label="Mot de passe actuel">{(p) => <Input {...p} type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />}</Field>
          )}
          <Field label="Nouveau mot de passe" hint="8 caractères minimum">
            {(p) => <Input {...p} type="password" required minLength={8} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />}
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" loading={changePassword.isPending}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-sans text-lg font-semibold">
          <UserX className="h-5 w-5 text-accent" /> Utilisateurs bloqués
        </h2>
        {blocked.data?.length ? (
          <ul className="divide-y divide-line">
            {blocked.data.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-3">
                <Avatar src={u.avatarUrl} firstName={u.firstName} lastName={u.lastName} size={36} />
                <span className="flex-1">
                  {u.firstName} {u.lastName}
                </span>
                <Button size="sm" variant="secondary" onClick={() => unblock.mutate(u.id)}>
                  <ShieldOff className="h-4 w-4" /> Débloquer
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Aucun utilisateur bloqué. Vous pouvez bloquer quelqu’un depuis la messagerie.</p>
        )}
      </Card>

      <Card className="flex items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-3">
          <LifeBuoy className="h-5 w-5 text-accent" />
          <div>
            <p className="font-semibold">Aide et confidentialité</p>
            <p className="text-sm text-muted">Questions fréquentes, conditions, données personnelles</p>
          </div>
        </div>
        <div className="flex gap-3 text-sm font-semibold">
          <Link href="/aide" className="text-accent hover:underline">
            Aide
          </Link>
          <Link href="/conditions" className="text-accent hover:underline">
            Confidentialité
          </Link>
        </div>
      </Card>

      <Card className="border-danger/40 p-6">
        <h2 className="mb-2 flex items-center gap-2 font-sans text-lg font-semibold text-danger">
          <Trash2 className="h-5 w-5" /> Supprimer mon compte
        </h2>
        <p className="mb-4 text-sm text-muted">
          Vos données personnelles sont effacées définitivement. L’historique des commandes est conservé de façon anonyme pour la comptabilité.
        </p>
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          Supprimer mon compte
        </Button>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteAccount.mutate()}
        title="Supprimer définitivement ?"
        confirmLabel="Supprimer"
        danger
        loading={deleteAccount.isPending}
      >
        Cette action est irréversible : vos points de fidélité et vos favoris seront perdus.
      </ConfirmDialog>
    </div>
  )
}
