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
    default: 'PrescriptionMaker — Free Digital Prescription Software for Indian Doctors',
    template: '%s | PrescriptionMaker',
  },

  description:
    'India\'s best free digital prescription maker for doctors. Create professional e-prescriptions in seconds with 15+ templates. Supports PDF download, WhatsApp sharing, and hand-mode drawing. Trusted by doctors across India.',

  keywords: [
    'prescription maker',
    'digital prescription',
    'online prescription maker',
    'prescription template India',
    'doctor prescription software',
    'prescription PDF download',
    'free prescription maker',
    'e-prescription India',
    'medical prescription maker',
    'prescription maker for doctors',
    'prescription maker in Hindi',
    'OPD prescription software',
    'clinic prescription software',
    'prescription WhatsApp share',
    'prescription maker online free',
    'MBBS doctor prescription',
    'general physician prescription',
    'digital prescription India',
    'prescription generator',
    'doctor pad online',
  ],

  authors: [{ name: 'PrescriptionMaker', url: 'https://prescriptionmaker.in' }],

  creator: 'PrescriptionMaker',

  publisher: 'PrescriptionMaker',

  category: 'Healthcare Software',

  // Geo-targeting for India
  other: {
    'geo.region': 'IN',
    'geo.placename': 'India',
    'ICBM': '20.5937, 78.9629',
    'DC.Language': 'en-IN',
  },

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
    title: 'PrescriptionMaker — Free Digital Prescription Software for Indian Doctors',
    description:
      'Create professional e-prescriptions in seconds. 15+ templates, PDF download, WhatsApp sharing, hand-mode drawing — trusted by Indian doctors.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PrescriptionMaker — Digital Prescription Software for Doctors in India',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'PrescriptionMaker — Free Digital Prescription Software',
    description:
      'Create professional e-prescriptions in seconds. 15+ templates, PDF download, WhatsApp sharing for Indian doctors.',
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
    languages: {
      'en-IN': 'https://prescriptionmaker.in',
    },
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
              logo: {
                '@type': 'ImageObject',
                url: 'https://prescriptionmaker.in/logo.png',
                width: 512,
                height: 512,
              },
              description:
                'PrescriptionMaker provides free digital prescription software for doctors and clinics in India. Create, manage, and export prescriptions as PDF.',
              foundingLocation: {
                '@type': 'Place',
                addressCountry: 'IN',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer support',
                email: 'support@prescriptionmaker.in',
                availableLanguage: ['English', 'Hindi'],
                areaServed: 'IN',
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
              inLanguage: 'en-IN',
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
              applicationSubCategory: 'Prescription Software',
              operatingSystem: 'Web Browser, Android, iOS',
              url: 'https://prescriptionmaker.in',
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                reviewCount: '150',
                bestRating: '5',
              },
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
              },
              audience: {
                '@type': 'Audience',
                audienceType: 'Medical Doctors, Healthcare Professionals',
                geographicArea: {
                  '@type': 'Country',
                  name: 'India',
                },
              },
              description:
                'Free digital prescription maker for doctors in India. Create, edit, and download professional prescriptions as PDF with 15+ templates.',
              featureList: [
                'PDF Download',
                'WhatsApp Sharing',
                '15+ Premium Templates',
                'Hand Drawing Mode',
                'Form-based Editor',
                'Multi-language Support',
              ],
            }),
          }}
        />

        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'Is PrescriptionMaker free to use?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, PrescriptionMaker offers a free plan with access to basic templates and PDF download. Premium plans unlock more templates and advanced features.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Can I download prescriptions as PDF?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, you can download any prescription as a professionally formatted PDF directly from your browser or mobile device.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Can I share prescriptions on WhatsApp?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, PrescriptionMaker supports sharing prescriptions directly to WhatsApp from mobile devices.',
                  },
                },
              ],
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
