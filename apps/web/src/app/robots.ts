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
          '/api/',
          '/_next/',
        ],
      },
      {
        // Allow AI crawlers to access public content for GEO
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web', 'PerplexityBot'],
        allow: [
          '/',
          '/features',
          '/templates',
          '/pricing',
          '/how-it-works',
          '/blog',
          '/faq',
          '/about',
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
