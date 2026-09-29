'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { useSession } from '@/hooks/use-session'
import { errorMessage, post } from '@/lib/api'
import { contactSchema } from '@/lib/schemas'

const SUBJECTS = ['Réservation de groupe', 'Commande', 'Événement privé', 'Partenariat', 'Réclamation', 'Autre']

export function ContactForm() {
  const { user } = useSession()
  const [sent, setSent] = useState(false)
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    values: user
      ? { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone ?? '', subject: '', message: '' }
      : undefined,
  })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (values) => {
    try {
      await post('/contact', values)
      setSent(true)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  })

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center" role="status">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <h2 className="text-2xl font-medium">Message envoyé</h2>
        <p className="text-muted">Merci ! Nous vous répondons sous 24 h ouvrées.</p>
        <Button variant="secondary" onClick={() => (form.reset(), setSent(false))}>
          Envoyer un autre message
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" error={errors.firstName?.message}>
          {(p) => <Input {...p} autoComplete="given-name" {...form.register('firstName')} />}
        </Field>
        <Field label="Nom" error={errors.lastName?.message}>
          {(p) => <Input {...p} autoComplete="family-name" {...form.register('lastName')} />}
        </Field>
        <Field label="E-mail" error={errors.email?.message}>
          {(p) => <Input {...p} type="email" autoComplete="email" {...form.register('email')} />}
        </Field>
        <Field label="Téléphone" error={errors.phone?.message}>
          {(p) => <Input {...p} type="tel" autoComplete="tel" {...form.register('phone')} />}
        </Field>
      </div>
      <Field label="Sujet" error={errors.subject?.message}>
        {(p) => (
          <Select {...p} defaultValue="" {...form.register('subject')}>
            <option value="" disabled>
              Choisissez un sujet
            </option>
            {SUBJECTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Message" error={errors.message?.message}>
        {(p) => <Textarea {...p} rows={6} {...form.register('message')} />}
      </Field>
      <Button type="submit" loading={isSubmitting}>
        Envoyer
      </Button>
    </form>
  )
}
