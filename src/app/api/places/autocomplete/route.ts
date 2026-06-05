// Proxy to Google Places API (New) :autocomplete endpoint.
// Holds the API key server-side. Returns a normalized suggestions array.
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GOOGLE_URL = 'https://places.googleapis.com/v1/places:autocomplete'

interface GooglePrediction {
  placePrediction?: {
    placeId?: string
    text?: { text?: string }
    structuredFormat?: {
      mainText?: { text?: string }
      secondaryText?: { text?: string }
    }
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ suggestions: [] })

  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'GOOGLE_PLACES_API_KEY is not set in the server environment' },
      { status: 500 },
    )
  }

  try {
    const r = await fetch(GOOGLE_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
      },
      body: JSON.stringify({
        input: q,
        includedRegionCodes: ['uk'],
        // Bias toward street addresses and premises (not POIs / businesses)
        includedPrimaryTypes: ['street_address', 'premise', 'subpremise', 'route', 'postal_code'],
        languageCode: 'en',
      }),
    })

    if (!r.ok) {
      const body = await r.text().catch(() => '')
      return NextResponse.json(
        { error: `Google Places returned ${r.status}`, detail: body.slice(0, 400) },
        { status: 502 },
      )
    }

    const data = await r.json() as { suggestions?: GooglePrediction[] }
    const suggestions = (data.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is NonNullable<typeof p> => Boolean(p?.placeId && p?.text?.text))
      .map((p) => ({
        id: p.placeId!,
        address: p.text!.text!,
        main: p.structuredFormat?.mainText?.text ?? '',
        secondary: p.structuredFormat?.secondaryText?.text ?? '',
      }))

    return NextResponse.json({ suggestions })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Network error' }, { status: 502 })
  }
}
