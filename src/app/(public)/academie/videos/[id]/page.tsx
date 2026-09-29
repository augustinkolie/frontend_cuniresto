'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Eye, Heart } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'
import { toast } from 'sonner'
import { Badge, EmptyState } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { useSession } from '@/hooks/use-session'
import { errorMessage, get, post } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import type { ChefContent } from '@/lib/types'

const CATEGORY: Record<ChefContent['category'], string> = {
  PREPARATION: 'Préparation',
  COOKING: 'Cuisson',
  PLATING: 'Dressage',
  TECHNIQUE: 'Technique',
  RECIPE: 'Recette',
  OTHER: 'Divers',
}

export default function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useSession()
  const client = useQueryClient()
  const { data: video, isLoading } = useQuery({ queryKey: ['chef-content', id], queryFn: () => get<ChefContent>(`/chef-content/${id}`) })
  const like = useMutation({
    mutationFn: () => post<{ liked: boolean; likeCount: number }>(`/chef-content/${id}/like`),
    onSuccess: (r) =>
      client.setQueryData<ChefContent>(['chef-content', id], (v) => v && { ...v, likedByMe: r.liked, _count: { likes: r.likeCount } }),
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (isLoading) return <PageLoader />
  if (!video) return <div className="px-4 pt-32"><EmptyState title="Vidéo introuvable" /></div>

  const isEmbed = /youtube|youtu\.be|vimeo/.test(video.videoUrl)
  const src = video.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-28 lg:px-8 lg:pt-36">
      <Link href="/academie" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-text">
        <ArrowLeft className="h-4 w-4" /> Académie
      </Link>
      {isEmbed ? (
        <iframe src={src} title={video.title} allowFullScreen className="aspect-video w-full rounded-[var(--radius-card)] bg-black" />
      ) : (
        <video src={video.videoUrl} poster={video.thumbnailUrl} controls className="aspect-video w-full rounded-[var(--radius-card)] bg-black">
          <track kind="captions" />
        </video>
      )}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge tone="accent">{CATEGORY[video.category]}</Badge>
          <h1 className="mt-2 text-[32px] font-semibold">{video.title}</h1>
          <p className="text-muted">
            {video.chefName} · {formatDate(video.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-4 w-4" /> {video.views}
          </span>
          <button
            type="button"
            disabled={!user}
            onClick={() => like.mutate()}
            aria-pressed={video.likedByMe}
            className={cn('inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-semibold', video.likedByMe && 'border-primary text-primary')}
            title={user ? undefined : 'Connectez-vous pour aimer'}
          >
            <Heart className="h-4 w-4" fill={video.likedByMe ? 'currentColor' : 'none'} /> {video._count.likes}
          </button>
        </div>
      </div>
      <p className="mt-6 whitespace-pre-line text-text/90">{video.description}</p>
      {video.dish && (
        <Link href={`/carte/${video.dish.slug}`} className="mt-6 inline-flex font-semibold text-accent hover:underline">
          Commander « {video.dish.name} » →
        </Link>
      )}
    </div>
  )
}
