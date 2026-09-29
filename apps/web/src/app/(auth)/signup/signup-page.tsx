'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, FileText, ArrowRight, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { signupSchema, type SignupFormValues } from '@prescriptionmaker/validation'
import { cn } from '@/lib/utils'

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'Uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { label: 'Number', test: (v: string) => /\d/.test(v) },
]

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  })

  const watchedPassword = watch('password', '')

  const onSubmit = async (data: SignupFormValues) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error?.message ?? 'Signup failed. Please try again.')
        return
      }

      if (result.data?.requiresEmailVerification) {
        toast.success('Account created! Please check your email to verify your account.')
        // Redirect to a specific waiting page or login
        router.push('/login?message=Check your email for the confirmation link')
      } else {
        toast.success('Account created! Setting up your workspace…')
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden flex-col justify-between bg-slate-900 p-10 lg:flex lg:w-[420px] xl:w-[480px]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary shadow-teal">
            <FileText className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-base font-semibold text-white">
            Prescription<span className="text-teal-400">Maker</span>
          </span>
        </Link>

        <div className="space-y-4">
          {[
            '15+ professional prescription templates',
            'Form editor with structured fields',
            'Hand-mode canvas drawing editor',
            'High-quality A4 PDF export',
            'Autosave — never lose your work',
            'Secure, private, encrypted storage',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-teal-500/20">
                <Check className="h-3 w-3 text-teal-400" aria-hidden="true" />
              </div>
              <span className="text-sm text-slate-300">{feature}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} PrescriptionMaker. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-10">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary shadow-teal">
            <FileText className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-base font-semibold">
            Prescription<span className="text-primary">Maker</span>
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Free plan available. No credit card required.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Full Name */}
            <div className="field-group">
              <label htmlFor="signup-name" className="block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'signup-name-error' : undefined}
                {...register('name')}
                className={cn(
                  'block w-full rounded-md border px-3 py-2.5 text-sm shadow-soft-sm',
                  'placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0',
                  'transition-colors duration-150',
                  errors.name ? 'border-destructive' : 'border-border focus:border-primary/50'
                )}
                placeholder="Dr. Full Name"
              />
              {errors.name && (
                <p id="signup-name-error" className="text-xs text-destructive" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="field-group">
              <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'signup-email-error' : undefined}
                {...register('email')}
                className={cn(
                  'block w-full rounded-md border px-3 py-2.5 text-sm shadow-soft-sm',
                  'placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0',
                  'transition-colors duration-150',
                  errors.email ? 'border-destructive' : 'border-border focus:border-primary/50'
                )}
                placeholder="you@clinic.com"
              />
              {errors.email && (
                <p id="signup-email-error" className="text-xs text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="field-group">
              <label
                htmlFor="signup-password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  aria-describedby="signup-password-requirements"
                  {...register('password', {
                    onChange: (e) => setPassword(e.target.value),
                  })}
                  className={cn(
                    'block w-full rounded-md border px-3 py-2.5 pr-10 text-sm shadow-soft-sm',
                    'placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0',
                    'transition-colors duration-150',
                    errors.password ? 'border-destructive' : 'border-border focus:border-primary/50'
                  )}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Password requirements */}
              {(watchedPassword.length > 0 || errors.password) && (
                <div
                  id="signup-password-requirements"
                  className="mt-2 grid grid-cols-2 gap-1"
                  aria-live="polite"
                  aria-label="Password requirements"
                >
                  {PASSWORD_REQUIREMENTS.map((req) => {
                    const met = req.test(watchedPassword)
                    return (
                      <div
                        key={req.label}
                        className={cn(
                          'flex items-center gap-1.5 text-xs',
                          met ? 'text-teal-600' : 'text-muted-foreground'
                        )}
                      >
                        <Check className={cn('h-3 w-3', met ? 'opacity-100' : 'opacity-30')} aria-hidden="true" />
                        {req.label}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="field-group">
              <label
                htmlFor="signup-confirm-password"
                className="block text-sm font-medium text-slate-700"
              >
                Confirm password
              </label>
              <input
                id="signup-confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? 'signup-confirm-password-error' : undefined
                }
                {...register('confirmPassword')}
                className={cn(
                  'block w-full rounded-md border px-3 py-2.5 text-sm shadow-soft-sm',
                  'placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0',
                  'transition-colors duration-150',
                  errors.confirmPassword
                    ? 'border-destructive'
                    : 'border-border focus:border-primary/50'
                )}
                placeholder="Repeat your password"
              />
              {errors.confirmPassword && (
                <p
                  id="signup-confirm-password-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="signup-submit"
              disabled={isSubmitting}
              className={cn(
                'group flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-teal',
                'transition-all duration-200 hover:bg-primary/90 hover:shadow-teal-lg',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Creating account…
                </>
              ) : (
                <>
                  Create free account
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:text-primary/80">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:text-primary/80">
                Privacy Policy
              </Link>
              .
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
