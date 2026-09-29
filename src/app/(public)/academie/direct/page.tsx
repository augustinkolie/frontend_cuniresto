'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Radio, VideoOff } from 'lucide-react'
import { LinkButton } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useSocketEvent } from '@/hooks/use-socket-event'
import { get } from '@/lib/api'
import { timeAgo } from '@/lib/format'
import type { LiveSession } from '@/lib/types'

/** Le direct du studio : l'état est partagé et mis à jour en temps réel pour tous les visiteurs. */
export default function LivePage() {
  const client = useQueryClient()
  const { data: live, isLoading } = useQuery({ queryKey: ['public', 'live'], queryFn: () => get<LiveSession>('/academy/live') })
  useSocketEvent<LiveSession>('studio:live', (l) => client.setQueryData(['public', 'live'], l))

  if (isLoading) return <PageLoader />

  const embed = live?.streamUrl?.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-28 lg:px-8 lg:pt-36">
      {live?.isLive ? (
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-danger px-3 py-1 text-sm font-semibold text-white">
            <Radio className="h-4 w-4 animate-pulse" /> En direct {live.startedAt && `· depuis ${timeAgo(live.startedAt).replace('il y a ', '')}`}
          </p>
          <h1 className="text-[36px] font-semibold lg:text-[52px]">{live.title}</h1>
          {embed ? (
            <iframe
              src={embed}
              title={live.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full rounded-[var(--radius-card)] bg-black"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-[var(--radius-card)] bg-surface text-muted">
              Le flux vidéo va démarrer…
            </div>
          )}
          <p className="text-muted">{live.description}</p>
        </div>
      ) : (
        <EmptyState
          icon={<VideoOff className="h-10 w-10" />}
          title="Pas de direct en ce moment"
          action={<LinkButton href="/academie">Voir les vidéos</LinkButton>}
        >
          Revenez lors de nos prochaines sessions en direct : les abonnés à la newsletter sont prévenus.
        </EmptyState>
      )}
    </div>
  )
}
