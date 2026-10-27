import { NextRequest, NextResponse } from 'next/server'
import { TEMPLATES } from '@prescriptionmaker/config/templates'

const INDEXNOW_KEY = 'b4f8a3c1e2d547898012f45c9a7e3d16'
const HOST = 'prescriptionmaker.in'
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`

// Canonical list of public URLs to submit for indexing
function getAllSiteUrls(): string[] {
  const baseUrl = `https://${HOST}`
  const staticPages = [
    baseUrl,
    `${baseUrl}/features`,
    `${baseUrl}/templates`,
    `${baseUrl}/pricing`,
    `${baseUrl}/how-it-works`,
    `${baseUrl}/compliance`,
    `${baseUrl}/faq`,
    `${baseUrl}/about`,
    `${baseUrl}/prescription-format`,
    `${baseUrl}/dosage-calculator`,
    `${baseUrl}/telemedicine-prescription`,
    `${baseUrl}/abbreviations`,
    `${baseUrl}/specialties`,
    `${baseUrl}/contact`,
    `${baseUrl}/privacy`,
    `${baseUrl}/terms`,
    `${baseUrl}/refund`,
    `${baseUrl}/refund-policy`,
    `${baseUrl}/disclaimer`,
  ]

  const templatePages = TEMPLATES.filter((t) => t.isPublished).map(
    (t) => `${baseUrl}/templates/${t.slug}`
  )

  return [...staticPages, ...templatePages]
}

async function submitToIndexNowEndpoints(urls: string[]) {
  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  }

  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
  ]

  const results = await Promise.allSettled(
    endpoints.map(async (endpoint) => {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      })
      return {
        endpoint,
        status: res.status,
        ok: res.ok || res.status === 200 || res.status === 202,
      }
    })
  )

  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { endpoint: endpoints[i], status: 500, ok: false, error: String(r.reason) }
  )
}

/**
 * GET /api/indexnow
 * Submits all public URLs to both IndexNow and Bing IndexNow endpoints.
 */
export async function GET(req: NextRequest) {
  try {
    const urls = getAllSiteUrls()
    const results = await submitToIndexNowEndpoints(urls)

    return NextResponse.json({
      success: results.some((r) => r.ok),
      message: 'URLs submitted to Bing & IndexNow APIs successfully',
      host: HOST,
      keyLocation: KEY_LOCATION,
      submittedCount: urls.length,
      endpoints: results,
      urls,
    })
  } catch (error) {
    console.error('Error submitting to IndexNow:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit to IndexNow',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/indexnow
 * Accepts custom URL list or submits all URLs.
 * Body: { urls?: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const urlsToSubmit: string[] =
      Array.isArray(body?.urls) && body.urls.length > 0 ? body.urls : getAllSiteUrls()

    // Validate that URLs belong to prescriptionmaker.in
    const validUrls = urlsToSubmit.filter((url) => {
      try {
        const parsed = new URL(url)
        return parsed.hostname === HOST || parsed.hostname === `www.${HOST}`
      } catch {
        return false
      }
    })

    if (validUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid URLs provided for domain prescriptionmaker.in' },
        { status: 400 }
      )
    }

    const results = await submitToIndexNowEndpoints(validUrls)

    return NextResponse.json({
      success: results.some((r) => r.ok),
      message: `${validUrls.length} URL(s) submitted to Bing & IndexNow`,
      host: HOST,
      keyLocation: KEY_LOCATION,
      submittedCount: validUrls.length,
      endpoints: results,
      urls: validUrls,
    })
  } catch (error) {
    console.error('Error in POST /api/indexnow:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit to IndexNow',
      },
      { status: 500 }
    )
  }
}
