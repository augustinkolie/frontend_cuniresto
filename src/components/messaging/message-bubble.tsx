'use client'

import { Check, CheckCheck, CornerUpLeft, Download, FileText, SmilePlus, Star, Trash2 } from 'lucide-react'
import Image from '@/components/ui/photo'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { fileSize, formatTime } from '@/lib/format'
import type { Message } from '@/lib/types'

export const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '🙏', '👍']

export function MessageBubble({
  message,
  mine,
  showSender,
  read,
  onReply,
  onReact,
  onStar,
  onDelete,
}: {
  message: Message
  mine: boolean
  showSender: boolean
  read: boolean
  onReply: () => void
  onReact: (emoji: string) => void
  onStar: () => void
  onDelete: () => void
}) {
  const [picker, setPicker] = useState(false)
  const deleted = !!message.deletedAt
  const grouped = Object.entries(
    message.reactions.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.emoji]: (acc[r.emoji] ?? 0) + 1 }), {}),
  )

  return (
    <div className={cn('group flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
      {showSender && !mine && <span className="px-3 text-xs font-semibold text-accent">{message.sender.firstName}</span>}
      <div className={cn('flex max-w-[85%] items-end gap-1.5 sm:max-w-[70%]', mine && 'flex-row-reverse')}>
        <div
          className={cn(
            'relative rounded-2xl px-3.5 py-2',
            mine ? 'rounded-br-md bg-primary text-on-primary' : 'rounded-bl-md bg-surface-2',
            deleted && 'bg-transparent italic text-muted ring-1 ring-line',
          )}
        >
          {message.replyTo && !deleted && (
            <div className={cn('mb-1.5 rounded-lg border-l-4 px-2 py-1 text-xs', mine ? 'border-on-primary/50 bg-black/10' : 'border-accent bg-black/15')}>
              <p className="font-semibold">{message.replyTo.sender.firstName}</p>
              <p className="line-clamp-2 opacity-80">{message.replyTo.deletedAt ? 'Message supprimé' : message.replyTo.content || 'Pièce jointe'}</p>
            </div>
          )}
          {deleted ? (
            <p className="text-sm">Message supprimé</p>
          ) : (
            <>
              {message.attachments.map((a) => (
                <div key={a.id} className="mb-1.5">
                  {a.type === 'IMAGE' ? (
                    <a href={a.url} target="_blank" rel="noopener" className="block overflow-hidden rounded-lg">
                      <Image src={a.url} alt={a.filename} width={320} height={240} className="h-auto max-h-72 w-auto object-cover" />
                    </a>
                  ) : a.type === 'VIDEO' ? (
                    <video src={a.url} controls className="max-h-72 rounded-lg">
                      <track kind="captions" />
                    </video>
                  ) : a.type === 'AUDIO' ? (
                    <audio src={a.url} controls className="h-10 max-w-60" />
                  ) : (
                    <a href={a.url} download={a.filename} className="flex items-center gap-2 rounded-lg bg-black/10 px-3 py-2 text-sm">
                      <FileText className="h-5 w-5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{a.filename}</span>
                      <span className="shrink-0 text-xs opacity-70">{fileSize(a.size)}</span>
                      <Download className="h-4 w-4 shrink-0" />
                    </a>
                  )}
                </div>
              ))}
              {message.content && <p className="whitespace-pre-wrap break-words text-[15px]">{message.content}</p>}
            </>
          )}
          <span className={cn('mt-0.5 flex items-center justify-end gap-1 text-[11px]', mine ? 'text-on-primary/70' : 'text-muted')}>
            {message.isStarred && <Star className="h-3 w-3" fill="currentColor" aria-label="Important" />}
            {formatTime(message.createdAt)}
            {mine && !deleted && (read ? <CheckCheck className="h-3.5 w-3.5" aria-label="Lu" /> : <Check className="h-3.5 w-3.5" aria-label="Envoyé" />)}
          </span>
        </div>

        {!deleted && (
          <div className="relative flex shrink-0 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <button type="button" onClick={onReply} className="rounded-full p-1.5 text-muted hover:bg-text/10" aria-label="Répondre">
              <CornerUpLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setPicker((p) => !p)} className="rounded-full p-1.5 text-muted hover:bg-text/10" aria-label="Réagir">
              <SmilePlus className="h-4 w-4" />
            </button>
            <button type="button" onClick={onStar} className={cn('rounded-full p-1.5 hover:bg-text/10', message.isStarred ? 'text-accent' : 'text-muted')} aria-label="Marquer comme important">
              <Star className="h-4 w-4" />
            </button>
            {mine && (
              <button type="button" onClick={onDelete} className="rounded-full p-1.5 text-muted hover:bg-danger/10 hover:text-danger" aria-label="Supprimer">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {picker && (
              <div className={cn('absolute bottom-9 z-10 flex gap-1 rounded-full border border-line bg-surface p-1.5 shadow-xl', mine ? 'right-0' : 'left-0')}>
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onReact(emoji)
                      setPicker(false)
                    }}
                    className="rounded-full p-1 text-lg hover:bg-text/10"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {grouped.length > 0 && (
        <div className="-mt-1 flex gap-1 px-2">
          {grouped.map(([emoji, count]) => (
            <button key={emoji} type="button" onClick={() => onReact(emoji)} className="rounded-full border border-line bg-surface px-1.5 text-xs">
              {emoji} {count > 1 && count}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
