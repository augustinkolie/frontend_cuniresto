import { z } from 'zod'

// Schémas de formulaires, alignés sur les règles de validation de l'API.

export const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ]{8,20}$/, 'Numéro invalide (ex. : 620 00 00 00)')

export const loginSchema = z.object({
  email: z.email('E-mail invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis').max(80),
  lastName: z.string().trim().min(1, 'Nom requis').max(80),
  email: z.email('E-mail invalide'),
  password: z.string().min(8, '8 caractères minimum').max(128),
  referralCode: z.string().trim().max(20).optional(),
})

export const reservationSchema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis').max(80),
  lastName: z.string().trim().min(1, 'Nom requis').max(80),
  email: z.email('E-mail invalide'),
  phone,
  message: z.string().max(1000).optional(),
})

export const contactSchema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis').max(80),
  lastName: z.string().trim().min(1, 'Nom requis').max(80),
  email: z.email('E-mail invalide'),
  phone,
  subject: z.string().trim().min(2, 'Sujet requis').max(160),
  message: z.string().trim().min(10, '10 caractères minimum').max(5000),
})

export const checkoutSchema = z
  .object({
    type: z.enum(['DELIVERY', 'PICKUP']),
    mode: z.enum(['STANDARD', 'EXPRESS']),
    contactName: z.string().trim().max(120).optional(),
    contactPhone: phone,
    street: z.string().trim().max(200).optional(),
    city: z.string().trim().max(80).optional(),
    instructions: z.string().max(500).optional(),
    tastePreferences: z.string().max(500).optional(),
    paymentMethod: z.enum(['ORANGE_MONEY', 'CARD', 'PAYPAL']),
    orangeMoneyPhone: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'DELIVERY') {
      if (!v.street || v.street.length < 3) ctx.addIssue({ code: 'custom', path: ['street'], message: 'Adresse requise' })
      if (!v.city || v.city.length < 2) ctx.addIssue({ code: 'custom', path: ['city'], message: 'Ville requise' })
    }
    if (v.paymentMethod === 'ORANGE_MONEY' && v.orangeMoneyPhone && !/^\+?[0-9 ]{8,20}$/.test(v.orangeMoneyPhone)) {
      ctx.addIssue({ code: 'custom', path: ['orangeMoneyPhone'], message: 'Numéro Orange Money invalide' })
    }
  })

export type CheckoutValues = z.infer<typeof checkoutSchema>
