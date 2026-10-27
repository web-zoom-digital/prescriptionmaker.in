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
    `${baseUrl}/faq`,
    `${baseUrl}/compliance`,
    `${baseUrl}/about`,
    `${baseUrl}/contact`,
    `${baseUrl}/privacy`,
    `${baseUrl}/terms`,
    `${baseUrl}/refund`,
    `${baseUrl}/disclaimer`,
  ]

  const templatePages = TEMPLATES.filter((t) => t.isPublished).map(
    (t) => `${baseUrl}/templates/${t.slug}`
  )

  return [...staticPages, ...templatePages]
}

async function submitToIndexNow(urls: string[]) {
  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  }

  // Submit to IndexNow master API (propagates to Bing, Yandex, etc.)
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(payload),
  })

  return {
    status: response.status,
    ok: response.ok,
    statusText: response.statusText,
  }
}

/**
 * GET /api/indexnow
 * Submits all public URLs to Bing IndexNow API.
 */
export async function GET(req: NextRequest) {
  try {
    const urls = getAllSiteUrls()
    const result = await submitToIndexNow(urls)

    return NextResponse.json({
      success: result.ok || result.status === 200 || result.status === 202,
      message: 'URLs submitted to Bing IndexNow successfully',
      indexNowStatus: result.status,
      host: HOST,
      keyLocation: KEY_LOCATION,
      submittedCount: urls.length,
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

    const result = await submitToIndexNow(validUrls)

    return NextResponse.json({
      success: result.ok || result.status === 200 || result.status === 202,
      message: `${validUrls.length} URL(s) submitted to Bing IndexNow`,
      indexNowStatus: result.status,
      host: HOST,
      keyLocation: KEY_LOCATION,
      submittedCount: validUrls.length,
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
