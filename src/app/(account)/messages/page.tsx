import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageLoader } from '@/components/ui/spinner'
import { Messenger } from './messenger'

export const metadata: Metadata = { title: 'Messages', robots: { index: false } }

export default function MessagesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Messenger />
    </Suspense>
  )
}
