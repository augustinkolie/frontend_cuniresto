import type { Metadata } from 'next'
import { TableMenu } from './table-menu'

export const metadata: Metadata = { title: 'Commander à table', robots: { index: false } }

export default async function TablePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <main id="contenu">
      <TableMenu token={token} />
    </main>
  )
}
