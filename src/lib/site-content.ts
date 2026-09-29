// Contenu éditable des pages du site : description des sections (pour l'éditeur de l'administration)
// et textes par défaut (affichés tant que rien n'a été enregistré).
// Chaque section peut être masquée ; un champ laissé vide retire l'élément correspondant de la page.

import { PHOTOS } from './photos'

export type FieldType = 'text' | 'textarea' | 'image' | 'paragraphs'

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  hint?: string
}

export interface ListDef {
  name: string
  label: string
  itemLabel: string
  fields: FieldDef[]
}

export interface SectionDef {
  id: string
  label: string
  /** La section peut être retirée de la page. */
  toggleable?: boolean
  fields: FieldDef[]
  lists?: ListDef[]
}

export interface PageDef {
  key: PageKey
  label: string
  href: string
  sections: SectionDef[]
}

const text = (name: string, label: string, hint?: string): FieldDef => ({ name, label, type: 'text', hint })
const area = (name: string, label: string, hint?: string): FieldDef => ({ name, label, type: 'textarea', hint })
const image = (name: string, label: string): FieldDef => ({ name, label, type: 'image' })
const paragraphs = (name: string, label: string): FieldDef => ({ name, label, type: 'paragraphs', hint: 'Un paragraphe par bloc, séparés par une ligne vide' })

const HIGHLIGHT_HINT = 'Fin du titre, en italique doré'

// ───────── Valeurs par défaut

const HOME = {
  hero: {
    visible: true,
    eyebrow: 'Conakry · cuisine au feu de bois',
    titleLine1: 'Le lapin',
    titleLine2: 'braisé,',
    titleHighlight: 'lentement.',
    text: 'Mariné toute une nuit, cuit sur la braise, servi à la guinéenne.',
    primaryCta: 'Réserver une table',
    secondaryCta: 'Lire la carte',
    image: PHOTOS.heroDish.src,
    imageAlt: PHOTOS.heroDish.alt,
    badge: 'cuit au charbon de bois',
    smallImage: PHOTOS.embers.src,
    smallImageAlt: PHOTOS.embers.alt,
    smallImageCaption: 'sur la braise',
  },
  menuExtract: {
    visible: true,
    eyebrow: 'Extrait de la carte',
    title: 'Ce soir,',
    titleHighlight: 'au feu',
    categories: 'lapin, atieke',
    linkLabel: 'Toute la carte, des nouilles aux desserts',
  },
  signatures: { visible: true, eyebrow: 'Les signatures', title: 'Trois raisons', titleHighlight: 'de revenir' },
  story: {
    visible: true,
    eyebrow: 'La maison',
    quote: '« La braise ne se presse pas.',
    quoteHighlight: 'Nous non plus. »',
    text: 'Une recette familiale de lapin, marinée une nuit aux épices puis cuite lentement sur le charbon de bois.',
    linkLabel: 'L’histoire de la maison',
    image: PHOTOS.chef.src,
    imageAlt: PHOTOS.chef.alt,
  },
  videos: { visible: true, title: 'Les gestes du chef' },
  reviews: { visible: true, title: 'Ils en parlent', titleHighlight: 'mieux que nous' },
  booking: { visible: true, eyebrow: 'Réservation', title: 'Une table', titleHighlight: 'ce soir ?' },
}

const ABOUT = {
  header: {
    visible: true,
    eyebrow: 'À propos',
    title: 'Une maison, un feu,',
    titleHighlight: 'une famille.',
    intro: 'Maison Braise est née d’une passion : partager le lapin braisé tel qu’on le prépare à la maison, avec le temps qu’il faut.',
    image1: PHOTOS.chef.src,
    image1Alt: PHOTOS.chef.alt,
    image2: PHOTOS.riceDish.src,
    image2Alt: PHOTOS.riceDish.alt,
    image3: PHOTOS.cassava.src,
    image3Alt: PHOTOS.cassava.alt,
  },
  story: {
    visible: true,
    eyebrow: 'Notre histoire',
    title: 'De la cour familiale à votre table',
    paragraphs: [
      'Tout a commencé dans une cour de Conakry, autour d’un brasero et d’une recette transmise de génération en génération.',
      'Les amis sont venus, puis les amis des amis. Nous avons ouvert Maison Braise pour que chacun puisse goûter ce lapin mariné toute une nuit, puis cuit lentement sur la braise.',
      'Aujourd’hui, notre brigade prépare chaque jour lapin, atiéké, nouilles sautées et sandwichs, avec la même exigence et le même plaisir de recevoir.',
    ],
  },
  values: {
    visible: true,
    items: [
      { title: 'Le feu, lentement', text: 'Charbon de bois, marinade d’une nuit, cuisson maîtrisée : la braise fait le goût.' },
      { title: 'Produits d’ici', text: 'Lapins d’élevages locaux, légumes et épices achetés chaque matin sur les marchés de Conakry.' },
      { title: 'Hospitalité', text: 'On vous reçoit comme en famille, que vous veniez seul, à deux ou pour un grand repas.' },
    ],
  },
  team: {
    visible: true,
    eyebrow: 'L’équipe',
    title: 'Une brigade soudée',
    text: 'En cuisine comme en salle, une équipe formée à nos recettes et à notre accueil. Notre académie transmet aussi ce savoir-faire à celles et ceux qui veulent apprendre.',
    image: PHOTOS.brigade.src,
    imageAlt: PHOTOS.brigade.alt,
  },
}

