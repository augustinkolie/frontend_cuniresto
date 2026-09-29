'use client'

import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/misc'
import { get } from '@/lib/api'
import { cn } from '@/lib/cn'
import { getSocket } from '@/lib/socket'
import type { PublicUser } from '@/lib/types'
import { useCallStore } from './call-store'

type Ack = { ok: boolean; callId?: string; error?: string }
type Signal = { type: 'offer' | 'answer'; sdp: string } | { type: 'candidate'; candidate: RTCIceCandidateInit }

function emitAck(event: string, payload: unknown): Promise<Ack> {
  return new Promise((resolve) => getSocket().timeout(8000).emit(event, payload, (err: Error | null, ack: Ack) => resolve(err ? { ok: false, error: 'Délai dépassé' } : ack)))
}

/**
 * Appels audio/vidéo WebRTC. L'API ne fait que relayer la signalisation entre les deux
 * participants vérifiés ; le flux média circule directement entre les navigateurs (ou via TURN).
 */
export function CallManager() {
  const state = useCallStore()
  const pc = useRef<RTCPeerConnection | null>(null)
  const local = useRef<MediaStream | null>(null)
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([])
  const localVideo = useRef<HTMLVideoElement>(null)
  const remoteVideo = useRef<HTMLVideoElement>(null)
  const remoteAudio = useRef<HTMLAudioElement>(null)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const cleanup = useCallback((reason?: string) => {
    pc.current?.close()
    pc.current = null
    local.current?.getTracks().forEach((t) => t.stop())
    local.current = null
    pendingCandidates.current = []
    setMuted(false)
    setCameraOff(false)
    useCallStore.getState().set({ phase: 'ended', endReason: reason ?? null })
    setTimeout(() => useCallStore.getState().reset(), 1800)
  }, [])

  const createPeer = useCallback(async (callId: string, type: 'AUDIO' | 'VIDEO') => {
    const { iceServers } = await get<{ iceServers: RTCIceServer[] }>('/calls/ice-servers')
    const peer = new RTCPeerConnection({ iceServers })
    local.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'VIDEO' })
    local.current.getTracks().forEach((t) => peer.addTrack(t, local.current!))
    if (localVideo.current) localVideo.current.srcObject = local.current
    peer.onicecandidate = (e) => {
      if (e.candidate) void emitAck('call:signal', { callId, data: { type: 'candidate', candidate: e.candidate.toJSON() } })
    }
    peer.ontrack = (e) => {
      const [stream] = e.streams
      if (remoteVideo.current) remoteVideo.current.srcObject = stream ?? null
      if (remoteAudio.current) remoteAudio.current.srcObject = stream ?? null
    }
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') useCallStore.getState().set({ phase: 'active', startedAt: Date.now() })
      if (peer.connectionState === 'failed') {
        void emitAck('call:respond', { callId, action: 'end' })
        cleanup('Connexion perdue')
      }
    }
    pc.current = peer
    return peer
  }, [cleanup])

  // Appel sortant demandé par la messagerie.
  useEffect(() => {
    const request = state.request
    if (!request) return
    useCallStore.getState().set({ request: null })
    if (useCallStore.getState().phase !== 'idle') return
    void (async () => {
      useCallStore.getState().set({ phase: 'outgoing', type: request.type, peer: request.peer, conversationId: request.conversationId, isCaller: true })
      const ack = await emitAck('call:initiate', { conversationId: request.conversationId, receiverId: request.peer!.id, type: request.type })
      if (!ack.ok || !ack.callId) {
        toast.error(ack.error ?? 'Appel impossible')
        useCallStore.getState().reset()
        return
      }
      useCallStore.getState().set({ callId: ack.callId })
    })()
  }, [state.request])

  // Événements de signalisation.
  useEffect(() => {
    const socket = getSocket()
    const onIncoming = (e: { callId: string; conversationId: string; type: 'AUDIO' | 'VIDEO'; caller: PublicUser }) => {
      if (useCallStore.getState().phase !== 'idle') {
        void emitAck('call:respond', { callId: e.callId, action: 'reject' })
        return
      }
      useCallStore.getState().set({ phase: 'incoming', callId: e.callId, type: e.type, peer: e.caller, conversationId: e.conversationId, isCaller: false })
    }
    const onAccepted = async ({ callId }: { callId: string }) => {
      const s = useCallStore.getState()
      if (s.callId !== callId || !s.isCaller) return
      s.set({ phase: 'connecting' })
      try {
        const peer = await createPeer(callId, s.type)
        const offer = await peer.createOffer()
        await peer.setLocalDescription(offer)
        await emitAck('call:signal', { callId, data: { type: 'offer', sdp: offer.sdp } })
      } catch {
        toast.error('Micro ou caméra inaccessible')
        void emitAck('call:respond', { callId, action: 'end' })
        cleanup()
      }
    }
    const onSignal = async ({ callId, data }: { callId: string; data: Signal }) => {
      const s = useCallStore.getState()
      if (s.callId !== callId) return
      if (data.type === 'offer') {
        const peer = pc.current ?? (await createPeer(callId, s.type))
        await peer.setRemoteDescription({ type: 'offer', sdp: data.sdp })
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)
        await emitAck('call:signal', { callId, data: { type: 'answer', sdp: answer.sdp } })
        for (const c of pendingCandidates.current.splice(0)) await peer.addIceCandidate(c)
      } else if (data.type === 'answer') {
        await pc.current?.setRemoteDescription({ type: 'answer', sdp: data.sdp })
        for (const c of pendingCandidates.current.splice(0)) await pc.current?.addIceCandidate(c)
      } else if (data.type === 'candidate') {
        if (pc.current?.remoteDescription) await pc.current.addIceCandidate(data.candidate)
        else pendingCandidates.current.push(data.candidate)
      }
    }
    const ended = (reason: string) => ({ callId }: { callId: string }) => {
      if (useCallStore.getState().callId === callId) cleanup(reason)
    }
    const onRejected = ended('Appel refusé')
    const onCancelled = ended('Appel annulé')
    const onEnded = ended('Appel terminé')
    const onUnanswered = ended('Pas de réponse')

    socket.on('call:incoming', onIncoming)
    socket.on('call:accepted', onAccepted)
    socket.on('call:signal', onSignal)
    socket.on('call:rejected', onRejected)
    socket.on('call:cancelled', onCancelled)
    socket.on('call:ended', onEnded)
    socket.on('call:unanswered', onUnanswered)
    return () => {
      socket.off('call:incoming', onIncoming)
      socket.off('call:accepted', onAccepted)
      socket.off('call:signal', onSignal)
      socket.off('call:rejected', onRejected)
      socket.off('call:cancelled', onCancelled)
      socket.off('call:ended', onEnded)
      socket.off('call:unanswered', onUnanswered)
    }
  }, [createPeer, cleanup])

  useEffect(() => {
    if (state.phase !== 'active' || !state.startedAt) return
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - state.startedAt!) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [state.phase, state.startedAt])

  const accept = async () => {
    const { callId, type } = useCallStore.getState()
    if (!callId) return
    try {
      await createPeer(callId, type)
    } catch {
      toast.error('Micro ou caméra inaccessible')
      void emitAck('call:respond', { callId, action: 'reject' })
      return cleanup()
    }
    useCallStore.getState().set({ phase: 'connecting' })
    await emitAck('call:respond', { callId, action: 'accept' })
  }

  const hangUp = () => {
    const { callId, phase, isCaller } = useCallStore.getState()
    if (callId) {
      const action = phase === 'incoming' ? 'reject' : phase === 'outgoing' && isCaller ? 'cancel' : 'end'
      void emitAck('call:respond', { callId, action })
    }
    cleanup()
  }

  const toggleMute = () => {
    local.current?.getAudioTracks().forEach((t) => (t.enabled = muted))
    setMuted(!muted)
  }
  const toggleCamera = () => {
    local.current?.getVideoTracks().forEach((t) => (t.enabled = cameraOff))
    setCameraOff(!cameraOff)
  }

  if (state.phase === 'idle' || !state.peer) return null
  const isVideo = state.type === 'VIDEO'
  const label = {
    outgoing: 'Appel en cours…',
    incoming: `Appel ${isVideo ? 'vidéo' : 'audio'} entrant`,
    connecting: 'Connexion…',
    active: `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`,
    ended: state.endReason ?? 'Appel terminé',
    idle: '',
  }[state.phase]

  return (
    <div role="dialog" aria-label={`Appel avec ${state.peer.firstName}`} className="fixed inset-0 z-[90] flex flex-col bg-bg/95 backdrop-blur-lg" data-theme="dark">
      <audio ref={remoteAudio} autoPlay />
      {isVideo && (
        <>
          <video ref={remoteVideo} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
          <video ref={localVideo} autoPlay playsInline muted className="absolute right-4 top-4 z-10 h-40 w-28 rounded-xl object-cover ring-2 ring-white/30 sm:h-48 sm:w-36" />
        </>
      )}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 text-center">
        {(!isVideo || state.phase !== 'active') && (
          <>
            <Avatar src={state.peer.avatarUrl} firstName={state.peer.firstName} lastName={state.peer.lastName} size={112} className={cn(state.phase === 'incoming' && 'animate-pulse')} />
            <p className="font-display text-3xl">
              {state.peer.firstName} {state.peer.lastName}
            </p>
          </>
        )}
        <p className="tabular text-muted" aria-live="polite">
          {label}
        </p>
      </div>
      <div className="relative z-10 flex justify-center gap-5 pb-12">
        {state.phase === 'incoming' ? (
          <>
            <button type="button" onClick={hangUp} className="rounded-full bg-danger p-5 text-white" aria-label="Refuser">
              <PhoneOff className="h-7 w-7" />
            </button>
            <button type="button" onClick={() => void accept()} className="rounded-full bg-success p-5 text-white" aria-label="Décrocher">
              {isVideo ? <Video className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
            </button>
          </>
        ) : state.phase !== 'ended' ? (
          <>
            <button type="button" onClick={toggleMute} className="rounded-full bg-surface-2 p-4" aria-pressed={muted} aria-label={muted ? 'Réactiver le micro' : 'Couper le micro'}>
              {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
            {isVideo && (
              <button type="button" onClick={toggleCamera} className="rounded-full bg-surface-2 p-4" aria-pressed={cameraOff} aria-label={cameraOff ? 'Activer la caméra' : 'Couper la caméra'}>
                {cameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
              </button>
            )}
            <button type="button" onClick={hangUp} className="rounded-full bg-danger p-4 text-white" aria-label="Raccrocher">
              <PhoneOff className="h-6 w-6" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
