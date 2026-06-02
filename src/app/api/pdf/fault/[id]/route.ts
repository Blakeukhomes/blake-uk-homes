import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { faultTranscriptPdf } from '@/lib/pdf'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: fault } = await supabase
    .from('fault_reports')
    .select('*, properties(nickname, address_line_1, city, postcode), tenants(full_name, email, phone)')
    .eq('id', params.id).single()
  if (!fault) return new NextResponse('Not found', { status: 404 })

  const { data: events = [] } = await supabase
    .from('fault_events').select('*').eq('fault_id', params.id).order('occurred_at')
  const { data: bookings = [] } = await supabase
    .from('contractor_bookings').select('*').eq('fault_id', params.id).order('scheduled_for')

  const f = fault as any
  const pdf = faultTranscriptPdf({
    property: {
      nickname: f.properties.nickname,
      address: `${f.properties.address_line_1}, ${f.properties.city} ${f.properties.postcode}`,
    },
    tenant: f.tenants ? { name: f.tenants.full_name, email: f.tenants.email, phone: f.tenants.phone } : null,
    fault: {
      reference: f.reference, category: f.category, severity: f.severity,
      description: f.description, reported_at: f.reported_at, current_state: f.current_state,
    },
    events: (events ?? []) as any,
    bookings: (bookings ?? []) as any,
  })

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="fault-${f.reference}.pdf"`,
    },
  })
}
