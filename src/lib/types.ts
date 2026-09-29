// Types des réponses de l'API Maison Braise (montants en GNF).

export type Role = 'CUSTOMER' | 'ADMIN' | 'MANAGER' | 'KITCHEN' | 'WAITER' | 'DRIVER'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  birthDate: string | null
  bio: string | null
  avatarUrl: string | null
  coverUrl: string | null
  role: Role
  referralCode: string
  orangeMoneyNumber: string | null
  hasPassword: boolean
  isGoogleLinked: boolean
  createdAt: string
}

export interface PublicUser {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  role: Role
}

export interface CursorPage<T> {
  items: T[]
  nextCursor: string | null
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  position: number
  isVisible: boolean
  dishCount: number
}

export interface DishOption {
  id: string
  name: string
  extraPrice: number
}

export interface Dish {
  id: string
  name: string
  slug: string
  description: string
  price: number
  imageUrl: string
  imageAlt: string
  categoryId: string
  category: { id: string; name: string; slug: string }
  prepTimeMinutes: number
  isFeatured: boolean
  isAvailable: boolean
  stock: number
  tags: string[]
  allergens: string[]
  chefVideoUrl: string | null
  ratingAvg: number
  ratingCount: number
  options: DishOption[]
  updatedAt: string
}

export type OrderType = 'DELIVERY' | 'PICKUP' | 'DINE_IN'
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED'
export type PaymentProvider = 'ORANGE_MONEY' | 'CARD' | 'PAYPAL' | 'ON_SITE'
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED'
export type DeliveryMode = 'EXPRESS' | 'STANDARD' | 'CLICK_COLLECT'
export type DeliveryStatus =
  | 'PENDING'
  | 'PREPARING'
  | 'READY'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'CANCELLED'

export interface OrderItem {
  id: string
  dishId: string | null
  nameSnapshot: string
  unitPrice: number
  quantity: number
  imageUrl: string | null
  notes: string | null
}

export interface DeliveryEvent {
  id: string
  status: DeliveryStatus
  message: string
  lat: number | null
  lng: number | null
  address: string | null
  createdAt: string
}

export interface Delivery {
  id: string
  orderId: string
  mode: DeliveryMode
  status: DeliveryStatus
  estimatedMinutes: number
  actualMinutes: number | null
  fee: number
  street: string
  city: string
  driverId: string | null
  driverName: string | null
  driverPhone: string | null
  driverVehicle: string | null
  pickedUpAt: string | null
  deliveredAt: string | null
  createdAt: string
  events: DeliveryEvent[]
}

export interface Order {
  id: string
  number: number
  userId: string | null
  type: OrderType
  status: OrderStatus
  subtotal: number
  deliveryFee: number
  deliveryMode: DeliveryMode | null
  total: number
  contactName: string | null
  contactPhone: string | null
  deliveryStreet: string | null
  deliveryCity: string | null
  instructions: string | null
  tastePreferences: string | null
  tableId: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  payment: { provider: PaymentProvider; status: PaymentStatus; checkoutUrl: string | null } | null
  delivery: Delivery | null
  table: { number: number } | null
  user: { id: string; firstName: string; lastName: string; phone: string | null } | null
  nextStatuses: OrderStatus[]
}

export interface PlaceOrderResult {
  orderId: string
  number: number
  total: number
  payment: { checkoutUrl: string | null; instructions: string | null }
}

export interface PaymentMethod {
  provider: Exclude<PaymentProvider, 'ON_SITE'>
  enabled: boolean
  simulated: boolean
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export interface Reservation {
  id: string
  userId: string | null
  firstName: string
  lastName: string
  email: string
  phone: string
  date: string
  timeSlot: string
  partySize: number
  message: string | null
  status: ReservationStatus
  tableId: string | null
  table?: { id?: string; number: number } | null
  createdAt: string
}

export interface Slot {
  time: string
  remaining: number
  available: boolean
}

export interface Availability {
  date: string
  isOpen: boolean
  closureReason: string | null
  slots: Slot[]
}

export interface Review {
  id: string
  userId: string
  dishId: string
  rating: number
  comment: string
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  status: 'PUBLISHED' | 'HIDDEN'
  createdAt: string
  user: PublicUser
  replies: Array<{ id: string; content: string; createdAt: string; author: PublicUser }>
  likeCount?: number
  likedByMe?: boolean
  _count?: { likes: number }
  dish?: { id?: string; name: string; slug: string; imageUrl?: string }
}

export type LoyaltyLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

export interface LoyaltyAccount {
  userId: string
  totalPoints: number
  availablePoints: number
  usedPoints: number
  level: LoyaltyLevel
  nextLevel: { level: LoyaltyLevel; minPoints: number } | null
  progress: number
  levels: Array<{ level: LoyaltyLevel; minPoints: number }>
}

export interface LoyaltyTransaction {
  id: string
  type: 'ORDER' | 'REFERRAL' | 'REDEMPTION' | 'CASHBACK' | 'ADJUSTMENT'
  points: number
  description: string
  createdAt: string
}

export interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  type: 'DISCOUNT' | 'FREE_ITEM' | 'CASHBACK' | 'VOUCHER'
  value: number
  valueType: 'PERCENTAGE' | 'FIXED' | 'POINTS'
  imageUrl: string | null
  category: 'FOOD' | 'DRINK' | 'DISCOUNT' | 'CASHBACK' | 'SPECIAL'
  minLevel: LoyaltyLevel
  stock: number | null
  used: number
  isActive: boolean
  expiresAt: string | null
  soldOut?: boolean
  levelOk?: boolean
  affordable?: boolean
}

