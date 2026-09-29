'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellRing, Download, Plus, Printer, RefreshCw, Trash2 } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminHeader } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { ConfirmDialog, Dialog } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/field'
import { Badge, Card } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useSession } from '@/hooks/use-session'
import { del, errorMessage, get, patch, post } from '@/lib/api'
import { cn } from '@/lib/cn'
import { gnf, timeAgo } from '@/lib/format'
import { ORDER_STATUS } from '@/lib/labels'
import type { Table } from '@/lib/types'

const STATUS: Record<Table['status'], { label: string; tone: 'success' | 'danger' | 'accent' | 'neutral' }> = {
  AVAILABLE: { label: 'Libre', tone: 'success' },
  OCCUPIED: { label: 'Occupée', tone: 'danger' },
  RESERVED: { label: 'Réservée', tone: 'accent' },
  CLEANING: { label: 'À débarrasser', tone: 'neutral' },
}
const ZONE: Record<Table['zone'], string> = { INDOOR: 'Salle', OUTDOOR: 'Terrasse', VIP: 'Salon VIP' }

interface WaiterCall {
  id: string
  createdAt: string
  table: { number: number; zone: Table['zone'] }
}

export default function TablesPage() {
  const client = useQueryClient()
  const { hasRole } = useSession()
  const isManager = hasRole('MANAGER')
  const [qr, setQr] = useState<Table | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Table | null>(null)
  const [form, setForm] = useState({ number: 1, capacity: 4, zone: 'INDOOR' as Table['zone'] })

  const tables = useQuery({ queryKey: ['admin', 'tables'], queryFn: () => get<Table[]>('/admin/tables'), refetchInterval: 30_000 })
  const calls = useQuery({ queryKey: ['admin', 'waiter-calls'], queryFn: () => get<WaiterCall[]>('/admin/waiter-calls'), refetchInterval: 20_000 })
  const refresh = () => void client.invalidateQueries({ queryKey: ['admin', 'tables'] })

  const update = useMutation({ mutationFn: ({ id, body }: { id: string; body: Partial<Table> }) => patch(`/admin/tables/${id}`, body), onSuccess: refresh })
  const create = useMutation({
    mutationFn: () => post('/admin/tables', form),
    onSuccess: () => {
      setCreating(false)
      refresh()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const regenerate = useMutation({
    mutationFn: (id: string) => post<Table>(`/admin/tables/${id}/qr`),
    onSuccess: (t) => {
      toast.success('Nouveau QR code généré : imprimez-le, l’ancien ne fonctionne plus')
      setQr(t)
      refresh()
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => del(`/admin/tables/${id}`),
    onSuccess: () => {
      setDeleting(null)
      refresh()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const ack = useMutation({
    mutationFn: (id: string) => patch(`/admin/waiter-calls/${id}/acknowledge`),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['admin', 'waiter-calls'] }),
  })

  const download = (t: Table) => {
    const canvas = document.getElementById(`qr-${t.id}`) as HTMLCanvasElement | null
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `table-${t.number}-qr.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  if (!tables.data) return <PageLoader />

  return (
    <div>
      <AdminHeader
        title="Salle & QR codes"
        description="Chaque table a son QR code : les clients commandent et appellent un serveur depuis leur téléphone."
        actions={
          isManager && (
            <Button
              onClick={() => {
                setForm({ number: Math.max(0, ...tables.data.map((t) => t.number)) + 1, capacity: 4, zone: 'INDOOR' })
                setCreating(true)
              }}
            >
              <Plus className="h-4 w-4" /> Nouvelle table
            </Button>
          )
        }
      />

      {calls.data && calls.data.length > 0 && (
        <Card className="mb-6 border-accent bg-accent/10 p-4">
          <p className="mb-3 flex items-center gap-2 font-semibold">
            <BellRing className="h-5 w-5 animate-pulse text-accent" /> Appels en attente
          </p>
          <ul className="flex flex-wrap gap-2">
            {calls.data.map((c) => (
              <li key={c.id}>
                <Button size="sm" variant="secondary" onClick={() => ack.mutate(c.id)}>
                  Table {c.table.number} · {timeAgo(c.createdAt)} — J’y vais
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.data.map((t) => (
          <li key={t.id} className={cn('rounded-[var(--radius-card)] border border-line bg-surface p-4', !t.isActive && 'opacity-50')}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-3xl">T{t.number}</p>
                <p className="text-sm text-muted">
                  {t.capacity} places · {ZONE[t.zone]}
                </p>
              </div>
              <Badge tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Badge>
            </div>
            {t.orders.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {t.orders.map((o) => (
                  <li key={o.id} className="flex justify-between">
                    <span>
                      #{o.number} · {ORDER_STATUS[o.status]}
                    </span>
                    <span className="tabular">{gnf(o.total)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Select aria-label={`Statut table ${t.number}`} className="h-9 flex-1 text-sm" value={t.status} onChange={(e) => update.mutate({ id: t.id, body: { status: e.target.value as Table['status'] } })}>
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </Select>
              <Button size="sm" variant="secondary" onClick={() => setQr(t)}>
                QR
              </Button>
              {isManager && (
                <button type="button" onClick={() => setDeleting(t)} className="rounded-full p-2 text-danger hover:bg-danger/10" aria-label={`Supprimer la table ${t.number}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Canvas caché pour le téléchargement PNG */}
            <QRCodeCanvas id={`qr-${t.id}`} value={t.qrUrl} size={512} marginSize={2} className="hidden" />
          </li>
        ))}
      </ul>

      <Dialog open={!!qr} onClose={() => setQr(null)} title={qr ? `QR code — table ${qr.number}` : ''}>
        {qr && (
          <div className="space-y-4 p-6 text-center">
            <div id="qr-print" className="mx-auto inline-block rounded-xl bg-white p-4">
              <QRCodeCanvas value={qr.qrUrl} size={240} marginSize={1} />
              <p className="mt-2 font-display text-2xl text-black">Table {qr.number}</p>
              <p className="text-sm text-black/60">Scannez pour commander</p>
            </div>
            <p className="break-all text-xs text-muted">{qr.qrUrl}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => download(qr)}>
                <Download className="h-4 w-4" /> PNG
              </Button>
              <Button size="sm" variant="secondary" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Imprimer
              </Button>
              {isManager && (
                <Button size="sm" variant="ghost" onClick={() => regenerate.mutate(qr.id)} loading={regenerate.isPending}>
                  <RefreshCw className="h-4 w-4" /> Régénérer
                </Button>
              )}
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={creating} onClose={() => setCreating(false)} title="Nouvelle table">
        <form
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate()
          }}
        >
          <Field label="Numéro">{(p) => <Input {...p} type="number" min={1} value={form.number} onChange={(e) => setForm({ ...form, number: Number(e.target.value) })} />}</Field>
          <Field label="Places">{(p) => <Input {...p} type="number" min={1} max={30} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />}</Field>
          <Field label="Zone">
            {(p) => (
              <Select {...p} value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value as Table['zone'] })}>
                {Object.entries(ZONE).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Button type="submit" className="w-full" loading={create.isPending}>
            Créer
          </Button>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting.id)} title="Supprimer la table ?" danger confirmLabel="Supprimer" loading={remove.isPending}>
        La table {deleting?.number} et son QR code seront supprimés.
      </ConfirmDialog>
    </div>
  )
}
