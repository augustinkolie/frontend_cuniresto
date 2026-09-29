import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions et confidentialité',
  description: 'Conditions générales de vente et politique de confidentialité de Maison Braise.',
}

const SECTIONS: Array<[string, string[]]> = [
  [
    'Commandes',
    [
      'Toute commande passée sur le site est ferme dès la validation du paiement. Les prix sont indiqués en francs guinéens (GNF), toutes taxes comprises.',
      'Les plats sont préparés à la commande ; les délais affichés sont indicatifs et peuvent varier selon l’affluence.',
    ],
  ],
  [
    'Paiement',
    [
      'Les paiements sont traités par Orange Money, Stripe (carte bancaire) et PayPal. Maison Braise ne stocke aucune donnée de carte.',
      'Une commande dont le paiement échoue ou expire est annulée automatiquement.',
    ],
  ],
  [
    'Livraison et retrait',
    [
      'La livraison est assurée dans Conakry selon les tarifs affichés au moment de la commande. Le client doit être joignable au numéro indiqué.',
      'En cas de problème à la réception, contactez-nous dans les 2 heures.',
    ],
  ],
  [
    'Données personnelles',
    [
      'Nous collectons les données nécessaires à vos commandes, réservations et au programme de fidélité : identité, coordonnées, historique.',
      'Elles ne sont jamais revendues. Les mots de passe sont chiffrés (Argon2id) et la session repose sur des cookies sécurisés.',
      'Vous pouvez consulter, corriger ou supprimer vos données depuis votre compte, ou en nous écrivant. Les e-mails de newsletter nécessitent une double confirmation et chaque message permet de se désabonner.',
    ],
  ],
  [
    'Cookies',
    [
      'Le site utilise uniquement des cookies techniques indispensables (session, panier). Aucun cookie publicitaire n’est déposé.',
    ],
  ],
]

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-28 lg:px-8 lg:pt-36">
      <h1 className="text-[40px] font-semibold lg:text-[56px]">Conditions et confidentialité</h1>
      <p className="mt-3 text-muted">Dernière mise à jour : septembre 2026.</p>
      <div className="mt-12 space-y-10">
        {SECTIONS.map(([title, paragraphs]) => (
          <section key={title}>
            <h2 className="mb-3 text-2xl font-medium">{title}</h2>
            <div className="space-y-3 text-text/85">
              {paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
