import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { section13Pdf } from '@/lib/pdf'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const fd = await req.formData()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: property } = await supabase.from('properties').select('*').eq('id', String(fd.get('property_id'))).single()
  const { data: tenant }   = await supabase.from('tenants').select('full_name').eq('id', String(fd.get('tenant_id'))).maybeSingle()
  if (!property) return new NextResponse('Property not found', { status: 404 })

  const pdf = section13Pdf({
    landlord: {
      name: String(fd.get('landlord_name')),
      address: String(fd.get('landlord_address')),
    },
    tenant: { name: tenant?.full_name ?? 'The tenant' },
    property: { address: `${property.address_line_1}, ${property.city} ${property.postcode}` },
    currentRent: Number(fd.get('current_rent') ?? 0),
    newRent: Number(fd.get('new_rent') ?? 0),
    effectiveDate: String(fd.get('effective_date')),
    reason: (fd.get('reason') as string) || null,
  })

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="section13-${property.nickname.replace(/\s+/g, '-')}.pdf"`,
    },
  })
}
