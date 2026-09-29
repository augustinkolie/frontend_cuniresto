'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Avatar } from '@/components/ui/misc'
import { get, patch } from '@/lib/api'
import { cn } from '@/lib/cn'
import { timeAgo } from '@/lib/format'
import type { Notification } from '@/lib/types'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const client = useQueryClient()
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => get<{ items: Notification[]; unread: number }>('/notifications'),
    refetchInterval: 120_000,
  })
  const readAll = useMutation({
    mutationFn: () => patch('/notifications/read-all'),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const readOne = useMutation({
    mutationFn: (id: string) => patch(`/notifications/${id}/read`),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  })

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

  const unread = data?.unread ?? 0

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2.5 text-muted hover:bg-text/10 hover:text-text"
        aria-label={`Notifications${unread ? ` (${unread} non lues)` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="tabular absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => readAll.mutate()}
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                <CheckCheck className="h-4 w-4" /> Tout marquer lu
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {data?.items.length ? (
              data.items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link}
                    onClick={() => {
                      if (!n.readAt) readOne.mutate(n.id)
                      setOpen(false)
                    }}
                    className={cn('flex gap-3 px-4 py-3 hover:bg-text/5', !n.readAt && 'bg-primary/5')}
                  >
                    <Avatar src={n.sender?.avatarUrl} firstName={n.sender?.firstName ?? 'M'} lastName={n.sender?.lastName ?? 'B'} size={36} />
                    <div className="min-w-0 flex-1 text-sm">
                      <p>
                        {n.sender && <strong>{n.sender.firstName} </strong>}
                        {n.content}
                      </p>
                      <p className="text-xs text-muted">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Non lue" />}
                  </Link>
                </li>
              ))
            ) : (
              <li className="px-4 py-8 text-center text-sm text-muted">Aucune notification</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
