'use client'

import { useEffect, useRef } from 'react'
import { getSocket } from '@/lib/socket'

/** Abonnement à un événement temps réel pendant la vie du composant. */
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void, enabled = true): void {
  const ref = useRef(handler)
  ref.current = handler

  useEffect(() => {
    if (!enabled) return
    const socket = getSocket()
    const listener = (payload: T) => ref.current(payload)
    socket.on(event, listener)
    if (!socket.connected) socket.connect()
    return () => {
      socket.off(event, listener)
    }
  }, [event, enabled])
}