const RESERVATION = {
  header: {
    visible: true,
    eyebrow: 'Réservation',
    title: 'Votre table',
    titleHighlight: 'vous attend.',
    text: 'Au-delà de 20 personnes, contactez-nous directement.',
  },
}

const CONTACT = {
  header: {
    visible: true,
    eyebrow: 'Contact',
    title: 'Parlons-en',
    text: 'Une question, un groupe, un événement ? Écrivez-nous ou appelez-nous directement.',
  },
  map: { visible: true },
}

const HELP = {
  header: { visible: true, eyebrow: 'Centre d’aide', title: 'Comment pouvons-nous aider ?' },
  faq: {
    visible: true,
    items: [
      { topic: 'Commandes et livraison', question: 'Où livrez-vous ?', answer: 'Nous livrons dans Conakry. La livraison standard coûte 3 000 GNF, l’express 5 000 GNF ; au-delà de 10 km, 500 GNF par kilomètre supplémentaire.' },
      { topic: 'Commandes et livraison', question: 'Comment suivre ma commande ?', answer: 'Depuis « Mes commandes », chaque commande affiche son avancement en temps réel : reçue, en préparation, prête, en livraison. Vous voyez aussi le livreur assigné.' },
      { topic: 'Commandes et livraison', question: 'Puis-je annuler ?', answer: 'Tant que le paiement n’est pas validé, vous pouvez annuler depuis la page de suivi. Ensuite, contactez-nous par téléphone.' },
      { topic: 'Commandes et livraison', question: 'Comment recommander un ancien repas ?', answer: 'Ouvrez une commande passée et cliquez sur « Recommander » : les plats encore disponibles sont ajoutés au panier.' },
      { topic: 'Paiement', question: 'Quels moyens de paiement acceptez-vous ?', answer: 'Orange Money, carte bancaire (paiement sécurisé par Stripe) et PayPal. À table, vous réglez directement au serveur.' },
      { topic: 'Paiement', question: 'Mes données de carte sont-elles stockées ?', answer: 'Non. Le paiement par carte se fait sur la page sécurisée de notre prestataire ; nous ne voyons jamais votre numéro de carte.' },
      { topic: 'Paiement', question: 'Mon paiement Orange Money est en attente', answer: 'Validez la demande sur votre téléphone. La commande est confirmée automatiquement dès que Orange Money nous notifie le paiement.' },
      { topic: 'Réservations', question: 'Comment réserver ?', answer: 'Choisissez une date, un nombre de couverts et un horaire disponible. Vous recevez un e-mail à la réception de la demande puis à sa confirmation.' },
      { topic: 'Réservations', question: 'Nous sommes plus de 20', answer: 'Contactez-nous directement pour un groupe ou un événement privé : nous préparons une formule adaptée.' },
      { topic: 'Compte et fidélité', question: 'Comment gagner des points ?', answer: '10 points par commande + 1 point par tranche de 1 000 GNF. Les points sont crédités quand la commande est payée.' },
      { topic: 'Compte et fidélité', question: 'Comment fonctionne le parrainage ?', answer: 'Partagez votre code : votre filleul reçoit 300 points et vous 500 points après sa première commande payée.' },
      { topic: 'Compte et fidélité', question: 'Comment supprimer mon compte ?', answer: 'Dans Paramètres > Confidentialité. Vos données personnelles sont effacées ; l’historique comptable est conservé de façon anonyme.' },
    ],
  },
  cta: {
    visible: true,
    title: 'Vous n’avez pas trouvé la réponse ?',
    text: 'Notre équipe répond en semaine sous 24 h. Vous pouvez aussi utiliser l’assistant en bas à droite.',
    button: 'Nous contacter',
  },
}

