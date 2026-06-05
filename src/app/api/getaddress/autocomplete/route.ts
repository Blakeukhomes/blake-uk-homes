// Deprecated: replaced by /api/places/autocomplete (Google Places).
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  return NextResponse.json({ error: 'This endpoint has been replaced by /api/places/autocomplete' }, { status: 410 })
}
