'use client'

import { X } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * Fenêtre modale et tiroir, basés sur <dialog> natif : piège du focus, touche Échap
 * et fond gérés par le navigateur.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  variant = 'modal',
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  variant?: 'modal' | 'drawer' | 'sheet'
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const placement = {
    modal: 'm-auto w-[min(560px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] rounded-[var(--radius-card)]',
    drawer: 'ml-auto mr-0 my-0 h-dvh max-h-dvh w-[min(440px,100vw)] rounded-l-[var(--radius-card)]',
    sheet: 'mx-0 mb-0 mt-auto w-screen max-w-none max-h-[88dvh] rounded-t-[var(--radius-card)]',
  }[variant]

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className={cn(
        'bg-surface p-0 text-text shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm',
        placement,
        className,
      )}
    >
      <div className="flex h-full max-h-[inherit] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-xl font-medium">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-full p-2 text-muted hover:bg-text/10 hover:text-text"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </dialog>
  )
}

/** Tiroir latéral sur ordinateur, feuille inférieure sur mobile (§3.4). */
export function ResponsiveDrawer(props: Omit<Parameters<typeof Dialog>[0], 'variant'>) {
  const [desktop, setDesktop] = useState(true)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
    const update = () => setDesktop(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return <Dialog {...props} variant={desktop ? 'drawer' : 'sheet'} />
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = 'Confirmer',
  danger,
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  children: ReactNode
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="space-y-6 p-5">
        <div className="text-muted">{children}</div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-11 rounded-[var(--radius-control)] px-4 font-semibold hover:bg-text/10">
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'h-11 rounded-[var(--radius-control)] px-4 font-semibold disabled:opacity-50',
              danger ? 'bg-danger text-white' : 'bg-primary text-on-primary',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
