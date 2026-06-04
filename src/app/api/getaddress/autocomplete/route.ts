// Proxy to getaddress.io autocomplete — keeps the API key server-side.
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ suggestions: [] })

  const key = process.env.GETADDRESS_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'GETADDRESS_API_KEY is not set in the server environment' },
      { status: 500 },
    )
  }

  try {
    const url = `https://api.getaddress.io/autocomplete/${encodeURIComponent(q)}?api-key=${key}`
    const r = await fetch(url, { cache: 'no-store' })
    if (!r.ok) {
      const body = await r.text().catch(() => '')
      return NextResponse.json(
        { error: `getaddress.io returned ${r.status}`, detail: body.slice(0, 200) },
        { status: 502 },
      )
    }
    const data = await r.json() as { suggestions?: Array<{ id: string; address: string; url: string }> }
    return NextResponse.json({ suggestions: data.suggestions ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Network error' }, { status: 502 })
  }
}
