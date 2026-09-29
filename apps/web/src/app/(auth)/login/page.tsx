import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your PrescriptionMaker account to access your prescriptions and templates.',
  robots: { index: false, follow: false },
}

export { default } from './login-page'
