'use client'

import { create } from 'zustand'
import type { PublicUser } from '@/lib/types'

export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'active' | 'ended'

interface CallState {
  phase: CallPhase
  callId: string | null
  type: 'AUDIO' | 'VIDEO'
  peer: Pick<PublicUser, 'id' | 'firstName' | 'lastName' | 'avatarUrl'> | null
  conversationId: string | null
  isCaller: boolean
  startedAt: number | null
  endReason: string | null
  /** Demande d'appel sortant, traitée par le CallManager. */
  request: { conversationId: string; peer: CallState['peer']; type: 'AUDIO' | 'VIDEO' } | null
  set: (patch: Partial<CallState>) => void
  reset: () => void
  start: (conversationId: string, peer: NonNullable<CallState['peer']>, type: 'AUDIO' | 'VIDEO') => void
}

const initial = {
  phase: 'idle' as CallPhase,
  callId: null,
  type: 'AUDIO' as const,
  peer: null,
  conversationId: null,
  isCaller: false,
  startedAt: null,
  endReason: null,
  request: null,
}

export const useCallStore = create<CallState>((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: () => set(initial),
  start: (conversationId, peer, type) => set({ request: { conversationId, peer, type } }),
}))
