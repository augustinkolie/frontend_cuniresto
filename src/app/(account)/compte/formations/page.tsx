'use client'

import { useQuery } from '@tanstack/react-query'
import { GraduationCap } from 'lucide-react'
import Image from '@/components/ui/photo'
import Link from 'next/link'
import { LinkButton } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'
import { PageLoader } from '@/components/ui/spinner'
import { get } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatDate, gnf } from '@/lib/format'
import type { CourseEnrollment } from '@/lib/types'

const STATUS = {
  CONFIRMED: { label: 'Place réservée', className: 'bg-success/20 text-success' },
  PENDING_PAYMENT: { label: 'Paiement en attente', className: 'bg-accent/15 text-accent' },
  CANCELLED: { label: 'Paiement non abouti', className: 'bg-text/10 text-muted' },
} as const

export default function MyCoursesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['academy', 'enrollments', 'mine'], queryFn: () => get<CourseEnrollment[]>('/academy/enrollments/me') })

  return (
    <div>
      <h1 className="mb-6 text-[36px] font-semibold">Mes formations</h1>
      {isLoading ? (
        <PageLoader />
      ) : !data?.length ? (
        <EmptyState icon={<GraduationCap className="h-10 w-10" />} title="Aucune inscription" action={<LinkButton href="/academie">Voir les formations</LinkButton>} />
      ) : (
        <ul className="space-y-3">
          {data.map((e) => {
            const status = STATUS[e.status]
            return (
              <li key={e.id}>
                <Link href={`/academie/inscription/${e.id}`} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:border-primary/50">
                  {e.course && (
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-[var(--radius-control)]">
                      <Image src={e.course.imageUrl} alt="" fill sizes="96px" className="object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{e.courseTitle}</p>
                    <p className="text-sm text-muted">
                      N° {e.number} · {formatDate(e.createdAt)}
                      {e.course?.schedule ? ` · ${e.course.schedule}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular font-semibold">{gnf(e.amount)}</p>
                    <span className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold', status.className)}>{status.label}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
