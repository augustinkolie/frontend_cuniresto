import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import socket from '../utils/socket'

// Configuration des serveurs STUN
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
}

export const useWebRTC = () => {
    const [isConnected, setIsConnected] = useState(false)
    const [remoteStream, setRemoteStream] = useState(null)
    const peerConnectionRef = useRef(null)
    const localStreamRef = useRef(null)
    const pendingCandidatesRef = useRef([])

    // Créer une connexion WebRTC
    const createPeerConnection = useCallback(() => {
        const peerConnection = new RTCPeerConnection(ICE_SERVERS)

        // Événement: Nouveau ICE candidate
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('🧊 Nouveau ICE candidate local')
                // Sera envoyé via Socket.IO par l'appelant
            }
        }

        // Événement: Réception du stream distant
        peerConnection.ontrack = (event) => {
            console.log('📡 Stream distant reçu')
            setRemoteStream(event.streams[0])
        }

        // Événement: Changement d'état de la connexion
        peerConnection.onconnectionstatechange = () => {
            console.log('🔄 État de connexion:', peerConnection.connectionState)
            setIsConnected(peerConnection.connectionState === 'connected')
        }

        peerConnectionRef.current = peerConnection
        return peerConnection
    }, [])

    // Ajouter le stream local à la connexion
    const addLocalStream = useCallback((stream) => {
        if (!peerConnectionRef.current) return

        localStreamRef.current = stream
        stream.getTracks().forEach(track => {
            peerConnectionRef.current.addTrack(track, stream)
        })
        console.log('🎤 Stream local ajouté à la connexion')
    }, [])

    // Créer et envoyer une offre
    const createOffer = useCallback(async (recipientId, callId, options = { video: false }) => {
        try {
            const peerConnection = peerConnectionRef.current || createPeerConnection()

            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: options.video
            })

            await peerConnection.setLocalDescription(offer)
            console.log('📤 Offre créée et définie (vidéo:', options.video, ')')

            // Envoyer l'offre via Socket.IO
            socket.emit('call:offer', {
                callId,
                receiverId: recipientId,
                offer: offer
            })

            // Gérer les ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('call:ice-candidate', {
                        recipientId,
                        candidate: event.candidate
                    })
                }
            }
        } catch (error) {
            console.error('❌ Erreur création offre:', error)
            throw error
        }
    }, [createPeerConnection])

    // Accepter une offre et créer une réponse
    const acceptOffer = useCallback(async (callerId, callId, offer) => {
        try {
            const peerConnection = peerConnectionRef.current || createPeerConnection()

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
            console.log('📥 Offre distante définie')

            // Traiter les ICE candidates en attente
            if (pendingCandidatesRef.current.length > 0) {
                pendingCandidatesRef.current.forEach(async (candidate) => {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                })
                pendingCandidatesRef.current = []
            }

            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)
            console.log('📤 Réponse créée et définie')

            // Envoyer la réponse via Socket.IO
            socket.emit('call:answer', {
                callId,
                callerId,
                answer: answer
            })

            // Gérer les ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('call:ice-candidate', {
                        recipientId: callerId,
                        candidate: event.candidate
                    })
                }
            }
        } catch (error) {
            console.error('❌ Erreur acceptation offre:', error)
            throw error
        }
    }, [createPeerConnection])

    // Traiter la réponse reçue
    const handleAnswer = useCallback(async (answer) => {
        try {
            if (!peerConnectionRef.current) {
                console.error('❌ Pas de peer connection')
                return
            }

            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
            console.log('📥 Réponse distante définie')

            // Traiter les ICE candidates en attente
            if (pendingCandidatesRef.current.length > 0) {
                pendingCandidatesRef.current.forEach(async (candidate) => {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
                })
                pendingCandidatesRef.current = []
            }
        } catch (error) {
            console.error('❌ Erreur traitement réponse:', error)
        }
    }, [])

    // Ajouter un ICE candidate
    const addIceCandidate = useCallback(async (candidate) => {
        try {
            if (!peerConnectionRef.current) {
                console.log('⏳ Peer connection pas encore prête, mise en attente du candidate')
                pendingCandidatesRef.current.push(candidate)
                return
            }

            if (!peerConnectionRef.current.remoteDescription) {
                console.log('⏳ Description distante pas encore définie, mise en attente du candidate')
                pendingCandidatesRef.current.push(candidate)
                return
            }

            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
            console.log('🧊 ICE candidate ajouté')
        } catch (error) {
            console.error('❌ Erreur ajout ICE candidate:', error)
        }
    }, [])

    // Fermer la connexion
    const closeConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close()
            peerConnectionRef.current = null
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop())
            localStreamRef.current = null
        }

        setRemoteStream(null)
        setIsConnected(false)
        pendingCandidatesRef.current = []
        console.log('🔌 Connexion WebRTC fermée')
    }, [])

    const result = useMemo(() => ({
        isConnected,
        remoteStream,
        createPeerConnection,
        addLocalStream,
        createOffer,
        acceptOffer,
        handleAnswer,
        addIceCandidate,
        closeConnection
    }), [
        isConnected,
        remoteStream,
        createPeerConnection,
        addLocalStream,
        createOffer,
        acceptOffer,
        handleAnswer,
        addIceCandidate,
        closeConnection
    ])

    return result
}
