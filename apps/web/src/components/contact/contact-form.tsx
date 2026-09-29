'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { contactSchema, type ContactFormValues } from '@prescriptionmaker/validation'
import { cn } from '@/lib/utils'

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormValues) => {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Message sent! We\'ll get back to you within 24 hours.')
      reset()
    } catch {
      toast.error('Failed to send message. Please email us directly at support@prescriptionmaker.in')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="field-group">
          <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="contact-name"
            type="text"
            {...register('name')}
            aria-invalid={!!errors.name}
            className={cn(
              'block w-full rounded-md border px-3 py-2.5 text-sm shadow-soft-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-colors',
              errors.name ? 'border-destructive' : 'border-border focus:border-primary/50'
            )}
            placeholder="Dr. Your Name"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="field-group">
          <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="contact-email"
            type="email"
            {...register('email')}
            aria-invalid={!!errors.email}
            className={cn(
              'block w-full rounded-md border px-3 py-2.5 text-sm shadow-soft-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-colors',
              errors.email ? 'border-destructive' : 'border-border focus:border-primary/50'
            )}
            placeholder="you@clinic.com"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="contact-subject" className="block text-sm font-medium text-slate-700">
          Subject
        </label>
        <input
          id="contact-subject"
          type="text"
          {...register('subject')}
          aria-invalid={!!errors.subject}
          className={cn(
            'block w-full rounded-md border px-3 py-2.5 text-sm shadow-soft-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-colors',
            errors.subject ? 'border-destructive' : 'border-border focus:border-primary/50'
          )}
          placeholder="e.g. Question about pricing"
        />
        {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
      </div>

      <div className="field-group">
        <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700">
          Message
        </label>
        <textarea
          id="contact-message"
          rows={5}
          {...register('message')}
          aria-invalid={!!errors.message}
          className={cn(
            'block w-full rounded-md border px-3 py-2.5 text-sm shadow-soft-sm resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-colors',
            errors.message ? 'border-destructive' : 'border-border focus:border-primary/50'
          )}
          placeholder="Tell us how we can help..."
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-teal',
          'transition-all duration-200 hover:bg-primary/90 hover:shadow-teal-lg',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-60'
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send Message
          </>
        )}
      </button>
    </form>
  )
}
