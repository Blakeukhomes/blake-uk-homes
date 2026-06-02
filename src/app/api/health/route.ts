import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ ok: true, app: 'Blake UK Homes', time: new Date().toISOString() })
}
