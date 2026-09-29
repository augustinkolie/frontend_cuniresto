// Commande vocale : « je veux deux lapins braisés et un jus de bissap » → lignes de panier.

const NUMBER_WORDS: Record<string, number> = {
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
}

export const normalize = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

const singular = (w: string) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w)
const STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'au', 'aux', 'a', 'l', 'd', 'et', 'avec', 'sauce'])

export function isOrderIntent(text: string): boolean {
  return /\b(je veux|je voudrais|ajoute|ajouter|commande|commander|donne moi|mets moi|il me faut)\b/.test(normalize(text))
}

interface NamedDish {
  id: string
  name: string
}

/** Associe chaque segment de la phrase au plat dont le nom ressemble le plus. */
export function parseVoiceOrder<T extends NamedDish>(text: string, dishes: T[]): Array<{ dish: T; quantity: number }> {
  const cleaned = normalize(text).replace(/\b(je veux|je voudrais|ajoute|ajouter|commande|commander|donne moi|mets moi|il me faut|s il te plait|s il vous plait|merci)\b/g, ' ')
  const segments = cleaned.split(/\b(?:et|puis|plus)\b|,/).map((s) => s.trim()).filter(Boolean)
  const results: Array<{ dish: T; quantity: number }> = []

  for (const segment of segments) {
    const words = segment.split(' ')
    let quantity = 1
    const first = words[0] ?? ''
    if (/^\d+$/.test(first)) {
      quantity = Math.min(50, Number(first))
      words.shift()
    } else if (NUMBER_WORDS[first]) {
      quantity = NUMBER_WORDS[first]!
      words.shift()
    }
    const tokens = words.map(singular).filter((w) => !STOP.has(w))
    if (tokens.length === 0) continue

    let best: { dish: T; score: number } | null = null
    for (const dish of dishes) {
      const nameTokens = normalize(dish.name).split(' ').map(singular).filter((w) => !STOP.has(w))
      const hits = tokens.filter((t) => nameTokens.some((n) => n === t || (t.length > 4 && n.startsWith(t.slice(0, -1))))).length
      const score = hits / Math.max(nameTokens.length, tokens.length)
      if (hits > 0 && (!best || score > best.score)) best = { dish, score }
    }
    if (best && best.score >= 0.34) results.push({ dish: best.dish, quantity })
  }
  return results
}
