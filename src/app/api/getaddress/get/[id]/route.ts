// Fetch the full structured address for a given getaddress.io suggestion id.
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const key = process.env.GETADDRESS_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'GETADDRESS_API_KEY is not set in the server environment' },
      { status: 500 },
    )
  }

  try {
    const id = encodeURIComponent(params.id)
    const url = `https://api.getaddress.io/get/${id}?api-key=${key}`
    const r = await fetch(url, { cache: 'no-store' })
    if (!r.ok) {
      const body = await r.text().catch(() => '')
      return NextResponse.json(
        { error: `getaddress.io returned ${r.status}`, detail: body.slice(0, 200) },
        { status: 502 },
      )
    }
    const data = await r.json() as Record<string, any>

    // Combine line_1 / building_name etc into a clean primary line
    const line1Parts = [data.sub_building_name, data.sub_building_number, data.building_name, data.building_number, data.thoroughfare]
      .map((v) => (v ?? '').toString().trim())
      .filter(Boolean)
    const cleanLine1 = line1Parts.length ? line1Parts.join(' ').replace(/\s+/g, ' ') : (data.line_1 ?? '')

    return NextResponse.json({
      address_line_1: cleanLine1 || data.line_1 || '',
      address_line_2: data.line_2 || data.locality || null,
      city:           data.town_or_city || '',
      postcode:       data.postcode || '',
      country:        data.country === 'England' || data.country === 'Scotland' || data.country === 'Wales' || data.country === 'Northern Ireland'
                        ? 'United Kingdom'
                        : (data.country || 'United Kingdom'),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Network error' }, { status: 502 })
  }
}
