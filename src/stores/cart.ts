'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface CartLine {
  dishId: string
  slug: string
  name: string
  price: number
  imageUrl: string
  imageAlt: string
  quantity: number
}

export const MAX_QUANTITY = 50

interface CartState {
  lines: CartLine[]
  isOpen: boolean
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void
  setQuantity: (dishId: string, quantity: number) => void
  remove: (dishId: string) => void
  replace: (lines: CartLine[]) => void
  clear: () => void
  open: () => void
  close: () => void
}

/** Panier persistant (localStorage), synchronisé avec le serveur une fois connecté. */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      add: (line, quantity = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.dishId === line.dishId)
          const lines = existing
            ? s.lines.map((l) =>
                l.dishId === line.dishId ? { ...l, ...line, quantity: Math.min(MAX_QUANTITY, l.quantity + quantity) } : l,
              )
            : [...s.lines, { ...line, quantity: Math.min(MAX_QUANTITY, quantity) }]
          return { lines }
        }),
      setQuantity: (dishId, quantity) =>
        set((s) => ({
          lines:
            quantity <= 0
              ? s.lines.filter((l) => l.dishId !== dishId)
              : s.lines.map((l) => (l.dishId === dishId ? { ...l, quantity: Math.min(MAX_QUANTITY, quantity) } : l)),
        })),
      remove: (dishId) => set((s) => ({ lines: s.lines.filter((l) => l.dishId !== dishId) })),
      replace: (lines) => set({ lines }),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: 'mb-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
)

export const cartTotals = (lines: CartLine[]) => ({
  count: lines.reduce((n, l) => n + l.quantity, 0),
  subtotal: lines.reduce((n, l) => n + l.price * l.quantity, 0),
})
