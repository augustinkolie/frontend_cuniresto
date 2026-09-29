'use client'

import { Mic, Paperclip, Send, Square, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'
import { getSocket } from '@/lib/socket'
import type { Message } from '@/lib/types'

const MAX_FILES = 10

export function Composer({
  conversationId,
  replyTo,
  onCancelReply,
  onSend,
  sending,
}: {
  conversationId: string
  replyTo: Message | null
  onCancelReply: () => void
  onSend: (content: string, files: File[]) => Promise<void>
  sending: boolean
}) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const fileInput = useRef<HTMLInputElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setText('')
    setFiles([])
  }, [conversationId])

  useEffect(() => {
    if (replyTo) textarea.current?.focus()
  }, [replyTo])

  useEffect(() => {
    if (!recording) return
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [recording])

  const signalTyping = () => {
    const socket = getSocket()
    socket.emit('typing', { conversationId, isTyping: true })
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => socket.emit('typing', { conversationId, isTyping: false }), 2500)
  }

  const submit = async () => {
    if ((!text.trim() && files.length === 0) || sending) return
    const content = text
    const attachments = files
    setText('')
    setFiles([])
    getSocket().emit('typing', { conversationId, isTyping: false })
    try {
      await onSend(content, attachments)
    } catch {
      setText(content)
      setFiles(attachments)
    }
  }

  // Message vocal : enregistrement avec MediaRecorder, envoyé comme pièce jointe audio.
  const toggleRecording = async () => {
    if (recording) {
      recorder.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunks.current = []
      rec.ondataavailable = (e) => chunks.current.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setRecording(false)
        const blob = new Blob(chunks.current, { type: rec.mimeType.split(';')[0] || 'audio/webm' })
        if (blob.size < 1000) return
        const ext = blob.type.includes('mp4') ? 'm4a' : 'webm'
        void onSend('', [new File([blob], `message-vocal.${ext}`, { type: blob.type })])
      }
      recorder.current = rec
      rec.start()
      setSeconds(0)
      setRecording(true)
    } catch {
      toast.error('Micro inaccessible : autorisez-le dans votre navigateur.')
    }
  }

  return (
    <div className="border-t border-line bg-surface p-3">
      {replyTo && (
        <div className="mb-2 flex items-start gap-2 rounded-lg border-l-4 border-accent bg-surface-2 px-3 py-2 text-sm">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Réponse à {replyTo.sender.firstName}</p>
            <p className="truncate text-muted">{replyTo.content || 'Pièce jointe'}</p>
          </div>
          <button type="button" onClick={onCancelReply} className="text-muted hover:text-text" aria-label="Annuler la réponse">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {files.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-1.5 rounded-full bg-surface-2 py-1 pl-3 pr-1.5 text-xs">
              <span className="max-w-40 truncate">{f.name}</span>
              <button type="button" onClick={() => setFiles((s) => s.filter((_, j) => j !== i))} aria-label={`Retirer ${f.name}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2">
        <button type="button" onClick={() => fileInput.current?.click()} className="rounded-full p-2.5 text-muted hover:bg-text/10 hover:text-text" aria-label="Joindre un fichier">
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? [])
            setFiles((s) => [...s, ...picked].slice(0, MAX_FILES))
            e.target.value = ''
          }}
        />
        {recording ? (
          <p className="tabular flex h-11 flex-1 items-center gap-2 rounded-full bg-danger/10 px-4 text-sm text-danger" aria-live="polite">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-danger" /> Enregistrement… {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
          </p>
        ) : (
          <>
            <label htmlFor="composer" className="sr-only">
              Votre message
            </label>
            <textarea
              id="composer"
              ref={textarea}
              rows={1}
              value={text}
              maxLength={4000}
              onChange={(e) => {
                setText(e.target.value)
                signalTyping()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void submit()
                }
              }}
              placeholder="Écrire un message…"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-3xl border border-line bg-bg px-4 py-2.5 focus:border-primary focus:outline-none"
            />
          </>
        )}
        {text.trim() || files.length > 0 ? (
          <button type="button" onClick={() => void submit()} disabled={sending} className="rounded-full bg-primary p-3 text-on-primary disabled:opacity-50" aria-label="Envoyer">
            <Send className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void toggleRecording()}
            className={cn('rounded-full p-3', recording ? 'bg-danger text-white' : 'bg-primary text-on-primary')}
            aria-label={recording ? 'Arrêter et envoyer le message vocal' : 'Enregistrer un message vocal'}
          >
            {recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}
      </div>
    </div>
  )
}
