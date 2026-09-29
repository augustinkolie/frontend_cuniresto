'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage, post } from '@/lib/api'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await post<{ message: string }>('/newsletter', { email })
      toast.success(res.message)
      setEmail('')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Votre e-mail
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="votre@email.com"
        className="h-12 min-w-0 flex-1 rounded-[var(--radius-control)] border border-line bg-surface px-4 placeholder:text-muted/70 focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="h-12 shrink-0 rounded-[var(--radius-control)] border border-text/40 px-4 font-semibold hover:border-text disabled:opacity-50"
      >
        S’inscrire
      </button>
    </form>
  )
}
