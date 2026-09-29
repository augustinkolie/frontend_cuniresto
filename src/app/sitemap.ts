import type { MetadataRoute } from 'next'
import { publicFetch } from '@/lib/server-api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dishes = (await publicFetch<Array<{ slug: string; updatedAt: string }>>('/dishes/slugs', ['menu'])) ?? []
  const pages = ['', '/carte', '/reserver', '/a-propos', '/contact', '/academie', '/academie/ressources', '/entreprises', '/aide', '/conditions']
  return [
    ...pages.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : path === '/carte' ? 0.9 : 0.6,
    })),
    ...dishes.map((d) => ({
      url: `${SITE_URL}/carte/${d.slug}`,
      lastModified: new Date(d.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
