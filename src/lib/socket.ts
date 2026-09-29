'use client'

import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

/**
 * Connexion Socket.IO unique. L'API authentifie la connexion avec le cookie de session
 * (withCredentials) : aucun identifiant n'est envoyé par le client.
 */
export function getSocket(): Socket {
  socket ??= io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4100', {
    path: '/socket.io',
    withCredentials: true,
    autoConnect: false,
    transports: ['websocket', 'polling'],
  })
  return socket
}

/** Reconnexion après un changement de session (connexion, déconnexion, rafraîchissement). */
export function reconnectSocket(): void {
  const s = getSocket()
  s.disconnect()
  s.connect()
}
