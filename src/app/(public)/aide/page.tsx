import { ChevronDown } from 'lucide-react'
import type { Metadata } from 'next'
import { LinkButton } from '@/components/ui/button'
import { pageContent } from '@/lib/server-api'

export const metadata: Metadata = {
  title: 'Aide',
  description: 'Questions fréquentes : commandes, livraison, paiement Orange Money, carte et PayPal, réservations, fidélité.',
}

export default async function HelpPage() {
  // Questions et textes : modifiables dans Administration > Pages du site.
  const { header, faq, cta } = await pageContent('help')
  const topics = new Map<string, Array<{ question: string; answer: string }>>()
  for (const item of faq.items) {
    const topic = item.topic.trim() || 'Questions générales'
    topics.set(topic, [...(topics.get(topic) ?? []), item])
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-28 lg:px-8 lg:pt-36">
      {header.visible && (
        <header className="mb-12">
          {header.eyebrow && <p className="eyebrow">{header.eyebrow}</p>}
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02] lg:text-[64px]">{header.title}</h1>
        </header>
      )}
      {faq.visible && (
        <div className="space-y-12">
          {[...topics].map(([topic, items]) => (
            <section key={topic} aria-label={topic}>
              <h2 className="mb-4 text-2xl font-medium">{topic}</h2>
              <div className="divide-y divide-line rounded-[var(--radius-card)] border border-line">
                {items.map(({ question, answer }) => (
                  <details key={question} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                      {question}
                      <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <p className="mt-3 text-muted">{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {cta.visible && (
        <div className="mt-16 rounded-[var(--radius-card)] border border-line bg-surface p-8 text-center">
          <h2 className="text-2xl font-medium">{cta.title}</h2>
          {cta.text && <p className="mt-2 text-muted">{cta.text}</p>}
          {cta.button && (
            <LinkButton href="/contact" className="mt-5">
              {cta.button}
            </LinkButton>
          )}
        </div>
      )}
    </div>
  )
}
