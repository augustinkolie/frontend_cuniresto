// Catégories
export const CATEGORIES = {
  LAPIN: 'lapin',
  ATIEKE: 'atieke',
  NOUILLE: 'nouille',
  SANDWICH: 'sandwich',
}

export const CATEGORY_LABELS = {
  lapin: 'Lapin Braisé',
  atieke: 'Atiéké',
  nouille: 'Nouilles',
  sandwich: 'Sandwichs',
}

// Couleurs
export const COLORS = {
  PRIMARY: '#FF6B35',
  SECONDARY: '#004E89',
  ACCENT: '#F7B801',
  GRAY_100: '#f3f4f6',
  GRAY_200: '#e5e7eb',
  GRAY_300: '#d1d5db',
  GRAY_400: '#9ca3af',
  GRAY_500: '#6b7280',
  GRAY_600: '#4b5563',
  GRAY_700: '#374151',
  GRAY_800: '#1f2937',
  GRAY_900: '#111827',
}

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 255,
}

// Messages
export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Connexion réussie!',
    REGISTER: 'Inscription réussie!',
    ADD_TO_CART: 'Produit ajouté au panier',
    REMOVE_FROM_CART: 'Produit supprimé du panier',
    RESERVATION: 'Réservation confirmée!',
    COMMENT: 'Commentaire ajouté!',
  },
  ERROR: {
    REQUIRED_FIELDS: 'Renseigner tous les champs',
    INVALID_EMAIL: 'Email invalide',
    PASSWORD_MISMATCH: 'Les deux mots de passe ne concordent pas',
    PASSWORD_TOO_SHORT: `Le mot de passe doit faire au moins ${VALIDATION.MIN_PASSWORD_LENGTH} caractères`,
    EMAIL_ALREADY_USED: 'Email déjà utilisé',
    INVALID_CREDENTIALS: 'Email et/ou mot de passe incorrect',
    USER_NOT_FOUND: 'Aucun utilisateur trouvé',
    NETWORK_ERROR: 'Erreur de connexion. Veuillez réessayer.',
    SOMETHING_WRONG: 'Une erreur est survenue. Veuillez réessayer.',
  },
}

// Routes
export const ROUTES = {
  HOME: '/',
  CATEGORIES: '/categories',
  CATEGORY: (slug) => `/category/${slug}`,
  PRODUCT: (id) => `/product/${id}`,
  CART: '/cart',
  LOGIN: '/login',
  RESERVATION: '/reservation',
  NOT_FOUND: '*',
}

// Pagination
export const PAGINATION = {
  ITEMS_PER_PAGE: 12,
  ITEMS_PER_PAGE_MOBILE: 6,
}

// Timeouts
export const TIMEOUTS = {
  TOAST: 3000,
  MODAL: 300,
  ANIMATION: 300,
}

// Local Storage Keys
export const STORAGE_KEYS = {
  USER: 'user',
  AUTH_TOKEN: 'authToken',
  CART: 'cart',
  THEME: 'theme',
  LANGUAGE: 'language',
}
