'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminHeader, Table, Td } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Input, Select } from '@/components/ui/field'
import { Avatar, Badge } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useDebounce } from '@/hooks/use-debounce'
import { useSession } from '@/hooks/use-session'
import { del, errorMessage, get, patch } from '@/lib/api'
import { formatDate, timeAgo } from '@/lib/format'
import { ROLE } from '@/lib/labels'
import type { Role, User } from '@/lib/types'

type AdminUser = User & { isActive: boolean; lastLoginAt: string | null }

export default function UsersPage() {
  const { user: me } = useSession()
  const client = useQueryClient()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const q = useDebounce(search)
  const [deleting, setDeleting] = useState<AdminUser | null>(null)
  const users = useQuery({ queryKey: ['admin', 'users', q], queryFn: () => get<AdminUser[]>('/admin/users', { q }) })
  const refresh = () => void client.invalidateQueries({ queryKey: ['admin', 'users'] })

  const setUserRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => (toast.success('Rôle modifié (session de l’utilisateur renouvelée)'), refresh()),
    onError: (e) => toast.error(errorMessage(e)),
  })
  const setActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => patch(`/admin/users/${id}/active`, { isActive }),
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  })
  const remove = useMutation({
    mutationFn: (id: string) => del(`/admin/users/${id}`),
    onSuccess: () => {
      toast.success('Compte supprimé et anonymisé')
      setDeleting(null)
      refresh()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const list = (users.data ?? []).filter((u) => !role || u.role === role)

  return (
    <div>
      <AdminHeader title="Utilisateurs" description="Clients et personnel : rôles, accès, suppression." />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <Input placeholder="Nom ou e-mail" aria-label="Rechercher" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select aria-label="Rôle" value={role} onChange={(e) => setRole(e.target.value as Role | '')}>
          <option value="">Tous les rôles</option>
          {Object.entries(ROLE).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      {!users.data ? (
        <PageLoader />
      ) : (
        <Table head={['Utilisateur', 'Rôle', 'Inscription', 'Dernière connexion', 'Accès', '']}>
          {list.map((u) => {
            const self = u.id === me?.id
            return (
              <tr key={u.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar src={u.avatarUrl} firstName={u.firstName} lastName={u.lastName} size={36} />
                    <div>
                      <p className="font-semibold">
                        {u.firstName} {u.lastName} {self && <Badge>vous</Badge>}
                      </p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <Select aria-label={`Rôle de ${u.firstName}`} className="h-9 w-40" value={u.role} disabled={self} onChange={(e) => setUserRole.mutate({ id: u.id, role: e.target.value as Role })}>
                    {Object.entries(ROLE).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </Td>
                <Td>{formatDate(u.createdAt)}</Td>
                <Td>{u.lastLoginAt ? timeAgo(u.lastLoginAt) : '—'}</Td>
                <Td>
                  <Button size="sm" variant={u.isActive ? 'secondary' : 'primary'} disabled={self} onClick={() => setActive.mutate({ id: u.id, isActive: !u.isActive })}>
                    {u.isActive ? 'Désactiver' : 'Réactiver'}
                  </Button>
                </Td>
                <Td>
                  {!self && (
                    <button type="button" onClick={() => setDeleting(u)} className="rounded-full p-2 text-danger hover:bg-danger/10" aria-label={`Supprimer ${u.firstName}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </Td>
              </tr>
            )
          })}
        </Table>
      )}
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting.id)} title="Supprimer ce compte ?" danger confirmLabel="Supprimer" loading={remove.isPending}>
        Les données personnelles de {deleting?.firstName} {deleting?.lastName} seront effacées. Son historique de commandes reste anonymisé.
      </ConfirmDialog>
    </div>
  )
}
