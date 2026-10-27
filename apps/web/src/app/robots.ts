import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/editor/',
          '/api/auth/',
          '/api/prescriptions/',
          '/_next/',
        ],
      },
      {
        // Allow AI crawlers to access public content for Generative Engine Optimization (GEO) & AEO
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'CCBot',
          'anthropic-ai',
          'Claude-Web',
          'PerplexityBot',
          'Google-Extended',
          'Bingbot',
          'Applebot-Extended',
          'cohere-ai',
        ],
        allow: [
          '/',
          '/features',
          '/templates',
          '/pricing',
          '/how-it-works',
          '/compliance',
          '/faq',
          '/about',
          '/prescription-format',
          '/abbreviations',
          '/specialties',
          '/dosage-calculator',
          '/telemedicine-prescription',
          '/contact',
          '/privacy',
          '/terms',
          '/refund',
          '/disclaimer',
          '/llms.txt',
          '/llms-full.txt',
        ],
        disallow: [
          '/dashboard/',
          '/editor/',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://prescriptionmaker.in/sitemap.xml',
    host: 'https://prescriptionmaker.in',
  }
}
