import type { Metadata } from 'next'
import { pageContent } from '@/lib/server-api'
import { splitParagraphs } from '@/lib/site-content'

export const metadata: Metadata = {
  title: 'Conditions et confidentialité',
  description: 'Conditions générales de vente et politique de confidentialité de Maison Braise.',
}

export default async function TermsPage() {
  // Articles : modifiables dans Administration > Pages du site.
  const { header, sections } = await pageContent('terms')
  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-28 lg:px-8 lg:pt-36">
      {header.visible && (
        <>
          <h1 className="font-display text-5xl font-bold leading-[1.02] lg:text-[56px]">{header.title}</h1>
          {header.updated && <p className="mt-3 text-muted">{header.updated}</p>}
        </>
      )}
      {sections.visible && (
        <div className="mt-12 space-y-10">
          {sections.items.map((article) => (
            <section key={article.title}>
              <h2 className="mb-3 text-2xl font-medium">{article.title}</h2>
              <div className="space-y-3 text-text/85">
                {splitParagraphs(article.text).map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
