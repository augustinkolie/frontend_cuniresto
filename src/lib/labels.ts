import type {
  DeliveryMode,
  DeliveryStatus,
  LoyaltyLevel,
  OrderStatus,
  OrderType,
  PaymentProvider,
  ReservationStatus,
  Role,
} from './types'

export const ORDER_STATUS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'En attente de paiement',
  CONFIRMED: 'Reçue',
  PREPARING: 'En préparation',
  READY: 'Prête',
  OUT_FOR_DELIVERY: 'En livraison',
  DELIVERED: 'Livrée',
  SERVED: 'Servie',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
}

export const ORDER_TYPE: Record<OrderType, string> = {
  DELIVERY: 'Livraison',
  PICKUP: 'À emporter',
  DINE_IN: 'Sur place',
}

export const DELIVERY_MODE: Record<DeliveryMode, string> = {
  EXPRESS: 'Express',
  STANDARD: 'Standard',
  CLICK_COLLECT: 'Retrait',
}

export const DELIVERY_STATUS: Record<DeliveryStatus, string> = {
  PENDING: 'En attente',
  PREPARING: 'En préparation',
  READY: 'Prête',
  ASSIGNED: 'Livreur assigné',
  PICKED_UP: 'Récupérée',
  IN_TRANSIT: 'En route',
  ARRIVED: 'Livreur arrivé',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
}

export const PAYMENT_PROVIDER: Record<PaymentProvider, string> = {
  ORANGE_MONEY: 'Orange Money',
  CARD: 'Carte bancaire',
  PAYPAL: 'PayPal',
  ON_SITE: 'Sur place',
}

export const RESERVATION_STATUS: Record<ReservationStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Honorée',
}

export const ROLE: Record<Role, string> = {
  CUSTOMER: 'Client',
  ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  KITCHEN: 'Cuisine',
  WAITER: 'Serveur',
  DRIVER: 'Livreur',
}

export const LEVEL: Record<LoyaltyLevel, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  PLATINUM: 'Platine',
}

export const TAG: Record<string, string> = {
  vegetarian: 'Végétarien',
  vegan: 'Vegan',
  spicy: 'Épicé',
  signature: 'Signature',
  new: 'Nouveau',
  halal: 'Halal',
}

export const ALLERGEN: Record<string, string> = {
  gluten: 'Gluten',
  lactose: 'Lactose',
  eggs: 'Œufs',
  nuts: 'Fruits à coque',
  peanuts: 'Arachides',
  soy: 'Soja',
  fish: 'Poisson',
  shellfish: 'Crustacés',
  sesame: 'Sésame',
  celery: 'Céleri',
  mustard: 'Moutarde',
}

/** Étapes affichées dans la frise de suivi (§3.4 : 4 étapes). */
export function trackingSteps(type: OrderType): Array<{ status: OrderStatus[]; label: string }> {
  const last =
    type === 'DELIVERY'
      ? { status: ['OUT_FOR_DELIVERY', 'DELIVERED'] as OrderStatus[], label: 'En livraison' }
      : type === 'PICKUP'
        ? { status: ['COMPLETED'] as OrderStatus[], label: 'Récupérée' }
        : { status: ['SERVED', 'COMPLETED'] as OrderStatus[], label: 'Servie' }
  return [
    { status: ['CONFIRMED'], label: 'Reçue' },
    { status: ['PREPARING'], label: 'En préparation' },
    { status: ['READY'], label: 'Prête' },
    last,
  ]
}
