import { ChevronDown } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { LinkButton } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Aide',
  description: 'Questions fréquentes : commandes, livraison, paiement Orange Money, carte et PayPal, réservations, fidélité.',
}

const FAQ: Array<{ topic: string; items: Array<[string, string]> }> = [
  {
    topic: 'Commandes et livraison',
    items: [
      ['Où livrez-vous ?', 'Nous livrons dans Conakry. La livraison standard coûte 3 000 GNF, l’express 5 000 GNF ; au-delà de 10 km, 500 GNF par kilomètre supplémentaire.'],
      ['Comment suivre ma commande ?', 'Depuis « Mes commandes », chaque commande affiche son avancement en temps réel : reçue, en préparation, prête, en livraison. Vous voyez aussi le livreur assigné.'],
      ['Puis-je annuler ?', 'Tant que le paiement n’est pas validé, vous pouvez annuler depuis la page de suivi. Ensuite, contactez-nous par téléphone.'],
      ['Comment recommander un ancien repas ?', 'Ouvrez une commande passée et cliquez sur « Recommander » : les plats encore disponibles sont ajoutés au panier.'],
    ],
  },
  {
    topic: 'Paiement',
    items: [
      ['Quels moyens de paiement acceptez-vous ?', 'Orange Money, carte bancaire (paiement sécurisé par Stripe) et PayPal. À table, vous réglez directement au serveur.'],
      ['Mes données de carte sont-elles stockées ?', 'Non. Le paiement par carte se fait sur la page sécurisée de notre prestataire ; nous ne voyons jamais votre numéro de carte.'],
      ['Mon paiement Orange Money est en attente', 'Validez la demande sur votre téléphone. La commande est confirmée automatiquement dès que Orange Money nous notifie le paiement.'],
    ],
  },
  {
    topic: 'Réservations',
    items: [
      ['Comment réserver ?', 'Choisissez une date, un nombre de couverts et un horaire disponible. Vous recevez un e-mail à la réception de la demande puis à sa confirmation.'],
      ['Nous sommes plus de 20', 'Contactez-nous directement pour un groupe ou un événement privé : nous préparons une formule adaptée.'],
    ],
  },
  {
    topic: 'Compte et fidélité',
    items: [
      ['Comment gagner des points ?', '10 points par commande + 1 point par tranche de 1 000 GNF. Les points sont crédités quand la commande est payée.'],
      ['Comment fonctionne le parrainage ?', 'Partagez votre code : votre filleul reçoit 300 points et vous 500 points après sa première commande payée.'],
      ['Comment supprimer mon compte ?', 'Dans Paramètres > Confidentialité. Vos données personnelles sont effacées ; l’historique comptable est conservé de façon anonyme.'],
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-28 lg:px-8 lg:pt-36">
      <header className="mb-12">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">Centre d’aide</p>
        <h1 className="text-[40px] font-semibold lg:text-[64px]">Comment pouvons-nous aider ?</h1>
      </header>
      <div className="space-y-12">
        {FAQ.map((section) => (
          <section key={section.topic} aria-labelledby={section.topic}>
            <h2 id={section.topic} className="mb-4 text-2xl font-medium">
              {section.topic}
            </h2>
            <div className="divide-y divide-line rounded-[var(--radius-card)] border border-line">
              {section.items.map(([q, a]) => (
                <details key={q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {q}
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="mt-3 text-muted">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-16 rounded-[var(--radius-card)] border border-line bg-surface p-8 text-center">
        <h2 className="text-2xl font-medium">Vous n’avez pas trouvé la réponse ?</h2>
        <p className="mt-2 text-muted">
          Notre équipe répond en semaine sous 24 h. Vous pouvez aussi utiliser l’assistant en bas à droite ou lire nos{' '}
          <Link href="/conditions" className="text-accent hover:underline">
            conditions
          </Link>
          .
        </p>
        <LinkButton href="/contact" className="mt-5">
          Nous contacter
        </LinkButton>
      </div>
    </div>
  )
}