const TERMS = {
  header: { visible: true, title: 'Conditions et confidentialité', updated: 'Dernière mise à jour : septembre 2026.' },
  sections: {
    visible: true,
    items: [
      { title: 'Commandes', text: 'Toute commande passée sur le site est ferme dès la validation du paiement. Les prix sont indiqués en francs guinéens (GNF), toutes taxes comprises.\n\nLes plats sont préparés à la commande ; les délais affichés sont indicatifs et peuvent varier selon l’affluence.' },
      { title: 'Paiement', text: 'Les paiements sont traités par Orange Money, Stripe (carte bancaire) et PayPal. Maison Braise ne stocke aucune donnée de carte.\n\nUne commande dont le paiement échoue ou expire est annulée automatiquement.' },
      { title: 'Livraison et retrait', text: 'La livraison est assurée dans Conakry selon les tarifs affichés au moment de la commande. Le client doit être joignable au numéro indiqué.\n\nEn cas de problème à la réception, contactez-nous dans les 2 heures.' },
      { title: 'Données personnelles', text: 'Nous collectons les données nécessaires à vos commandes, réservations et au programme de fidélité : identité, coordonnées, historique.\n\nElles ne sont jamais revendues. Les mots de passe sont chiffrés (Argon2id) et la session repose sur des cookies sécurisés.\n\nVous pouvez consulter, corriger ou supprimer vos données depuis votre compte, ou en nous écrivant. Les e-mails de newsletter nécessitent une double confirmation et chaque message permet de se désabonner.' },
      { title: 'Cookies', text: 'Le site utilise uniquement des cookies techniques indispensables (session, panier). Aucun cookie publicitaire n’est déposé.' },
    ],
  },
}

export const PAGE_DEFAULTS = { home: HOME, about: ABOUT, reservation: RESERVATION, contact: CONTACT, help: HELP, terms: TERMS }

export type PageKey = keyof typeof PAGE_DEFAULTS
export type PageContent<K extends PageKey> = (typeof PAGE_DEFAULTS)[K]

// ───────── Description des sections pour l'éditeur

