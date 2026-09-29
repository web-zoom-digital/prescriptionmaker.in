import { MetadataRoute } from 'next'
import { TEMPLATES } from '@prescriptionmaker/config/templates'

export default function sitemap(): MetadataRoute.Sitemap {
  const BASE_URL = 'https://prescriptionmaker.in'
  const now = new Date().toISOString()

  const staticPages = [
    { url: BASE_URL, priority: 1.0, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/features`, priority: 0.9, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/templates`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/pricing`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/how-it-works`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/blog`, priority: 0.7, changeFrequency: 'daily' as const },
    { url: `${BASE_URL}/faq`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/about`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/contact`, priority: 0.6, changeFrequency: 'yearly' as const },
    { url: `${BASE_URL}/privacy`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${BASE_URL}/terms`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${BASE_URL}/refund-policy`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${BASE_URL}/disclaimer`, priority: 0.3, changeFrequency: 'yearly' as const },
  ]

  const templatePages = TEMPLATES.filter((t) => t.isPublished).map((template) => ({
    url: `${BASE_URL}/templates/${template.slug}`,
    priority: 0.8,
    changeFrequency: 'monthly' as const,
    lastModified: new Date(now),
  }))

  return [
    ...staticPages.map((page) => ({ ...page, lastModified: new Date(now) })),
    ...templatePages,
  ]
}
