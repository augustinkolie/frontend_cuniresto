import { mockProducts } from '../data/mockData'

// Catégories de plats avec descriptions
const categories = {
  'lapin': {
    name: 'Lapin',
    description: 'Plats de lapin braisés avec différentes sauces',
    keywords: ['lapin', 'rabbit', 'viande', 'braisé', 'sauce'],
    recommendations: ['Lapin Braisé Savoureux', 'Lapin aux Herbes']
  },
  'atieke': {
    name: 'Atiéké',
    description: 'Atiéké traditionnel avec accompagnements',
    keywords: ['atieke', 'atiéké', 'manioc', 'accompagnement'],
    recommendations: ['Atiéké Traditionnel', 'Atiéké Garni']
  },
  'nouille': {
    name: 'Nouilles',
    description: 'Nouilles sautées et plats de pâtes',
    keywords: ['nouille', 'nouilles', 'pâtes', 'spaghetti', 'pasta'],
    recommendations: ['Nouilles Spéciales', 'Nouilles aux Légumes']
  },
  'sandwich': {
    name: 'Sandwich',
    description: 'Sandwichs frais et gourmands',
    keywords: ['sandwich', 'sandwichs', 'rapide', 'snack'],
    recommendations: ['Sandwich Gourmand', 'Sandwich Premium']
  },
  'boissons': {
    name: 'Boissons',
    description: 'Boissons fraîches et chaudes',
    keywords: ['boisson', 'boissons', 'jus', 'café', 'thé', 'eau', 'soda'],
    recommendations: ['Jus d\'Orange Frais', 'Café Expresso']
  },
  'desserts': {
    name: 'Desserts',
    description: 'Desserts maison et gourmands',
    keywords: ['dessert', 'desserts', 'sucré', 'gâteau', 'glace', 'tiramisu'],
    recommendations: ['Tiramisu Maison', 'Mousse au Chocolat']
  }
}

