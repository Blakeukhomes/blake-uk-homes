// Fetch the full structured address from Google Places (New) for a placeId.
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface AddressComponent {
  longText?: string
  shortText?: string
  types?: string[]
}

// Pick a component by Google address component type
function getComponent(components: AddressComponent[], type: string, prefer: 'longText' | 'shortText' = 'longText'): string {
  const found = components.find((c) => c.types?.includes(type))
  if (!found) return ''
  return (prefer === 'shortText' ? found.shortText : found.longText) || found.longText || found.shortText || ''
}

export async function GET(_req: Request, { params }: { params: { placeId: string } }) {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'GOOGLE_PLACES_API_KEY is not set in the server environment' },
      { status: 500 },
    )
  }

  try {
    const placeId = encodeURIComponent(params.placeId)
    const url = `https://places.googleapis.com/v1/places/${placeId}`
    const r = await fetch(url, {
      cache: 'no-store',
      headers: {
        'X-Goog-Api-Key': key,
        // Restrict the field mask to keep response small and lower the cost tier
        'X-Goog-FieldMask': 'addressComponents,formattedAddress',
      },
    })

    if (!r.ok) {
      const body = await r.text().catch(() => '')
      return NextResponse.json(
        { error: `Google Places returned ${r.status}`, detail: body.slice(0, 400) },
        { status: 502 },
      )
    }

    const data = await r.json() as {
      addressComponents?: AddressComponent[]
      formattedAddress?: string
    }
    const components = data.addressComponents ?? []

    const subpremise   = getComponent(components, 'subpremise')          // Flat / Unit / Apt number
    const streetNumber = getComponent(components, 'street_number')
    const route        = getComponent(components, 'route')               // Street name
    const postalTown   = getComponent(components, 'postal_town')         // UK-specific (preferred for city)
    const locality     = getComponent(components, 'locality')            // fallback if no postal_town
    const adminArea2   = getComponent(components, 'administrative_area_level_2')
    const postalCode   = getComponent(components, 'postal_code')
    const country      = getComponent(components, 'country')

    // Compose line 1: "<street_number> <route>" if both present, otherwise just route
    const line1 = [streetNumber, route].filter(Boolean).join(' ').trim()
    // line 2 used for sub-premise (flat/unit) if present, otherwise empty
    const line2 = subpremise ? `Flat ${subpremise}` : ''
    const city  = postalTown || locality || adminArea2 || ''

    return NextResponse.json({
      address_line_1: line1 || data.formattedAddress?.split(',')[0] || '',
      address_line_2: line2 || null,
      city,
      postcode: postalCode,
      country: country === 'United Kingdom' || country === 'England' || country === 'Scotland' || country === 'Wales' || country === 'Northern Ireland'
        ? 'United Kingdom'
        : (country || 'United Kingdom'),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Network error' }, { status: 502 })
  }
}
