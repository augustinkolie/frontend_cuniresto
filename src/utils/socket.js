import { io } from 'socket.io-client'

const getSocketUrl = () => {
    const viteApiUrl = import.meta.env.VITE_API_URL
    // Si l'URL est relative (commence par /), on utilise le domaine actuel mais sur le port 8000 pour le dev
    // ou bien on prend l'URL de base de l'API
    if (viteApiUrl && viteApiUrl.startsWith('http')) {
        return viteApiUrl.replace(/\/api$/, '')
    }
    // Fallback par défaut pour le développement
    return 'http://localhost:8000'
}

const SOCKET_URL = getSocketUrl()

// Créer une instance Socket.IO
const socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
    withCredentials: true
})

// Événements de connexion/déconnexion
socket.on('connect', () => {
    console.log('✅ Connecté au serveur WebSocket')
})

socket.on('disconnect', () => {
    console.log('❌ Déconnecté du serveur WebSocket')
})

socket.on('connect_error', (error) => {
    console.error('❌ Erreur de connexion WebSocket:', error)
})

export default socket