// Patterns de reconnaissance pour les salutations (plus complets)
const greetingPatterns = [
  /^(bonjour|salut|hello|hi|hey|bonsoir|bonne soirée|bonne journée|bon matin|good morning|good evening)/i,
  /^(ça va|comment allez|comment ça va|comment tu vas|comment vous allez|how are you|how do you do)/i,
  /^(bon|excellent|super|génial|parfait|ok|d'accord)/i,
  /^(bonne|bon|salutations|greetings)/i,
  /^(allô|allo|allô|yo|wesh|salam|salam alaikum)/i,
  /^(merci|thank you|thanks|merci beaucoup)/i,
  /^(au revoir|bye|à bientôt|à plus|see you|goodbye)/i
]

// Patterns pour les questions sur les plats (améliorés)
const foodQuestionPatterns = {
  recommandation: [
    /(recommand|suggér|conseill|meilleur|top|favori|préfér|idée|propos)/i,
    /(quoi|que|quel|quelle|quels|quelles).*(manger|commander|prendre|choisir|essayer|goûter)/i,
    /(je veux|j'aimerais|je cherche|je voudrais|je souhaite|donne|montre)/i,
    /(qu'est-ce|qu'est ce|qu'est-ce que|que puis|que peux)/i
  ],
  prix: [
    /(prix|coût|tarif|combien|cher|gratuit|payant|payer|facture)/i,
    /(€|euro|franc|f cfa|cfa|argent|budget)/i,
    /(combien coûte|quel est le prix|le prix de)/i
  ],
  ingrédients: [
    /(ingrédient|compos|contient|avec|sans|dans|recette)/i,
    /(viande|poisson|poulet|lapin|végétarien|végétal|boeuf|porc)/i,
    /(épicé|piquant|doux|sucré|salé|amer|saveur|goût)/i
  ],
  temps: [
    /(temps|durée|rapide|long|minute|heure|attendre|prêt)/i,
    /(combien de temps|préparation|cuisson|livraison|délai)/i
  ],
  allergie: [
    /(allerg|intolér|éviter|ne pas|sans|interdit|dangereux)/i,
    /(gluten|lactose|arachide|noix|crustacé|poisson|oeuf)/i
  ],
  menu: [
    /(menu|carte|plats|disponible|offre|spécialité)/i,
    /(quels plats|quelles options|liste|voir|afficher)/i
  ],
  réservation: [
    /(réserv|réserver|table|place|disponibilité|horaire)/i,
    /(réserver|booker|appeler|téléphoner|contact)/i
  ],
  adresse: [
    /(adresse|localisation|où|lieu|situé|trouver)/i,
    /(comment venir|comment arriver|itinéraire|gps)/i
  ],
  horaire: [
    /(horaire|heure|ouvert|fermé|ouverture|fermeture)/i,
    /(quand|à quelle heure|jour|semaine)/i
  ]
}

// Patterns pour les préférences
const preferencePatterns = {
  épicé: [/(épicé|piquant|spicy|fort|chaud)/i],
  doux: [/(doux|mild|doux|sucré|sweet)/i],
  végétarien: [/(végétarien|végétal|sans viande|vegan|végé)/i],
  rapide: [/(rapide|fast|quick|vite|urgent)/i],
  économique: [/(pas cher|économique|budget|moins cher|bon marché)/i],
  premium: [/(premium|luxe|gastronomique|raffiné|haut de gamme)/i]
}

// Fonction pour normaliser le texte
const normalizeText = (text) => {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .trim()
}

// Fonction pour détecter les salutations (améliorée)
const isGreeting = (text) => {
  const normalized = normalizeText(text)
  const trimmed = normalized.trim()
  
  // Vérifier si c'est une salutation simple (1-3 mots)
  const words = trimmed.split(/\s+/)
  if (words.length <= 3) {
    return greetingPatterns.some(pattern => pattern.test(trimmed))
  }
  
  // Vérifier si le message commence par une salutation
  return greetingPatterns.some(pattern => {
    const match = trimmed.match(pattern)
    return match && match.index === 0
  })
}

// Fonction pour détecter les remerciements
const isThankYou = (text) => {
  const normalized = normalizeText(text)
  return /(merci|thank|thanks|gratitude|apprécie|reconnaissant)/i.test(normalized)
}

// Fonction pour détecter les au revoir
const isGoodbye = (text) => {
  const normalized = normalizeText(text)
  return /(au revoir|bye|à bientôt|à plus|see you|goodbye|à tout à l'heure|à demain)/i.test(normalized)
}

// Fonction pour détecter le type de question
const detectQuestionType = (text) => {
  const normalized = normalizeText(text)
  
  for (const [type, patterns] of Object.entries(foodQuestionPatterns)) {
    if (patterns.some(pattern => pattern.test(normalized))) {
      return type
    }
  }
  
  return 'general'
}

// Fonction pour détecter les préférences
const detectPreferences = (text) => {
  const normalized = normalizeText(text)
  const preferences = []
  
  for (const [pref, patterns] of Object.entries(preferencePatterns)) {
    if (patterns.some(pattern => pattern.test(normalized))) {
      preferences.push(pref)
    }
  }
  
  return preferences
}

// Fonction pour trouver des plats correspondants
const findMatchingProducts = (text, preferences = []) => {
  const normalized = normalizeText(text)
  const matches = []
  
  // Chercher par catégorie
  for (const [categoryKey, category] of Object.entries(categories)) {
    if (category.keywords.some(keyword => normalized.includes(keyword))) {
      const categoryProducts = mockProducts.filter(p => 
        p.category === categoryKey || p.name.toLowerCase().includes(categoryKey)
      )
      matches.push(...categoryProducts)
    }
  }
  
  // Chercher par nom de plat
  mockProducts.forEach(product => {
    const productName = normalizeText(product.name)
    if (normalized.includes(productName) || productName.includes(normalized)) {
      matches.push(product)
    }
  })
  
  // Filtrer selon les préférences
  let filtered = matches
  if (preferences.includes('économique')) {
    filtered = filtered.filter(p => p.price < 10000)
  }
  if (preferences.includes('rapide')) {
    filtered = filtered.filter(p => {
      const time = parseInt(p.prepTime) || 30
      return time <= 15
    })
  }
  
  // Retirer les doublons
  const unique = filtered.filter((product, index, self) =>
    index === self.findIndex(p => p.id === product.id)
  )
  
  return unique.slice(0, 3) // Retourner max 3 résultats
}

// Fonction principale pour générer une réponse
export const generateBotResponse = (userMessage, conversationHistory = []) => {
  const normalizedMessage = normalizeText(userMessage)
  
  // Réponses aux remerciements
  if (isThankYou(userMessage)) {
    const thankYouResponses = [
      "De rien ! C'est un plaisir de vous aider. N'hésitez pas si vous avez d'autres questions !",
      "Je vous en prie ! Si vous avez besoin d'autre chose, je suis là pour vous.",
      "Avec plaisir ! Bon appétit et à bientôt chez CuniResto !",
      "Pas de souci ! J'espère que vous trouverez le plat parfait. Bonne dégustation !"
    ]
    return {
      text: thankYouResponses[Math.floor(Math.random() * thankYouResponses.length)],
      suggestions: ['Autres questions', 'Voir le menu', 'Faire une réservation', 'Informations']
    }
  }
  
  // Réponses aux au revoir
  if (isGoodbye(userMessage)) {
    const goodbyeResponses = [
      "Au revoir ! À bientôt chez CuniResto. Bon appétit !",
      "À bientôt ! J'espère vous revoir très soon. Passez une excellente journée !",
      "Au revoir et merci de votre visite ! Nous avons hâte de vous servir.",
      "À plus tard ! N'hésitez pas à revenir si vous avez des questions."
    ]
    return {
      text: goodbyeResponses[Math.floor(Math.random() * goodbyeResponses.length)],
      suggestions: []
    }
  }
  
  // Réponses aux salutations
  if (isGreeting(userMessage)) {
    const greetings = [
      "Bonjour ! 👋 Je suis ravi de vous aider. Comment puis-je vous assister aujourd'hui ?",
      "Salut ! Bienvenue chez CuniResto. Que souhaitez-vous découvrir aujourd'hui ?",
      "Bonjour ! Je suis votre assistant culinaire IA. Avez-vous des préférences particulières ?",
      "Hello ! Prêt à découvrir nos délicieux plats ? Que cherchez-vous ?",
      "Bonjour ! Enchanté de vous rencontrer. Je peux vous aider à trouver le plat parfait. Que désirez-vous ?",
      "Salut ! Je suis là pour vous guider dans votre choix culinaire. Par où commençons-nous ?"
    ]
    return {
      text: greetings[Math.floor(Math.random() * greetings.length)],
      suggestions: ['Recommandations', 'Voir le menu', 'Plats populaires', 'Informations']
    }
  }
  
  // Détecter le type de question
  const questionType = detectQuestionType(userMessage)
  const preferences = detectPreferences(userMessage)
  
  // Réponses selon le type de question
  switch (questionType) {
    case 'recommandation':
      const matchingProducts = findMatchingProducts(userMessage, preferences)
      
      if (matchingProducts.length > 0) {
        const productList = matchingProducts.map(p => 
          `• ${p.name} (${p.price.toLocaleString()} FCFA) - ${p.description}`
        ).join('\n')
        
        return {
          text: `Voici mes recommandations basées sur vos préférences :\n\n${productList}\n\nCes plats sont très appréciés par nos clients ! Souhaitez-vous plus d'informations sur l'un d'eux ?`,
          suggestions: matchingProducts.slice(0, 3).map(p => p.name)
        }
      } else {
        // Recommandations générales selon les préférences
        if (preferences.includes('végétarien')) {
          return {
            text: "Pour une option végétarienne, je recommande nos plats à base d'atiéké avec légumes frais. Nous avons aussi des salades gourmandes. Voulez-vous voir nos options végétariennes ?",
            suggestions: ['Atiéké Traditionnel', 'Salades', 'Voir le menu']
          }
        }
        if (preferences.includes('épicé')) {
          return {
            text: "Si vous aimez les plats épicés, je recommande notre Lapin Braisé avec sauce piquante ou nos plats aux épices traditionnelles. Ces plats sont très savoureux !",
            suggestions: ['Lapin Braisé', 'Plats épicés', 'Voir le menu']
          }
        }
        if (preferences.includes('rapide')) {
          const quickProducts = mockProducts.filter(p => {
            const time = parseInt(p.prepTime) || 30
            return time <= 15
          }).slice(0, 3)
          
          return {
            text: `Pour un repas rapide, je recommande :\n${quickProducts.map(p => `• ${p.name} (${p.prepTime})`).join('\n')}\n\nCes plats sont prêts rapidement !`,
            suggestions: quickProducts.map(p => p.name)
          }
        }
        
        // Recommandations générales
        const featured = mockProducts.filter(p => p.featured).slice(0, 3)
        return {
          text: `Voici nos plats les plus populaires :\n${featured.map(p => `• ${p.name} - ${p.description} (${p.price.toLocaleString()} FCFA)`).join('\n')}\n\nCes plats sont très appréciés !`,
          suggestions: featured.map(p => p.name)
        }
      }
      
    case 'prix':
      const priceMatch = userMessage.match(/(\d+)/)
      if (priceMatch) {
        const maxPrice = parseInt(priceMatch[1]) * 1000 // Convertir en FCFA
        const affordableProducts = mockProducts.filter(p => p.price <= maxPrice)
        
        if (affordableProducts.length > 0) {
          return {
            text: `Dans votre budget, je recommande :\n${affordableProducts.slice(0, 5).map(p => `• ${p.name} - ${p.price.toLocaleString()} FCFA`).join('\n')}`,
            suggestions: affordableProducts.slice(0, 3).map(p => p.name)
          }
        }
      }
      
      const priceRange = {
        min: Math.min(...mockProducts.map(p => p.price)),
        max: Math.max(...mockProducts.map(p => p.price))
      }
      
      return {
        text: `Nos prix varient entre ${priceRange.min.toLocaleString()} et ${priceRange.max.toLocaleString()} FCFA. Nous avons des options pour tous les budgets ! Quel type de plat vous intéresse ?`,
        suggestions: ['Plats économiques', 'Plats premium', 'Voir le menu']
      }
      
    case 'ingrédients':
      if (normalizedMessage.includes('végétarien') || normalizedMessage.includes('sans viande')) {
        return {
          text: "Nous avons plusieurs options végétariennes : atiéké avec légumes, salades fraîches, et plats aux légumes. Tous nos plats peuvent être adaptés selon vos préférences alimentaires.",
          suggestions: ['Atiéké', 'Salades', 'Options végétariennes']
        }
      }
      if (normalizedMessage.includes('épicé') || normalizedMessage.includes('piquant')) {
        return {
          text: "Nos plats épicés sont préparés avec des épices traditionnelles. Le niveau d'épice peut être ajusté selon vos préférences. Je recommande notre Lapin Braisé avec sauce piquante.",
          suggestions: ['Lapin Braisé', 'Plats épicés', 'Voir le menu']
        }
      }
      
      return {
        text: "Tous nos plats sont préparés avec des ingrédients frais et de qualité. Nous utilisons des épices traditionnelles et des recettes authentiques. Quel plat vous intéresse particulièrement ?",
        suggestions: ['Voir le menu', 'Informations nutritionnelles', 'Allergies']
      }
      
    case 'temps':
      const timeMatch = userMessage.match(/(\d+)/)
      if (timeMatch) {
        const maxTime = parseInt(timeMatch[1])
        const quickProducts = mockProducts.filter(p => {
          const time = parseInt(p.prepTime) || 30
          return time <= maxTime
        })
        
        if (quickProducts.length > 0) {
          return {
            text: `Voici nos plats prêts en moins de ${maxTime} minutes :\n${quickProducts.map(p => `• ${p.name} (${p.prepTime})`).join('\n')}`,
            suggestions: quickProducts.slice(0, 3).map(p => p.name)
          }
        }
      }
      
      return {
        text: "Nos temps de préparation varient entre 10 et 30 minutes selon les plats. Les sandwichs sont les plus rapides (10 min), tandis que les plats braisés prennent environ 25-30 minutes. Quel type de plat vous intéresse ?",
        suggestions: ['Plats rapides', 'Voir le menu', 'Faire une commande']
      }
      
    case 'allergie':
      return {
        text: "Nous prenons très au sérieux les allergies alimentaires. Tous nos plats peuvent être adaptés selon vos besoins. Veuillez nous informer de vos allergies lors de votre commande ou réservation. Nos chefs peuvent préparer des alternatives sûres.",
        suggestions: ['Voir le menu', 'Contacter le restaurant', 'Faire une réservation']
      }
      
    case 'menu':
      const allCategories = Object.values(categories).map(cat => cat.name).join(', ')
      return {
        text: `Notre menu comprend plusieurs catégories : ${allCategories}. Nous avons aussi des boissons fraîches et des desserts maison. Que souhaitez-vous découvrir en particulier ?`,
        suggestions: ['Voir toutes les catégories', 'Plats populaires', 'Boissons', 'Desserts']
      }
      
    case 'réservation':
      return {
        text: "Pour réserver une table, vous pouvez :\n• Utiliser notre système de réservation en ligne\n• Nous appeler directement\n• Passer au restaurant\n\nSouhaitez-vous que je vous guide pour faire une réservation ?",
        suggestions: ['Faire une réservation', 'Voir les disponibilités', 'Contacter le restaurant']
      }
      
    case 'adresse':
      return {
        text: "Nous sommes situés dans le cœur de la ville. Pour connaître notre adresse exacte et les itinéraires, je vous invite à consulter notre page Contact qui contient toutes les informations de localisation et les moyens de nous joindre.",
        suggestions: ['Voir la page Contact', 'Itinéraire GPS', 'Informations pratiques']
      }
      
    case 'horaire':
      return {
        text: "Nos horaires d'ouverture :\n• Lundi - Vendredi : 11h00 - 22h00\n• Samedi - Dimanche : 10h00 - 23h00\n\nNous sommes ouverts tous les jours pour vous servir !",
        suggestions: ['Faire une réservation', 'Voir le menu', 'Nous contacter']
      }
      
    default:
      // Recherche générale dans les produits
      const generalMatches = findMatchingProducts(userMessage, preferences)
      
      if (generalMatches.length > 0) {
        const product = generalMatches[0]
        return {
          text: `Je vous recommande "${product.name}" ! ${product.description}. Prix : ${product.price.toLocaleString()} FCFA, temps de préparation : ${product.prepTime}. C'est un de nos plats les plus appréciés !`,
          suggestions: ['Voir les détails', 'Autres recommandations', 'Faire une commande']
        }
      }
      
      // Vérifier si c'est une question simple
      if (normalizedMessage.length < 20 && /^(quoi|que|qui|où|quand|comment|pourquoi|quel|quelle)/i.test(normalizedMessage)) {
        return {
          text: "Je peux vous aider avec :\n• Des recommandations de plats\n• Des informations sur nos menus\n• Les prix et horaires\n• Les réservations\n• Les allergies et préférences alimentaires\n\nQue souhaitez-vous savoir exactement ?",
          suggestions: ['Recommandations', 'Voir le menu', 'Informations pratiques', 'Faire une réservation']
        }
      }
      
      // Réponses par défaut améliorées
      const defaultResponses = [
        "Je comprends votre question. Pour mieux vous aider, pouvez-vous me donner plus de détails ? Par exemple :\n• Quel type de plat vous intéresse ?\n• Avez-vous des préférences (épicé, végétarien, etc.) ?\n• Quel est votre budget approximatif ?",
        "Je peux vous aider à trouver le plat parfait ! Dites-moi ce que vous aimez : épicé, doux, végétarien, rapide, etc. Je vous proposerai les meilleures options.",
        "Pour mieux vous conseiller, pouvez-vous me dire :\n• Quel type de plat vous intéresse ?\n• Avez-vous des préférences (épicé, végétarien, etc.) ?\n• Quel est votre budget approximatif ?\n\nOu je peux vous montrer nos plats les plus populaires !",
        "Je suis là pour vous aider ! Je peux répondre à vos questions sur nos plats, nos prix, nos horaires, ou vous faire des recommandations personnalisées. Que souhaitez-vous savoir ?"
      ]
      
      return {
        text: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
        suggestions: ['Recommandations', 'Voir le menu', 'Plats populaires', 'Informations']
      }
  }
}

// Fonction pour obtenir une réponse de bienvenue initiale
export const getWelcomeMessage = () => {
  return {
    text: "Bonjour ! 👋 Je suis votre assistant culinaire IA. Je peux vous aider à :\n\n• Trouver le plat parfait selon vos goûts\n• Répondre à vos questions sur nos plats\n• Vous donner des recommandations personnalisées\n\nQue souhaitez-vous découvrir aujourd'hui ?",
    suggestions: ['Recommandations', 'Voir le menu', 'Plats populaires', 'Informations']
  }
}