export const PAGES: PageDef[] = [
  {
    key: 'home',
    label: 'Accueil',
    href: '/',
    sections: [
      {
        id: 'hero',
        label: 'Ouverture (haut de page)',
        fields: [
          text('eyebrow', 'Surtitre'),
          text('titleLine1', 'Titre — ligne 1'),
          text('titleLine2', 'Titre — ligne 2'),
          text('titleHighlight', 'Titre — ligne 3', HIGHLIGHT_HINT),
          area('text', 'Texte'),
          text('primaryCta', 'Bouton principal'),
          text('secondaryCta', 'Lien secondaire'),
          image('image', 'Grande photo'),
          text('badge', 'Pastille rouge', 'Vide = pastille retirée'),
          image('smallImage', 'Petite photo (tirage)'),
          text('smallImageCaption', 'Légende de la petite photo'),
        ],
      },
      {
        id: 'menuExtract',
        label: 'Extrait de la carte',
        toggleable: true,
        fields: [
          text('eyebrow', 'Surtitre'),
          text('title', 'Titre'),
          text('titleHighlight', 'Fin du titre', HIGHLIGHT_HINT),
          text('categories', 'Catégories affichées', 'Identifiants de catégories séparés par des virgules (ex. : lapin, atieke)'),
          text('linkLabel', 'Lien vers la carte'),
        ],
      },
      {
        id: 'signatures',
        label: 'Plats signatures',
        toggleable: true,
        fields: [text('eyebrow', 'Surtitre'), text('title', 'Titre'), text('titleHighlight', 'Fin du titre', HIGHLIGHT_HINT)],
      },
      {
        id: 'story',
        label: 'La maison (citation du chef)',
        toggleable: true,
        fields: [
          text('eyebrow', 'Surtitre'),
          text('quote', 'Citation'),
          text('quoteHighlight', 'Fin de la citation', HIGHLIGHT_HINT),
          area('text', 'Texte'),
          text('linkLabel', 'Lien vers « À propos »', 'Vide = lien retiré'),
          image('image', 'Photo'),
        ],
      },
      { id: 'videos', label: 'Vidéos du chef', toggleable: true, fields: [text('title', 'Titre')] },
      {
        id: 'reviews',
        label: 'Avis clients',
        toggleable: true,
        fields: [text('title', 'Titre'), text('titleHighlight', 'Fin du titre', HIGHLIGHT_HINT)],
      },
      {
        id: 'booking',
        label: 'Bandeau de réservation',
        toggleable: true,
        fields: [text('eyebrow', 'Surtitre'), text('title', 'Titre'), text('titleHighlight', 'Fin du titre', HIGHLIGHT_HINT)],
      },
    ],
  },
  {
    key: 'about',
    label: 'À propos',
    href: '/a-propos',
    sections: [
      {
        id: 'header',
        label: 'En-tête',
        fields: [
          text('eyebrow', 'Surtitre'),
          text('title', 'Titre'),
          text('titleHighlight', 'Fin du titre', HIGHLIGHT_HINT),
          area('intro', 'Introduction'),
          image('image1', 'Grande photo'),
          image('image2', 'Photo en haut à droite'),
          image('image3', 'Photo en bas à droite'),
        ],
      },
      {
        id: 'story',
        label: 'Notre histoire',
        toggleable: true,
        fields: [text('eyebrow', 'Surtitre'), text('title', 'Titre'), paragraphs('paragraphs', 'Texte')],
      },
      {
        id: 'values',
        label: 'Nos valeurs',
        toggleable: true,
        fields: [],
        lists: [{ name: 'items', label: 'Valeurs', itemLabel: 'Valeur', fields: [text('title', 'Titre'), area('text', 'Texte')] }],
      },
      {
        id: 'team',
        label: 'L’équipe',
        toggleable: true,
        fields: [text('eyebrow', 'Surtitre'), text('title', 'Titre'), area('text', 'Texte'), image('image', 'Photo')],
      },
    ],
  },
  {
    key: 'reservation',
    label: 'Réservation',
    href: '/reserver',
    sections: [
      {
        id: 'header',
        label: 'En-tête',
        fields: [text('eyebrow', 'Surtitre'), text('title', 'Titre'), text('titleHighlight', 'Fin du titre', HIGHLIGHT_HINT), area('text', 'Texte')],
      },
    ],
  },
  {
    key: 'contact',
    label: 'Contact',
    href: '/contact',
    sections: [
      { id: 'header', label: 'En-tête', fields: [text('eyebrow', 'Surtitre'), text('title', 'Titre'), area('text', 'Texte')] },
      { id: 'map', label: 'Plan d’accès (Google Maps)', toggleable: true, fields: [] },
    ],
  },
  {
    key: 'help',
    label: 'Aide',
    href: '/aide',
    sections: [
      { id: 'header', label: 'En-tête', fields: [text('eyebrow', 'Surtitre'), text('title', 'Titre')] },
      {
        id: 'faq',
        label: 'Questions fréquentes',
        toggleable: true,
        fields: [],
        lists: [
          {
            name: 'items',
            label: 'Questions',
            itemLabel: 'Question',
            fields: [text('topic', 'Rubrique', 'Les questions de même rubrique sont regroupées'), text('question', 'Question'), area('answer', 'Réponse')],
          },
        ],
      },
      { id: 'cta', label: 'Encart « Nous contacter »', toggleable: true, fields: [text('title', 'Titre'), area('text', 'Texte'), text('button', 'Bouton')] },
    ],
  },
  {
    key: 'terms',
    label: 'Conditions',
    href: '/conditions',
    sections: [
      { id: 'header', label: 'En-tête', fields: [text('title', 'Titre'), text('updated', 'Mention de mise à jour')] },
      {
        id: 'sections',
        label: 'Articles',
        fields: [],
        lists: [{ name: 'items', label: 'Articles', itemLabel: 'Article', fields: [text('title', 'Titre'), area('text', 'Texte', 'Paragraphes séparés par une ligne vide')] }],
      },
    ],
  },
]

type AnyContent = Record<string, Record<string, unknown>>

/** Fusionne le contenu enregistré avec les valeurs par défaut, section par section. */
export function mergeContent<K extends PageKey>(key: K, stored: unknown): PageContent<K> {
  const defaults = PAGE_DEFAULTS[key] as unknown as AnyContent
  const saved = (stored && typeof stored === 'object' ? stored : {}) as Record<string, unknown>
  const merged: AnyContent = {}
  for (const [id, section] of Object.entries(defaults)) {
    const value = saved[id]
    merged[id] = value && typeof value === 'object' && !Array.isArray(value) ? { ...section, ...(value as Record<string, unknown>) } : { ...section }
  }
  return merged as unknown as PageContent<K>
}

/** Découpe un texte en paragraphes (séparés par une ligne vide). */
export const splitParagraphs = (value: string) =>
  value
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
