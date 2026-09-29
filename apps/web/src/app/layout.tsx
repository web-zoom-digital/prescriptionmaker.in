import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0d9488' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://prescriptionmaker.in'),

  title: {
    default: 'PrescriptionMaker — Digital Prescription Software for Doctors',
    template: '%s | PrescriptionMaker',
  },

  description:
    'Create professional digital prescriptions in minutes. PrescriptionMaker offers 15+ templates, a form-filling editor, and a hand-mode drawing editor — optimized for Indian doctors and clinics.',

  keywords: [
    'prescription maker',
    'digital prescription',
    'online prescription maker',
    'prescription template',
    'doctor prescription software',
    'prescription PDF',
    'prescription editor',
    'medical prescription maker',
    'prescription maker India',
    'digital prescription maker',
  ],

  authors: [{ name: 'PrescriptionMaker', url: 'https://prescriptionmaker.in' }],

  creator: 'PrescriptionMaker',

  publisher: 'PrescriptionMaker',

  category: 'Healthcare Software',

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://prescriptionmaker.in',
    siteName: 'PrescriptionMaker',
    title: 'PrescriptionMaker — Digital Prescription Software for Doctors',
    description:
      'Create professional digital prescriptions in minutes. 15+ templates, form editor, and hand-mode drawing editor for Indian doctors and clinics.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PrescriptionMaker — Digital Prescription Software',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'PrescriptionMaker — Digital Prescription Software',
    description:
      'Create professional digital prescriptions in minutes. 15+ templates, form editor, and hand-mode drawing editor.',
    images: ['/og-image.png'],
    creator: '@prescriptionmaker',
    site: '@prescriptionmaker',
  },

  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-16x16.png',
  },

  manifest: '/site.webmanifest',

  alternates: {
    canonical: 'https://prescriptionmaker.in',
  },

  verification: {
    google: 'your-google-search-console-verification-code',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'PrescriptionMaker',
              url: 'https://prescriptionmaker.in',
              logo: 'https://prescriptionmaker.in/logo.png',
              description:
                'PrescriptionMaker provides digital prescription software for doctors and clinics in India.',
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer support',
                email: 'support@prescriptionmaker.in',
                availableLanguage: ['English', 'Hindi'],
              },
              sameAs: [
                'https://twitter.com/prescriptionmaker',
                'https://linkedin.com/company/prescriptionmaker',
              ],
            }),
          }}
        />

        {/* WebSite Schema with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'PrescriptionMaker',
              url: 'https://prescriptionmaker.in',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://prescriptionmaker.in/search?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />

        {/* SoftwareApplication Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'PrescriptionMaker',
              applicationCategory: 'MedicalApplication',
              operatingSystem: 'Web Browser',
              url: 'https://prescriptionmaker.in',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'INR',
              },
              description:
                'Digital prescription maker for doctors. Create, edit, and download professional prescriptions as PDF.',
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: 'font-sans text-sm',
            },
          }}
        />
      </body>
    </html>
  )
}
