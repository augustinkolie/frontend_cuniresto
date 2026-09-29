import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'

/** Appelé par l'API NestJS après une modification de la carte ou des contenus. */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  const received = request.headers.get('x-revalidate-secret') ?? ''
  const valid =
    !!secret && received.length === secret.length && timingSafeEqual(Buffer.from(received), Buffer.from(secret))
  if (!valid) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const { tags } = (await request.json().catch(() => ({ tags: [] }))) as { tags?: unknown }
  const list = Array.isArray(tags) ? tags.filter((t): t is string => typeof t === 'string').slice(0, 20) : []
  for (const tag of list) revalidateTag(tag)
  return NextResponse.json({ revalidated: list })
}