export interface Notification {
  id: string
  type: 'REPLY' | 'LIKE' | 'ORDER' | 'RESERVATION' | 'MESSAGE' | 'SYSTEM'
  content: string
  link: string
  readAt: string | null
  createdAt: string
  sender: { firstName: string; lastName: string; avatarUrl: string | null } | null
}

export interface Attachment {
  id: string
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE'
  url: string
  filename: string
  size: number
  mimeType: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  replyToId: string | null
  createdAt: string
  deletedAt: string | null
  sender: PublicUser
  attachments: Attachment[]
  reactions: Array<{ userId: string; emoji: string }>
  replyTo: { id: string; content: string; deletedAt: string | null; sender: { firstName: string } } | null
  isStarred?: boolean
}

export interface ConversationMember extends PublicUser {
  isAdmin: boolean
  lastReadAt: string | null
}

export interface Conversation {
  id: string
  name: string | null
  isGroup: boolean
  disappearingSeconds: number
  lastMessageAt: string
  members: ConversationMember[]
  lastMessage?: (Message & { attachments: Array<{ type: Attachment['type'] }> }) | null
  unread?: number
}

export interface Call {
  id: string
  conversationId: string
  callerId: string
  receiverId: string
  type: 'AUDIO' | 'VIDEO'
  status: 'RINGING' | 'ANSWERED' | 'MISSED' | 'REJECTED' | 'CANCELLED' | 'ENDED'
  durationSeconds: number
  createdAt: string
  caller: PublicUser
  receiver: PublicUser
}

export interface ChefContent {
  id: string
  title: string
  description: string
  type: 'TUTORIAL' | 'LIVE' | 'VIDEO'
  category: 'PREPARATION' | 'COOKING' | 'PLATING' | 'TECHNIQUE' | 'RECIPE' | 'OTHER'
  chefName: string
  chefImageUrl: string | null
  thumbnailUrl: string
  videoUrl: string
  streamUrl: string | null
  isLive: boolean
  durationSeconds: number | null
  views: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  isFeatured: boolean
  dishId: string | null
  dish: { id: string; name: string; slug: string; imageUrl: string } | null
  createdAt: string
  _count: { likes: number }
  likedByMe?: boolean
}

export interface AcademyCourse {
  id: string
  title: string
  instructor: string
  level: string
  duration: string
  lessons: number
  students: number
  rating: number
  price: number
  imageUrl: string
  category: string
  description: string
  modules: Array<{ title: string; duration: string }>
  /** Formule donnée au restaurant. */
  onSite: boolean
  featured: boolean
  schedule: string | null
  seats: number | null
  seatsLeft: number | null
  perks: string[]
}

export type EnrollmentStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED'

export interface CourseEnrollment {
  id: string
  number: number
  courseId: string | null
  courseTitle: string
  amount: number
  status: EnrollmentStatus
  createdAt: string
  course: { imageUrl: string; schedule: string | null; onSite: boolean; duration?: string; instructor?: string } | null
  payment: { provider: PaymentProvider; status: string; checkoutUrl?: string | null } | null
}

export interface EnrollResult {
  enrollmentId: string
  checkoutUrl: string | null
  instructions: string | null
}

export interface AcademyResource {
  id: string
  title: string
  description: string
  fileUrl: string
  category: string
  type: string
  createdAt: string
}

export interface LiveSession {
  isLive: boolean
  title: string
  description: string
  streamUrl: string | null
  startedAt: string | null
}

export interface OpeningHours {
  hours: Array<{ dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean }>
  closures: Array<{ id: string; date: string; reason: string }>
}

export interface RestaurantSettings {
  name: string
  tagline: string
  phone: string
  whatsapp?: string
  email: string
  address: string
  city: string
  mapUrl?: string
  socials: { facebook?: string; instagram?: string; tiktok?: string }
}

export interface Table {
  id: string
  number: number
  capacity: number
  zone: 'INDOOR' | 'OUTDOOR' | 'VIP'
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'
  qrToken: string
  qrUrl: string
  isActive: boolean
  orders: Array<{ id: string; number: number; status: OrderStatus; total: number; createdAt: string }>
}

export interface Company {
  id: string
  name: string
  email: string
  phone: string
  street: string | null
  city: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  discountPercent: number
  billingCycle: 'WEEKLY' | 'MONTHLY'
  paymentTermsDays: number
  currentBalance: number
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
  adminId: string
  admin: { id: string; firstName: string; lastName: string; email: string }
  createdAt: string
  access?: 'platform' | 'admin' | 'employee'
  _count?: { employees: number; orders: number }
  employees?: Array<{
    userId: string
    employeeCode: string | null
    department: string | null
    position: string | null
    user: { id: string; firstName: string; lastName: string; email: string }
  }>
  prices?: Array<{ dishId: string; price: number; dish: { id: string; name: string; price: number } }>
}

export interface CorporateOrder {
  id: string
  companyId: string
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  total: number
  deliveryStreet: string | null
  deliveryCity: string | null
  deliveryDate: string | null
  recurrence: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  recurrenceDays: number[]
  notes: string | null
  createdAt: string
  items: Array<{ id: string; nameSnapshot: string; unitPrice: number; quantity: number }>
  employee: { firstName: string; lastName: string }
  invoice: { number: string; status: string } | null
}

export interface CorporateInvoice {
  id: string
  number: string
  periodStart: string
  periodEnd: string
  subtotal: number
  tax: number
  total: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  dueDate: string
  paidAt: string | null
  createdAt: string
  lines: Array<{ description: string; quantity: number; unitPrice: number; total: number }>
  company: { name: string; email: string; street: string | null; city: string | null }
}

export interface Address {
  id: string
  label: string
  street: string
  city: string
  instructions: string | null
  isDefault: boolean
}
