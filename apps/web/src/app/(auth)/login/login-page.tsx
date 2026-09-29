'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, FileText, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { loginSchema, type LoginFormValues } from '@prescriptionmaker/validation'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error?.message ?? 'Login failed. Please try again.')
        return
      }

      toast.success('Welcome back!')
      router.push('/dashboard')
      router.refresh()
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

        <div>
          <blockquote className="border-l-2 border-teal-500 pl-4">
            <p className="text-base leading-relaxed text-slate-300">
              &ldquo;Creating prescriptions used to take me 5 minutes per patient. With
              PrescriptionMaker, it takes under a minute. The templates are professional and the
              PDF quality is excellent.&rdquo;
            </p>
            <footer className="mt-3 text-sm text-slate-500">
              — Dr. Anand Krishnan, General Physician, Pune
            </footer>
          </blockquote>
        </div>

        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} PrescriptionMaker. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-10">
        {/* Mobile logo */}
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Log in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div className="field-group">
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                {...register('email')}
                className={cn(
                  'block w-full rounded-md border px-3 py-2.5 text-sm shadow-soft-sm',
                  'placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0',
                  'transition-colors duration-150',
                  errors.email
                    ? 'border-destructive focus:ring-destructive/50'
                    : 'border-border focus:border-primary/50'
                )}
                placeholder="you@clinic.com"
              />
              {errors.email && (
                <p id="login-email-error" className="text-xs text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="field-group">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  {...register('password')}
                  className={cn(
                    'block w-full rounded-md border px-3 py-2.5 pr-10 text-sm shadow-soft-sm',
                    'placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0',
                    'transition-colors duration-150',
                    errors.password
                      ? 'border-destructive focus:ring-destructive/50'
                      : 'border-border focus:border-primary/50'
                  )}
                  placeholder="Enter your password"
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
              {errors.password && (
                <p id="login-password-error" className="text-xs text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
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
                  Logging in…
                </>
              ) : (
                <>
                  Log in
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:text-primary/80">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
